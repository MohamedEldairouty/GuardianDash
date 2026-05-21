/**
 * SQLite setup for GuardianDash.
 * File-based DB at ./guardiandash.db — no daemon needed.
 */
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.GD_DB_PATH || path.join(__dirname, 'guardiandash.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT    NOT NULL,
    email         TEXT    NOT NULL UNIQUE,
    password_hash TEXT    NOT NULL,
    created_at    INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS contacts (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id      INTEGER NOT NULL,
    name         TEXT    NOT NULL,
    phone        TEXT    NOT NULL,
    relationship TEXT    DEFAULT 'Contact',
    priority     INTEGER NOT NULL DEFAULT 1,
    enabled      INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS trips (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id        INTEGER NOT NULL,
    started_at     INTEGER NOT NULL,
    ended_at       INTEGER NOT NULL,
    distance_km    REAL    NOT NULL DEFAULT 0,
    max_speed_kph  REAL    NOT NULL DEFAULT 0,
    avg_speed_kph  REAL    NOT NULL DEFAULT 0,
    crash_count    INTEGER NOT NULL DEFAULT 0,
    path_json      TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS saved_locations (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name    TEXT    NOT NULL,
    lat     REAL    NOT NULL,
    lng     REAL    NOT NULL,
    icon    TEXT    DEFAULT '📍',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_contacts_user      ON contacts(user_id);
  CREATE INDEX IF NOT EXISTS idx_trips_user_started ON trips(user_id, started_at DESC);
  CREATE INDEX IF NOT EXISTS idx_locations_user     ON saved_locations(user_id);
`);

module.exports = db;
