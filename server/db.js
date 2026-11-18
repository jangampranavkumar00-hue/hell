const Database = require('better-sqlite3');
const db = new Database('docdash.db');
db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS clinics (
  id INTEGER PRIMARY KEY,
  name TEXT, address TEXT, lat REAL, lng REAL
);
CREATE TABLE IF NOT EXISTS doctors (
  id INTEGER PRIMARY KEY,
  name TEXT, specialty TEXT, clinic_id INTEGER,
  fee INTEGER, avg_consult_min REAL DEFAULT 12,
  status TEXT DEFAULT 'In Consultation',
  offset_delay INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  doctor_id INTEGER, clinic_id INTEGER,
  token_no INTEGER, shift TEXT,           -- 'morning' | 'evening'
  patient_name TEXT, patient_phone TEXT,
  status TEXT DEFAULT 'waiting',          -- waiting | serving | completed | skipped
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  consulted_at TEXT, duration_min REAL
);
CREATE TABLE IF NOT EXISTS consult_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  doctor_id INTEGER, duration_min REAL,
  logged_at TEXT DEFAULT CURRENT_TIMESTAMP
);
`);
module.exports = db;