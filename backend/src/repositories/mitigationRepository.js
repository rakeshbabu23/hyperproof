const { getDb } = require('../config/database');
const { TABLE_NAME } = require('../models/mitigation');

function create(mitigation) {
  const result = getDb()
    .prepare(
      `INSERT INTO ${TABLE_NAME} (riskId, description, effectiveness)
       VALUES (@riskId, @description, @effectiveness)`,
    )
    .run(mitigation);

  return findById(result.lastInsertRowid);
}

function findById(id) {
  return (
    getDb()
      .prepare(`SELECT * FROM ${TABLE_NAME} WHERE id = ?`)
      .get(id) ?? null
  );
}

function findByRiskId(riskId) {
  return getDb()
    .prepare(`SELECT * FROM ${TABLE_NAME} WHERE riskId = ? ORDER BY id ASC`)
    .all(riskId);
}

function findByRiskIds(riskIds) {
  if (!riskIds || riskIds.length === 0) {
    return [];
  }

  const placeholders = riskIds.map(() => '?').join(', ');
  return getDb()
    .prepare(
      `SELECT * FROM ${TABLE_NAME}
       WHERE riskId IN (${placeholders})
       ORDER BY id ASC`,
    )
    .all(...riskIds);
}

function update(id, mitigation) {
  getDb()
    .prepare(
      `UPDATE ${TABLE_NAME}
       SET description = @description,
           effectiveness = @effectiveness
       WHERE id = @id`,
    )
    .run({ ...mitigation, id });

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
  findByRiskId,
  findByRiskIds,
  update,
  remove,
};
