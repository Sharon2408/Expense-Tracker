const pool = require('../../db/pool');
const { toNumber, safePercentage, round2 } = require('../../utils/money');
const { todayISO, startOfWeekISO, daysInMonth, elapsedDaysInMonth, previousMonth } = require('../../utils/dates');
const budgetsService = require('../budgets/budgets.service');

async function sumBetween(userId, fromISO, toISO) {
  const result = await pool.query(
    `SELECT COALESCE(SUM(amount), 0) AS total, COUNT(*)::int AS count
     FROM expenses WHERE user_id = $1 AND expense_date BETWEEN $2 AND $3`,
    [userId, fromISO, toISO],
  );
  return { total: toNumber(result.rows[0].total), count: result.rows[0].count };
}

function monthRange(year, month) {
  const from = `${year}-${String(month).padStart(2, '0')}-01`;
  const to = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth(year, month)).padStart(2, '0')}`;
  return { from, to };
}

async function categoryBreakdown(userId, fromISO, toISO) {
  const result = await pool.query(
    `SELECT c.id AS category_id, c.name, c.icon, COALESCE(SUM(e.amount), 0) AS total
     FROM categories c
     LEFT JOIN expenses e ON e.category_id = c.id AND e.user_id = c.user_id
       AND e.expense_date BETWEEN $2 AND $3
     WHERE c.user_id = $1
     GROUP BY c.id, c.name, c.icon
     HAVING COALESCE(SUM(e.amount), 0) > 0
     ORDER BY total DESC`,
    [userId, fromISO, toISO],
  );
  const totalSpend = result.rows.reduce((sum, row) => sum + toNumber(row.total), 0);
  return result.rows.map((row) => ({
    categoryId: row.category_id,
    name: row.name,
    icon: row.icon,
    amount: round2(toNumber(row.total)),
    percentage: round2(safePercentage(row.total, totalSpend)),
  }));
}

async function paymentMethodBreakdown(userId, fromISO, toISO) {
  const result = await pool.query(
    `SELECT payment_method, COALESCE(SUM(amount), 0) AS total, COUNT(*)::int AS count
     FROM expenses WHERE user_id = $1 AND expense_date BETWEEN $2 AND $3
     GROUP BY payment_method ORDER BY total DESC`,
    [userId, fromISO, toISO],
  );
  return result.rows.map((r) => ({ paymentMethod: r.payment_method, amount: round2(toNumber(r.total)), count: r.count }));
}

async function dailyTrend(userId, fromISO, toISO) {
  const result = await pool.query(
    `SELECT expense_date::text AS date, SUM(amount) AS total
     FROM expenses WHERE user_id = $1 AND expense_date BETWEEN $2 AND $3
     GROUP BY expense_date ORDER BY expense_date`,
    [userId, fromISO, toISO],
  );
  const map = new Map(result.rows.map((r) => [r.date, round2(toNumber(r.total))]));

  // fromISO/toISO ('YYYY-MM-DD') parse as UTC midnight. Stepping with the
  // local setDate()/getDate() would shift the printed date by a day
  // whenever the server's local timezone is behind UTC, so this steps and
  // reads using the UTC variants throughout.
  const days = [];
  const cursor = new Date(fromISO);
  const end = new Date(toISO);
  while (cursor <= end) {
    const iso = cursor.toISOString().slice(0, 10);
    days.push({ date: iso, amount: map.get(iso) || 0 });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}

async function recentTransactions(userId, limit = 8) {
  const result = await pool.query(
    `SELECT e.*, c.name AS category_name, c.icon AS category_icon
     FROM expenses e JOIN categories c ON c.id = e.category_id
     WHERE e.user_id = $1 ORDER BY e.expense_date DESC, e.created_at DESC LIMIT $2`,
    [userId, limit],
  );
  return result.rows;
}

/** ((current - previous) / previous) * 100, safe against previous === 0. */
function percentChange(current, previous) {
  if (!previous) {
    return current > 0 ? null : 0; // null = "no baseline to compare against"
  }
  return round2(((current - previous) / previous) * 100);
}

async function dashboard(userId) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const today = todayISO();
  const weekStart = startOfWeekISO(now);
  const { from: monthStart, to: monthEnd } = monthRange(year, month);

  const [spentToday, spentThisWeek, monthStats, monthlyBudget, categories, recentTx] = await Promise.all([
    sumBetween(userId, today, today),
    sumBetween(userId, weekStart, today),
    sumBetween(userId, monthStart, monthEnd),
    budgetsService.getMonthlyBudget(userId, year, month),
    categoryBreakdown(userId, monthStart, monthEnd),
    recentTransactions(userId),
  ]);

  const prev = previousMonth(year, month);
  const prevRange = monthRange(prev.year, prev.month);
  const prevStats = await sumBetween(userId, prevRange.from, prevRange.to);

  const trend = await dailyTrend(userId, monthStart, monthEnd);

  return {
    spentToday: round2(spentToday.total),
    spentThisWeek: round2(spentThisWeek.total),
    spentThisMonth: round2(monthStats.total),
    transactionsThisMonth: monthStats.count,
    monthlyBudget,
    highestCategory: categories[0] || null,
    topCategories: categories.slice(0, 5),
    categoryBreakdown: categories,
    recentTransactions: recentTx,
    dailyTrend: trend,
    monthlyComparison: {
      currentMonth: { year, month, total: round2(monthStats.total) },
      previousMonth: { year: prev.year, month: prev.month, total: round2(prevStats.total) },
      difference: round2(monthStats.total - prevStats.total),
      percentChange: percentChange(monthStats.total, prevStats.total),
    },
  };
}

async function monthlyAnalytics(userId, year, month) {
  const { from, to } = monthRange(year, month);
  const stats = await sumBetween(userId, from, to);
  const categories = await categoryBreakdown(userId, from, to);
  const payments = await paymentMethodBreakdown(userId, from, to);
  const trend = await dailyTrend(userId, from, to);

  const elapsedDays = elapsedDaysInMonth(year, month);
  const avgDaily = elapsedDays > 0 ? stats.total / elapsedDays : 0;

  const largestExpenseResult = await pool.query(
    `SELECT e.*, c.name AS category_name, c.icon AS category_icon
     FROM expenses e JOIN categories c ON c.id = e.category_id
     WHERE e.user_id = $1 AND e.expense_date BETWEEN $2 AND $3
     ORDER BY e.amount DESC LIMIT 1`,
    [userId, from, to],
  );

  const highestDay = trend.reduce(
    (best, day) => (day.amount > (best?.amount || 0) ? day : best),
    null,
  );

  return {
    year,
    month,
    totalSpending: round2(stats.total),
    transactionCount: stats.count,
    averageDailySpending: round2(avgDaily),
    highestSpendingDay: highestDay,
    largestExpense: largestExpenseResult.rows[0] || null,
    highestSpendingCategory: categories[0] || null,
    mostUsedPaymentMethod: payments[0] || null,
    categoryBreakdown: categories,
    paymentMethodBreakdown: payments,
    dailyTrend: trend,
  };
}

async function monthlyTrend(userId, monthsBack = 6) {
  const now = new Date();
  const months = [];
  for (let i = monthsBack - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
  }
  const results = [];
  for (const m of months) {
    const { from, to } = monthRange(m.year, m.month);
    const stats = await sumBetween(userId, from, to);
    results.push({ year: m.year, month: m.month, total: round2(stats.total) });
  }
  return results;
}

/** Business-rule text insights, generated purely from computed data - no AI call. */
async function insights(userId) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const { from, to } = monthRange(year, month);

  const stats = await sumBetween(userId, from, to);
  if (stats.count === 0) {
    return [];
  }

  const categories = await categoryBreakdown(userId, from, to);
  const payments = await paymentMethodBreakdown(userId, from, to);
  const prev = previousMonth(year, month);
  const prevRange = monthRange(prev.year, prev.month);
  const prevStats = await sumBetween(userId, prevRange.from, prevRange.to);
  const monthlyBudget = await budgetsService.getMonthlyBudget(userId, year, month);
  const categoryBudgets = await budgetsService.listCategoryBudgets(userId, year, month);
  const elapsedDays = elapsedDaysInMonth(year, month);

  const largestExpenseResult = await pool.query(
    `SELECT amount, description FROM expenses WHERE user_id = $1 AND expense_date BETWEEN $2 AND $3
     ORDER BY amount DESC LIMIT 1`,
    [userId, from, to],
  );

  const list = [];

  if (categories[0]) {
    list.push(`You spent the most on ${categories[0].name} this month: ₹${round2(categories[0].amount)}.`);
  }

  if (prevStats.total > 0) {
    const change = percentChange(stats.total, prevStats.total);
    if (change !== null) {
      const direction = change >= 0 ? 'more' : 'less';
      list.push(`You spent ${Math.abs(change)}% ${direction} than last month.`);
    }
  }

  for (const cat of categories.slice(0, 3)) {
    const prevCatResult = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM expenses
       WHERE user_id = $1 AND category_id = $2 AND expense_date BETWEEN $3 AND $4`,
      [userId, cat.categoryId, prevRange.from, prevRange.to],
    );
    const prevAmount = toNumber(prevCatResult.rows[0].total);
    if (prevAmount > 0 && Math.abs(cat.amount - prevAmount) >= 1) {
      const verb = cat.amount >= prevAmount ? 'increased' : 'decreased';
      list.push(`${cat.name} expenses ${verb} by ₹${round2(Math.abs(cat.amount - prevAmount))} compared with last month.`);
    }
  }

  if (elapsedDays > 0) {
    list.push(`Your average daily spending is ₹${round2(stats.total / elapsedDays)}.`);
  }

  if (largestExpenseResult.rows[0]) {
    list.push(`Your largest expense this month was ₹${round2(toNumber(largestExpenseResult.rows[0].amount))}.`);
  }

  if (monthlyBudget.budgetAmount) {
    list.push(`You have used ${monthlyBudget.percentUsed}% of your monthly budget.`);
  }

  for (const cb of categoryBudgets) {
    if (cb.percentUsed >= 50) {
      list.push(`You have used ${cb.percentUsed}% of your ${cb.categoryName} budget.`);
    }
  }

  if (payments[0]) {
    list.push(`${payments[0].paymentMethod} was your most-used payment method this month.`);
  }

  return list;
}

module.exports = { dashboard, monthlyAnalytics, monthlyTrend, insights, percentChange, monthRange };
