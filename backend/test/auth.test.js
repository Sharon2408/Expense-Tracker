const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/db/pool');

const email = `auth-test-${Date.now()}@example.com`;

afterAll(async () => {
  await pool.query('DELETE FROM users WHERE email = $1', [email]);
  await pool.end();
});

describe('Auth flows', () => {
  test('signup creates a user and returns an access token', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ name: 'Test User', email, password: 'Password123' });
    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.user.email).toBe(email);
  });

  test('signup rejects a duplicate email', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ name: 'Test User', email, password: 'Password123' });
    expect(res.status).toBe(409);
  });

  test('login succeeds with correct credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({ email, password: 'Password123' });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTruthy();
  });

  test('login fails with wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({ email, password: 'WrongPassword' });
    expect(res.status).toBe(401);
  });

  test('protected route rejects request with no token', async () => {
    const res = await request(app).get('/api/expenses');
    expect(res.status).toBe(401);
  });

  test('protected route accepts a valid access token', async () => {
    const login = await request(app).post('/api/auth/login').send({ email, password: 'Password123' });
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${login.body.accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(email);
  });
});
