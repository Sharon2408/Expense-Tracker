const pool = require('../../db/pool');
const ApiError = require('../../utils/apiError');
const { validateExpenseInput } = require('./expenses.validation');

const SORT_MAP = {
  latest: 'expense_date DESC, created_at DESC',
  oldest: 'expense_date ASC, created_at ASC',
  highest: 'amount DESC',
  lowest: 'amount ASC',
};

/**
 * List expenses for the authenticated user only. `userId` must always come
 * from the verified access token (see middleware/auth.js), never from query
 * params, so this query can never leak another user's rows.
 */
async function list(userId, query) {
  const {
    from,
    to,
    categoryId,
    paymentMethod,
    search,
    sort = 'latest',
    page = 1,
    pageSize = 25,
  } = query;

  const conditions = ['e.user_id = $1'];
  const params = [userId];

  if (from) {
    params.push(from);
    conditions.push(`e.expense_date >= $${params.length}`);
  }
  if (to) {
    params.push(to);
    conditions.push(`e.expense_date <= $${params.length}`);
  }
  if (categoryId) {
    params.push(categoryId);
    conditions.push(`e.category_id = $${params.length}`);
  }
  if (paymentMethod) {
    params.push(paymentMethod);
    conditions.push(`e.payment_method = $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(e.description ILIKE $${params.length} OR e.notes ILIKE $${params.length})`);
  }

  const whereClause = conditions.join(' AND ');
  const orderClause = SORT_MAP[sort] || SORT_MAP.latest;
  const limit = Math.min(Math.max(Number(pageSize) || 25, 1), 200);
  const offset = (Math.max(Number(page) || 1, 1) - 1) * limit;

  const countResult = await pool.query(
    `SELECT COUNT(*)::int AS total FROM expenses e WHERE ${whereClause}`,
    params,
  );

  params.push(limit);
  params.push(offset);
  const rowsResult = await pool.query(
    `SELECT e.*, c.name AS category_name, c.icon AS category_icon
     FROM expenses e
     JOIN categories c ON c.id = e.category_id
     WHERE ${whereClause}
     ORDER BY ${orderClause}
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  );

  return {
    items: rowsResult.rows,
    total: countResult.rows[0].total,
    page: Number(page) || 1,
    pageSize: limit,
  };
}

async function getOne(userId, id) {
  const result = await pool.query(
    `SELECT e.*, c.name AS category_name, c.icon AS category_icon
     FROM expenses e JOIN categories c ON c.id = e.category_id
     WHERE e.id = $1 AND e.user_id = $2`,
    [id, userId],
  );
  if (!result.rows[0]) throw new ApiError(404, 'Expense not found');
  return result.rows[0];
}

async function assertCategoryOwnedByUser(userId, categoryId) {
  const result = await pool.query('SELECT 1 FROM categories WHERE id = $1 AND user_id = $2', [
    categoryId,
    userId,
  ]);
  if (result.rows.length === 0) {
    throw new ApiError(400, 'Category does not belong to this user', { categoryId: 'Invalid category' });
  }
}

async function create(userId, body) {
  const data = validateExpenseInput(body);
  await assertCategoryOwnedByUser(userId, data.categoryId);

  const result = await pool.query(
    `INSERT INTO expenses (user_id, category_id, amount, description, expense_date, payment_method, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [
      userId,
      data.categoryId,
      data.amount,
      data.description || '',
      data.expenseDate,
      data.paymentMethod || 'Other',
      data.notes || '',
    ],
  );
  return result.rows[0];
}

async function update(userId, id, body) {
  const data = validateExpenseInput(body, { partial: true });
  if (data.categoryId) {
    await assertCategoryOwnedByUser(userId, data.categoryId);
  }

  const result = await pool.query(
    `UPDATE expenses SET
       amount = COALESCE($3, amount),
       category_id = COALESCE($4, category_id),
       description = COALESCE($5, description),
       expense_date = COALESCE($6, expense_date),
       payment_method = COALESCE($7, payment_method),
       notes = COALESCE($8, notes),
       updated_at = now()
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [
      id,
      userId,
      data.amount,
      data.categoryId,
      data.description,
      data.expenseDate,
      data.paymentMethod,
      data.notes,
    ],
  );
  if (!result.rows[0]) throw new ApiError(404, 'Expense not found');
  return result.rows[0];
}

async function remove(userId, id) {
  const result = await pool.query('DELETE FROM expenses WHERE id = $1 AND user_id = $2 RETURNING id', [
    id,
    userId,
  ]);
  if (!result.rows[0]) throw new ApiError(404, 'Expense not found');
}

module.exports = { list, getOne, create, update, remove };
