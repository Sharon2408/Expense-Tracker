const pool = require('../../db/pool');
const ApiError = require('../../utils/apiError');
const { safePercentage, round2, toNumber } = require('../../utils/money');

function budgetStatus(percentUsed) {
  if (percentUsed > 100) return 'Exceeded';
  if (percentUsed >= 90) return 'High';
  if (percentUsed >= 70) return 'Warning';
  return 'Normal';
}

async function getMonthlySpend(userId, year, month) {
  const result = await pool.query(
    `SELECT COALESCE(SUM(amount), 0) AS total FROM expenses
     WHERE user_id = $1 AND EXTRACT(YEAR FROM expense_date) = $2 AND EXTRACT(MONTH FROM expense_date) = $3`,
    [userId, year, month],
  );
  return toNumber(result.rows[0].total);
}

async function getMonthlyBudget(userId, year, month) {
  const budgetResult = await pool.query(
    'SELECT * FROM monthly_budgets WHERE user_id = $1 AND year = $2 AND month = $3',
    [userId, year, month],
  );
  const spend = await getMonthlySpend(userId, year, month);
  const budgetAmount = budgetResult.rows[0] ? toNumber(budgetResult.rows[0].amount) : null;
  const percentUsed = budgetAmount ? round2(safePercentage(spend, budgetAmount)) : 0;

  return {
    year,
    month,
    budgetAmount,
    spend: round2(spend),
    remaining: budgetAmount === null ? null : round2(budgetAmount - spend),
    percentUsed,
    status: budgetAmount === null ? null : budgetStatus(percentUsed),
  };
}

async function upsertMonthlyBudget(userId, year, month, amount) {
  if (!amount || Number(amount) <= 0) {
    throw new ApiError(400, 'Budget amount must be greater than zero');
  }
  await pool.query(
    `INSERT INTO monthly_budgets (user_id, year, month, amount)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, year, month) DO UPDATE SET amount = EXCLUDED.amount, updated_at = now()`,
    [userId, year, month, amount],
  );
  return getMonthlyBudget(userId, year, month);
}

async function listCategoryBudgets(userId, year, month) {
  const result = await pool.query(
    `SELECT cb.*, c.name AS category_name, c.icon AS category_icon,
            COALESCE((
              SELECT SUM(e.amount) FROM expenses e
              WHERE e.user_id = cb.user_id AND e.category_id = cb.category_id
                AND EXTRACT(YEAR FROM e.expense_date) = cb.year
                AND EXTRACT(MONTH FROM e.expense_date) = cb.month
            ), 0) AS spend
     FROM category_budgets cb
     JOIN categories c ON c.id = cb.category_id
     WHERE cb.user_id = $1 AND cb.year = $2 AND cb.month = $3
     ORDER BY c.name`,
    [userId, year, month],
  );

  return result.rows.map((row) => {
    const budgetAmount = toNumber(row.amount);
    const spend = toNumber(row.spend);
    const percentUsed = round2(safePercentage(spend, budgetAmount));
    return {
      id: row.id,
      categoryId: row.category_id,
      categoryName: row.category_name,
      categoryIcon: row.category_icon,
      year: row.year,
      month: row.month,
      budgetAmount: round2(budgetAmount),
      spend: round2(spend),
      remaining: round2(budgetAmount - spend),
      percentUsed,
      status: budgetStatus(percentUsed),
    };
  });
}

async function upsertCategoryBudget(userId, { categoryId, year, month, amount }) {
  if (!categoryId) throw new ApiError(400, 'categoryId is required');
  if (!amount || Number(amount) <= 0) throw new ApiError(400, 'Budget amount must be greater than zero');

  const category = await pool.query('SELECT 1 FROM categories WHERE id = $1 AND user_id = $2', [
    categoryId,
    userId,
  ]);
  if (category.rows.length === 0) throw new ApiError(400, 'Invalid category');

  await pool.query(
    `INSERT INTO category_budgets (user_id, category_id, year, month, amount)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (user_id, category_id, year, month) DO UPDATE SET amount = EXCLUDED.amount, updated_at = now()`,
    [userId, categoryId, year, month, amount],
  );
  const [updated] = await listCategoryBudgets(userId, year, month).then((rows) =>
    rows.filter((r) => r.categoryId === categoryId),
  );
  return updated;
}

async function removeCategoryBudget(userId, id) {
  const result = await pool.query('DELETE FROM category_budgets WHERE id = $1 AND user_id = $2 RETURNING id', [
    id,
    userId,
  ]);
  if (!result.rows[0]) throw new ApiError(404, 'Category budget not found');
}

module.exports = {
  budgetStatus,
  getMonthlySpend,
  getMonthlyBudget,
  upsertMonthlyBudget,
  listCategoryBudgets,
  upsertCategoryBudget,
  removeCategoryBudget,
};
