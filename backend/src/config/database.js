const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const { Risk, Mitigation } = require('../models');

const DATA_DIR = path.join(__dirname, '../../data');
const DB_PATH = path.join(DATA_DIR, 'hyperproof.db');

let db;

function getDb() {
  if (!db) {
    throw new Error('Database has not been initialized. Call initDatabase() first.');
  }
  return db;
}

/**
 * @param {string} [dbPath=DB_PATH] File path, or ':memory:' for tests.
 */
function initDatabase(dbPath = DB_PATH) {
  if (db) {
    return db;
  }

  if (dbPath !== ':memory:') {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }

  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(Risk.CREATE_TABLE_SQL);
  db.exec(Mitigation.CREATE_TABLE_SQL);
  db.exec(Mitigation.CREATE_INDEX_SQL);

  return db;
}

function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}

module.exports = {
  getDb,
  initDatabase,
  closeDatabase,
  DB_PATH,
};
