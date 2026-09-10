const pool = require('../../db/pool');
const ApiError = require('../../utils/apiError');

/**
 * Splits one CSV line into cells, respecting double-quoted fields (so a
 * quoted description/notes field containing a comma - which is exactly what
 * `toCsv` above produces - round-trips correctly instead of being split
 * apart). Handles doubled `""` as an escaped quote inside a field.
 */
function splitCsvLine(line) {
  const cells = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      cells.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells.map((c) => c.trim());
}

function toCsv(rows) {
  const header = ['Date', 'Description', 'Category', 'Payment Method', 'Amount', 'Notes'];
  const lines = [header.join(',')];
  for (const row of rows) {
    const cells = [
      row.expense_date,
      row.description,
      row.category_name,
      row.payment_method,
      row.amount,
      row.notes,
    ].map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`);
    lines.push(cells.join(','));
  }
  return lines.join('\n');
}

async function exportCsv(userId, from, to) {
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
  const result = await pool.query(
    `SELECT e.*, c.name AS category_name FROM expenses e JOIN categories c ON c.id = e.category_id
     WHERE ${conditions.join(' AND ')} ORDER BY e.expense_date DESC`,
    params,
  );
  return toCsv(result.rows);
}

async function exportJson(userId) {
  const [expenses, categories, monthlyBudgets, categoryBudgets, recurring] = await Promise.all([
    pool.query('SELECT * FROM expenses WHERE user_id = $1 ORDER BY expense_date DESC', [userId]),
    pool.query('SELECT * FROM categories WHERE user_id = $1', [userId]),
    pool.query('SELECT * FROM monthly_budgets WHERE user_id = $1', [userId]),
    pool.query('SELECT * FROM category_budgets WHERE user_id = $1', [userId]),
    pool.query('SELECT * FROM recurring_expenses WHERE user_id = $1', [userId]),
  ]);
  return {
    exportedAt: new Date().toISOString(),
    expenses: expenses.rows,
    categories: categories.rows,
    monthlyBudgets: monthlyBudgets.rows,
    categoryBudgets: categoryBudgets.rows,
    recurringExpenses: recurring.rows,
  };
}

/**
 * Parses + validates CSV rows without inserting anything, so the caller can
 * show validation errors before committing. Expected header:
 * Date,Description,Category,Payment Method,Amount,Notes
 */
function parseAndValidateCsv(csvText, categoryNameToId) {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) {
    throw new ApiError(400, 'CSV file is empty');
  }
  const [, ...dataLines] = lines; // skip header
  const valid = [];
  const errors = [];

  dataLines.forEach((line, index) => {
    const cells = splitCsvLine(line);
    const [date, description, categoryName, paymentMethod, amountStr, notes] = cells;
    const rowErrors = {};

    if (!date || Number.isNaN(new Date(date).getTime())) rowErrors.date = 'Invalid or missing date';
    const amount = Number(amountStr);
    if (!amountStr || Number.isNaN(amount) || amount <= 0) rowErrors.amount = 'Invalid amount';
    const categoryId = categoryNameToId.get((categoryName || '').toLowerCase());
    if (!categoryId) rowErrors.category = `Unknown category "${categoryName}"`;

    if (Object.keys(rowErrors).length > 0) {
      errors.push({ row: index + 2, errors: rowErrors });
    } else {
      valid.push({
        expenseDate: date,
        description: description || '',
        categoryId,
        paymentMethod: paymentMethod || 'Other',
        amount,
        notes: notes || '',
      });
    }
  });

  return { valid, errors };
}

async function importCsv(userId, csvText) {
  const categories = await pool.query('SELECT id, name FROM categories WHERE user_id = $1', [userId]);
  const categoryNameToId = new Map(categories.rows.map((c) => [c.name.toLowerCase(), c.id]));

  const { valid, errors } = parseAndValidateCsv(csvText, categoryNameToId);
  if (errors.length > 0) {
    return { imported: 0, skipped: errors.length, errors };
  }

  const client = await pool.connect();
  let imported = 0;
  try {
    await client.query('BEGIN');
    for (const row of valid) {
      // Best-effort duplicate guard: same user/date/amount/description already present.
      const dup = await client.query(
        `SELECT 1 FROM expenses WHERE user_id = $1 AND expense_date = $2 AND amount = $3 AND description = $4`,
        [userId, row.expenseDate, row.amount, row.description],
      );
      if (dup.rows.length > 0) continue;

      await client.query(
        `INSERT INTO expenses (user_id, category_id, amount, description, expense_date, payment_method, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [userId, row.categoryId, row.amount, row.description, row.expenseDate, row.paymentMethod, row.notes],
      );
      imported += 1;
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  return { imported, skipped: valid.length - imported, errors: [] };
}

module.exports = { exportCsv, exportJson, importCsv };
