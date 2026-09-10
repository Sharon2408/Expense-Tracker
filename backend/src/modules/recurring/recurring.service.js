const pool = require('../../db/pool');
const ApiError = require('../../utils/apiError');

const FREQUENCIES = ['weekly', 'monthly', 'quarterly', 'yearly'];

/**
 * `date` arrives as a JS Date parsed by `pg` at UTC midnight for a SQL DATE
 * column. Using local getDate()/setDate() etc. here would shift the day
 * whenever the server's local timezone is behind UTC (the local wall-clock
 * time for UTC midnight is still "yesterday"), so every read/write below
 * uses the UTC variant instead.
 */
function addInterval(date, frequency) {
  const d = new Date(date);
  switch (frequency) {
    case 'weekly':
      d.setUTCDate(d.getUTCDate() + 7);
      break;
    case 'monthly':
      d.setUTCMonth(d.getUTCMonth() + 1);
      break;
    case 'quarterly':
      d.setUTCMonth(d.getUTCMonth() + 3);
      break;
    case 'yearly':
      d.setUTCFullYear(d.getUTCFullYear() + 1);
      break;
    default:
      throw new ApiError(400, 'Invalid frequency');
  }
  return d.toISOString().slice(0, 10);
}

async function list(userId) {
  const result = await pool.query(
    `SELECT r.*, c.name AS category_name, c.icon AS category_icon
     FROM recurring_expenses r JOIN categories c ON c.id = r.category_id
     WHERE r.user_id = $1 ORDER BY r.next_due_date ASC`,
    [userId],
  );
  return result.rows;
}

async function create(userId, body) {
  const { description, amount, categoryId, paymentMethod, frequency, startDate, endDate } = body;

  if (!amount || Number(amount) <= 0) throw new ApiError(400, 'Amount must be greater than zero');
  if (!categoryId) throw new ApiError(400, 'Category is required');
  if (!FREQUENCIES.includes(frequency)) throw new ApiError(400, 'Invalid frequency');
  if (!startDate) throw new ApiError(400, 'Start date is required');

  const category = await pool.query('SELECT 1 FROM categories WHERE id = $1 AND user_id = $2', [
    categoryId,
    userId,
  ]);
  if (category.rows.length === 0) throw new ApiError(400, 'Invalid category');

  const nextDueDate = startDate;

  const result = await pool.query(
    `INSERT INTO recurring_expenses
       (user_id, category_id, amount, description, payment_method, frequency, start_date, end_date, next_due_date)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [
      userId,
      categoryId,
      amount,
      description || '',
      paymentMethod || 'Other',
      frequency,
      startDate,
      endDate || null,
      nextDueDate,
    ],
  );
  return result.rows[0];
}

async function update(userId, id, body) {
  const { description, amount, categoryId, paymentMethod, frequency, startDate, endDate, isActive } = body;
  if (frequency && !FREQUENCIES.includes(frequency)) throw new ApiError(400, 'Invalid frequency');

  const result = await pool.query(
    `UPDATE recurring_expenses SET
       description = COALESCE($3, description),
       amount = COALESCE($4, amount),
       category_id = COALESCE($5, category_id),
       payment_method = COALESCE($6, payment_method),
       frequency = COALESCE($7, frequency),
       start_date = COALESCE($8, start_date),
       end_date = $9,
       is_active = COALESCE($10, is_active),
       updated_at = now()
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [
      id,
      userId,
      description,
      amount,
      categoryId,
      paymentMethod,
      frequency,
      startDate,
      endDate === undefined ? null : endDate,
      isActive,
    ],
  );
  if (!result.rows[0]) throw new ApiError(404, 'Recurring expense not found');
  return result.rows[0];
}

async function remove(userId, id) {
  const result = await pool.query(
    'DELETE FROM recurring_expenses WHERE id = $1 AND user_id = $2 RETURNING id',
    [id, userId],
  );
  if (!result.rows[0]) throw new ApiError(404, 'Recurring expense not found');
}

/**
 * Generates expense rows for every active recurring rule whose next_due_date
 * has arrived. Designed to be called by a scheduler (see README "Recurring
 * expense automation"), but is safe to call on-demand/manually too: the
 * partial unique index on expenses(recurring_expense_id, expense_date) means
 * calling this twice for the same due date is a no-op the second time.
 */
async function generateDueExpenses(userId) {
  const client = await pool.connect();
  const generated = [];
  try {
    const due = await client.query(
      `SELECT * FROM recurring_expenses
       WHERE user_id = $1 AND is_active = true AND next_due_date <= CURRENT_DATE
         AND (end_date IS NULL OR next_due_date <= end_date)`,
      [userId],
    );

    for (const rule of due.rows) {
      await client.query('BEGIN');
      try {
        const inserted = await client.query(
          `INSERT INTO expenses (user_id, category_id, amount, description, expense_date, payment_method, notes, recurring_expense_id)
           VALUES ($1, $2, $3, $4, $5, $6, '', $7)
           ON CONFLICT (recurring_expense_id, expense_date) WHERE recurring_expense_id IS NOT NULL DO NOTHING
           RETURNING *`,
          [rule.user_id, rule.category_id, rule.amount, rule.description, rule.next_due_date, rule.payment_method, rule.id],
        );
        if (inserted.rows[0]) generated.push(inserted.rows[0]);

        const nextDue = addInterval(rule.next_due_date, rule.frequency);
        const stillActive = !rule.end_date || nextDue <= rule.end_date;
        await client.query(
          'UPDATE recurring_expenses SET next_due_date = $2, is_active = $3, updated_at = now() WHERE id = $1',
          [rule.id, nextDue, stillActive],
        );
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      }
    }
  } finally {
    client.release();
  }
  return generated;
}

module.exports = { FREQUENCIES, list, create, update, remove, generateDueExpenses };
