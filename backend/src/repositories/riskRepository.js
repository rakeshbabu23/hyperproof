const { getDb } = require('../config/database');
const { TABLE_NAME } = require('../models/risk');

function create(risk) {
  const result = getDb()
    .prepare(
      `INSERT INTO ${TABLE_NAME}
        (title, description, category, owner, likelihood, impact, status)
       VALUES (@title, @description, @category, @owner, @likelihood, @impact, @status)`,
    )
    .run(risk);

  return findById(result.lastInsertRowid);
}

function findById(id) {
  return (
    getDb()
      .prepare(`SELECT * FROM ${TABLE_NAME} WHERE id = ?`)
      .get(id) ?? null
  );
}

function findAll({ category, status } = {}) {
  const clauses = [];
  const params = {};

  if (category) {
    clauses.push('category = @category');
    params.category = category;
  }

  if (status) {
    clauses.push('status = @status');
    params.status = status;
  }

  const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';

  return getDb()
    .prepare(`SELECT * FROM ${TABLE_NAME} ${where} ORDER BY id ASC`)
    .all(params);
}

function update(id, risk) {
  getDb()
    .prepare(
      `UPDATE ${TABLE_NAME}
       SET title = @title,
           description = @description,
           category = @category,
           owner = @owner,
           likelihood = @likelihood,
           impact = @impact,
           status = @status,
           updatedAt = datetime('now')
       WHERE id = @id`,
    )
    .run({ ...risk, id });

  return findById(id);
}

function remove(id) {
  const result = getDb()
    .prepare(`DELETE FROM ${TABLE_NAME} WHERE id = ?`)
    .run(id);

  return result.changes > 0;
}

module.exports = {
  create,
  findById,
  findAll,
  update,
  remove,
};
