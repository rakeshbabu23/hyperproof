const { TABLE_NAME: RISKS_TABLE } = require('./risk');

const TABLE_NAME = 'mitigations';

const CREATE_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    riskId INTEGER NOT NULL,
    description TEXT NOT NULL,
    effectiveness INTEGER NOT NULL CHECK (effectiveness BETWEEN 1 AND 5),
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (riskId) REFERENCES ${RISKS_TABLE}(id) ON DELETE CASCADE
  );
`;

const CREATE_INDEX_SQL = `
  CREATE INDEX IF NOT EXISTS idx_mitigations_riskId ON ${TABLE_NAME}(riskId);
`;

module.exports = {
  TABLE_NAME,
  CREATE_TABLE_SQL,
  CREATE_INDEX_SQL,
};
