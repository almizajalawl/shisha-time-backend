import Database from "better-sqlite3";

const db = new Database("database.db");

// جدول الطلبات
db.prepare(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    phone TEXT,
    total REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

// جدول المستخدمين (للإحالات لاحقًا)
db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT UNIQUE,
    referral_code TEXT
  )
`).run();

export default db;
