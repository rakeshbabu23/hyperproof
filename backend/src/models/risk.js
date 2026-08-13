const { RISK_CATEGORIES, RISK_STATUSES } = require('../constants/enums');

const TABLE_NAME = 'risks';

const CREATE_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN (${RISK_CATEGORIES.map((c) => `'${c}'`).join(', ')})),
    owner TEXT NOT NULL,
    likelihood INTEGER NOT NULL CHECK (likelihood BETWEEN 1 AND 5),
    impact INTEGER NOT NULL CHECK (impact BETWEEN 1 AND 5),
    status TEXT NOT NULL CHECK (status IN (${RISK_STATUSES.map((s) => `'${s}'`).join(', ')})),
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
  );
`;

module.exports = {
  TABLE_NAME,
  CREATE_TABLE_SQL,
};
