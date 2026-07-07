const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', 'data', 'wudong.db');
const INIT_SQL_PATH = path.join(__dirname, '..', 'sql', 'init.sql');

const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let db = null;

async function initDb() {
  const initSqlJs = require('sql.js');
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  const initSql = fs.readFileSync(INIT_SQL_PATH, 'utf-8');
  db.run(initSql);
  saveDb();
}

function saveDb() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

function ready() {
  return db !== null;
}

function getLastInsertId(tableName) {
  const row = queryOne("SELECT seq FROM sqlite_sequence WHERE name = ?", [tableName]);
  return row ? row.seq : null;
}

function queryOne(sql, params = []) {
  if (!db) throw new Error('Database not initialized');
  const stmt = db.prepare(sql);
  stmt.bind(params);
  if (stmt.step()) {
    const columns = stmt.getColumnNames();
    const values = stmt.get();
    stmt.free();
    const row = {};
    columns.forEach((col, i) => { row[col] = values[i]; });
    return row;
  }
  stmt.free();
  return null;
}

function queryAll(sql, params = []) {
  if (!db) throw new Error('Database not initialized');
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  const columns = stmt.getColumnNames();
  while (stmt.step()) {
    const values = stmt.get();
    const row = {};
    columns.forEach((col, i) => { row[col] = values[i]; });
    rows.push(row);
  }
  stmt.free();
  return rows;
}

function run(sql, params = []) {
  if (!db) throw new Error('Database not initialized');
  db.run(sql, params);
  saveDb();
  const changes = db.getRowsModified();

  let lastInsertRowid = null;
  const insertMatch = sql.trim().match(/^\s*INSERT\s+INTO\s+(\S+)/i);
  if (insertMatch) {
    const tableName = insertMatch[1].replace(/["`\[\]]/g, '');
    lastInsertRowid = getLastInsertId(tableName);
  }

  return { changes, lastInsertRowid };
}

function queryCount(sql, params = []) {
  const row = queryOne(sql, params);
  // 支持 count 和 total 两种别名
  if (!row) return 0;
  const keys = Object.keys(row);
  return row[keys[0]] || 0;
}

module.exports = { initDb, ready, queryOne, queryAll, run, queryCount, saveDb };
