const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../../db/pool');
const env = require('../../config/env');
const ApiError = require('../../utils/apiError');
const { DEFAULT_CATEGORIES } = require('../../utils/categories');

const REFRESH_TOKEN_DAYS = 30;

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function signAccessToken(userId) {
  return jwt.sign({ sub: userId }, env.jwt.accessSecret, { expiresIn: env.jwt.accessExpiresIn });
}

function signRefreshToken(userId) {
  return jwt.sign({ sub: userId, jti: crypto.randomUUID() }, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiresIn,
  });
}

function toPublicUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    currency: row.currency,
    theme: row.theme,
    defaultPaymentMethod: row.default_payment_method,
  };
}

async function issueTokenPair(client, userId) {
  const accessToken = signAccessToken(userId);
  const refreshToken = signRefreshToken(userId);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000);
  await client.query(
    'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
    [userId, hashToken(refreshToken), expiresAt],
  );
  return { accessToken, refreshToken };
}

async function signup({ name, email, password }) {
  if (!name || !email || !password) {
    throw new ApiError(400, 'Name, email and password are required');
  }
  if (password.length < 8) {
    throw new ApiError(400, 'Password must be at least 8 characters');
  }
  const normalizedEmail = String(email).trim().toLowerCase();

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const existing = await client.query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
    if (existing.rows.length > 0) {
      throw new ApiError(409, 'An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userResult = await client.query(
      `INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3)
       RETURNING id, name, email, currency, theme, default_payment_method`,
      [name, normalizedEmail, passwordHash],
    );
    const user = userResult.rows[0];

    for (const cat of DEFAULT_CATEGORIES) {
      await client.query(
        'INSERT INTO categories (user_id, name, icon, is_default) VALUES ($1, $2, $3, true)',
        [user.id, cat.name, cat.icon],
      );
    }

    const tokens = await issueTokenPair(client, user.id);
    await client.query('COMMIT');
    return { user: toPublicUser(user), ...tokens };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function login({ email, password }) {
  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required');
  }
  const normalizedEmail = String(email).trim().toLowerCase();

  const result = await pool.query('SELECT * FROM users WHERE email = $1', [normalizedEmail]);
  const user = result.rows[0];
  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }
  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const client = await pool.connect();
  try {
    const tokens = await issueTokenPair(client, user.id);
    return { user: toPublicUser(user), ...tokens };
  } finally {
    client.release();
  }
}

async function refresh(refreshToken) {
  if (!refreshToken) {
    throw new ApiError(401, 'Missing refresh token');
  }
  let payload;
  try {
    payload = jwt.verify(refreshToken, env.jwt.refreshSecret);
  } catch {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  const tokenHash = hashToken(refreshToken);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const rows = await client.query(
      `SELECT * FROM refresh_tokens WHERE user_id = $1 AND token_hash = $2 AND revoked_at IS NULL AND expires_at > now()`,
      [payload.sub, tokenHash],
    );
    if (rows.rows.length === 0) {
      await client.query('ROLLBACK');
      throw new ApiError(401, 'Refresh token no longer valid');
    }

    // Rotate: revoke the used refresh token and issue a new pair.
    await client.query('UPDATE refresh_tokens SET revoked_at = now() WHERE id = $1', [rows.rows[0].id]);
    const tokens = await issueTokenPair(client, payload.sub);
    await client.query('COMMIT');
    return tokens;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

async function logout(refreshToken) {
  if (!refreshToken) return;
  const tokenHash = hashToken(refreshToken);
  await pool.query('UPDATE refresh_tokens SET revoked_at = now() WHERE token_hash = $1', [tokenHash]);
}

async function getUserById(userId) {
  const result = await pool.query(
    'SELECT id, name, email, currency, theme, default_payment_method FROM users WHERE id = $1',
    [userId],
  );
  if (!result.rows[0]) throw new ApiError(404, 'User not found');
  return toPublicUser(result.rows[0]);
}

async function updateSettings(userId, { name, currency, theme, defaultPaymentMethod }) {
  const result = await pool.query(
    `UPDATE users SET
       name = COALESCE($2, name),
       currency = COALESCE($3, currency),
       theme = COALESCE($4, theme),
       default_payment_method = COALESCE($5, default_payment_method),
       updated_at = now()
     WHERE id = $1
     RETURNING id, name, email, currency, theme, default_payment_method`,
    [userId, name, currency, theme, defaultPaymentMethod],
  );
  return toPublicUser(result.rows[0]);
}

module.exports = { signup, login, refresh, logout, getUserById, updateSettings };
