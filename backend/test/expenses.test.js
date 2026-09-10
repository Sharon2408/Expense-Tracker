const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/db/pool');

const emailA = `expense-test-a-${Date.now()}@example.com`;
const emailB = `expense-test-b-${Date.now()}@example.com`;
let tokenA;
let tokenB;
let categoryId;
let expenseId;

async function signupAndLogin(email) {
  await request(app).post('/api/auth/signup').send({ name: 'User', email, password: 'Password123' });
  const login = await request(app).post('/api/auth/login').send({ email, password: 'Password123' });
  return login.body.accessToken;
}

beforeAll(async () => {
  tokenA = await signupAndLogin(emailA);
  tokenB = await signupAndLogin(emailB);
  const categories = await request(app).get('/api/categories').set('Authorization', `Bearer ${tokenA}`);
  categoryId = categories.body.categories[0].id;
});

afterAll(async () => {
  await pool.query('DELETE FROM users WHERE email = ANY($1)', [[emailA, emailB]]);
  await pool.end();
});

describe('Expense CRUD + validation', () => {
  test('rejects an expense with zero amount', async () => {
    const res = await request(app)
      .post('/api/expenses')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ amount: 0, categoryId, expenseDate: '2026-09-01' });
    expect(res.status).toBe(400);
    expect(res.body.details.amount).toMatch(/greater than zero/i);
  });

  test('rejects an expense with non-numeric amount', async () => {
    const res = await request(app)
      .post('/api/expenses')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ amount: 'abc', categoryId, expenseDate: '2026-09-01' });
    expect(res.status).toBe(400);
  });

  test('rejects an expense missing category', async () => {
    const res = await request(app)
      .post('/api/expenses')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ amount: 100, expenseDate: '2026-09-01' });
    expect(res.status).toBe(400);
    expect(res.body.details.categoryId).toBeTruthy();
  });

  test('creates a valid expense', async () => {
    const res = await request(app)
      .post('/api/expenses')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ amount: 250.5, categoryId, description: 'Lunch', expenseDate: '2026-09-01', paymentMethod: 'UPI' });
    expect(res.status).toBe(201);
    expenseId = res.body.expense.id;
    expect(Number(res.body.expense.amount)).toBe(250.5);
  });

  test('edits the expense', async () => {
    const res = await request(app)
      .put(`/api/expenses/${expenseId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ amount: 300 });
    expect(res.status).toBe(200);
    expect(Number(res.body.expense.amount)).toBe(300);
  });

  test('user B cannot see or modify user A expense', async () => {
    const getRes = await request(app)
      .get(`/api/expenses/${expenseId}`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect(getRes.status).toBe(404);

    const deleteRes = await request(app)
      .delete(`/api/expenses/${expenseId}`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect(deleteRes.status).toBe(404);
  });

  test('user B expense list does not include user A expenses', async () => {
    const res = await request(app).get('/api/expenses').set('Authorization', `Bearer ${tokenB}`);
    expect(res.status).toBe(200);
    expect(res.body.items.find((e) => e.id === expenseId)).toBeUndefined();
  });

  test('deletes the expense (owner)', async () => {
    const res = await request(app)
      .delete(`/api/expenses/${expenseId}`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(res.status).toBe(204);

    const getRes = await request(app)
      .get(`/api/expenses/${expenseId}`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(getRes.status).toBe(404);
  });
});
