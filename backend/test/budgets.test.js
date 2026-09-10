const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/db/pool');

const email = `budget-test-${Date.now()}@example.com`;
let token;
let categoryId;
const year = 2026;
const month = 9;

beforeAll(async () => {
  await request(app).post('/api/auth/signup').send({ name: 'Budget User', email, password: 'Password123' });
  const login = await request(app).post('/api/auth/login').send({ email, password: 'Password123' });
  token = login.body.accessToken;
  const categories = await request(app).get('/api/categories').set('Authorization', `Bearer ${token}`);
  categoryId = categories.body.categories[0].id;
});

afterAll(async () => {
  await pool.query('DELETE FROM users WHERE email = $1', [email]);
  await pool.end();
});

describe('Budgets', () => {
  test('setting a monthly budget then adding expenses computes remaining/percentUsed correctly', async () => {
    await request(app)
      .put(`/api/budgets/monthly/${year}/${month}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 40000 });

    await request(app)
      .post('/api/expenses')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 23450, categoryId, expenseDate: `${year}-${String(month).padStart(2, '0')}-15` });

    const res = await request(app)
      .get(`/api/budgets/monthly/${year}/${month}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.budget.budgetAmount).toBe(40000);
    expect(res.body.budget.spend).toBe(23450);
    expect(res.body.budget.remaining).toBe(16550);
    expect(res.body.budget.percentUsed).toBeCloseTo(58.63, 1);
    expect(res.body.budget.status).toBe('Normal'); // 58.6% is below the 70% Warning threshold
  });

  test('category budget tracks spend/remaining/percentUsed for that category only', async () => {
    await request(app)
      .put('/api/budgets/category')
      .set('Authorization', `Bearer ${token}`)
      .send({ categoryId, year, month, amount: 8000 });

    const res = await request(app)
      .get(`/api/budgets/category?year=${year}&month=${month}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const budget = res.body.budgets.find((b) => b.categoryId === categoryId);
    expect(budget.budgetAmount).toBe(8000);
    expect(budget.spend).toBe(23450);
    expect(budget.status).toBe('Exceeded');
  });
});
