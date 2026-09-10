const pool = require('../../db/pool');
const ApiError = require('../../utils/apiError');

async function list(userId) {
  const result = await pool.query(
    'SELECT * FROM categories WHERE user_id = $1 ORDER BY is_default DESC, name ASC',
    [userId],
  );
  return result.rows;
}

async function create(userId, { name, icon }) {
  if (!name || !name.trim()) {
    throw new ApiError(400, 'Category name is required');
  }
  try {
    const result = await pool.query(
      'INSERT INTO categories (user_id, name, icon, is_default) VALUES ($1, $2, $3, false) RETURNING *',
      [userId, name.trim(), icon || '💰'],
    );
    return result.rows[0];
  } catch (err) {
    if (err.code === '23505') {
      throw new ApiError(409, 'A category with this name already exists');
    }
    throw err;
  }
}

async function update(userId, categoryId, { name, icon }) {
  const result = await pool.query(
    `UPDATE categories SET name = COALESCE($3, name), icon = COALESCE($4, icon), updated_at = now()
     WHERE id = $1 AND user_id = $2 RETURNING *`,
    [categoryId, userId, name, icon],
  );
  if (!result.rows[0]) throw new ApiError(404, 'Category not found');
  return result.rows[0];
}

async function remove(userId, categoryId) {
  const inUse = await pool.query(
    'SELECT 1 FROM expenses WHERE category_id = $1 AND user_id = $2 LIMIT 1',
    [categoryId, userId],
  );
  if (inUse.rows.length > 0) {
    throw new ApiError(409, 'Cannot delete a category that has expenses. Reassign or delete those expenses first.');
  }
  const result = await pool.query('DELETE FROM categories WHERE id = $1 AND user_id = $2 RETURNING id', [
    categoryId,
    userId,
  ]);
  if (!result.rows[0]) throw new ApiError(404, 'Category not found');
}

module.exports = { list, create, update, remove };
