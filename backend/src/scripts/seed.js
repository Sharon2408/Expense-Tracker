/**
 * Development-only seed data. Never invoked automatically by the app -
 * run explicitly with `npm run seed`. Creates (or reuses) a demo user and
 * fills the current and previous month with varied sample expenses so the
 * dashboard/analytics pages have something to show while developing.
 */
const pool = require('../db/pool');
const authService = require('../modules/auth/auth.service');
const env = require('../config/env');

const DEMO_EMAIL = 'demo@expensetracker.test';
const DEMO_PASSWORD = 'Demo@12345';

async function ensureDemoUser() {
  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [DEMO_EMAIL]);
  if (existing.rows[0]) return existing.rows[0].id;
  const { user } = await authService.signup({ name: 'Demo User', email: DEMO_EMAIL, password: DEMO_PASSWORD });
  return user.id;
}

function randomAmount(min, max) {
  return Math.round((min + Math.random() * (max - min)) * 100) / 100;
}

async function seedExpensesForMonth(userId, categories, year, month, count) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const payments = ['Cash', 'UPI', 'Credit Card', 'Debit Card', 'Bank Transfer'];

  for (let i = 0; i < count; i += 1) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const day = 1 + Math.floor(Math.random() * daysInMonth);
    const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const amount = randomAmount(50, 4500);
    const payment = payments[Math.floor(Math.random() * payments.length)];

    await pool.query(
      `INSERT INTO expenses (user_id, category_id, amount, description, expense_date, payment_method, notes)
       VALUES ($1, $2, $3, $4, $5, $6, '')`,
      [userId, category.id, amount, `${category.name} expense`, date, payment],
    );
  }
}

async function run() {
  if (env.nodeEnv === 'production') {
    console.error('Refusing to run seed data against a production environment.');
    process.exit(1);
  }

  const userId = await ensureDemoUser();
  const categories = await pool.query('SELECT id, name FROM categories WHERE user_id = $1', [userId]);

  const now = new Date();
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  await seedExpensesForMonth(userId, categories.rows, now.getFullYear(), now.getMonth() + 1, 25);
  await seedExpensesForMonth(userId, categories.rows, prevDate.getFullYear(), prevDate.getMonth() + 1, 22);

  await pool.query(
    `INSERT INTO monthly_budgets (user_id, year, month, amount)
     VALUES ($1, $2, $3, 40000)
     ON CONFLICT (user_id, year, month) DO UPDATE SET amount = EXCLUDED.amount`,
    [userId, now.getFullYear(), now.getMonth() + 1],
  );

  console.log('Seed complete.');
  console.log(`Demo login -> email: ${DEMO_EMAIL}  password: ${DEMO_PASSWORD}`);
  await pool.end();
}

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
