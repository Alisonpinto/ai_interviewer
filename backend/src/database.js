/**
 * database.js
 * ──────────────────────────────────────────────────────────────
 * SQLite database layer using better-sqlite3.
 * All queries are synchronous (better-sqlite3 style).
 * ──────────────────────────────────────────────────────────────
 */

const Database = require('better-sqlite3');
const path     = require('path');
const fs       = require('fs');

/* ── Ensure data directory exists ───────────────────────── */
const dbDir  = path.join(__dirname, '../data');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const dbPath = path.join(dbDir, 'mock_interview.db');
const db     = new Database(dbPath);

/* ── Performance pragmas ────────────────────────────────── */
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

/* ── Schema ─────────────────────────────────────────────── */
db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id             TEXT PRIMARY KEY,
    track          TEXT NOT NULL,
    candidate_name TEXT NOT NULL DEFAULT 'Candidate',
    status         TEXT NOT NULL DEFAULT 'active'
                   CHECK(status IN ('active', 'completed')),
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS messages (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    sender     TEXT NOT NULL CHECK(sender IN ('user', 'ai')),
    text       TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS reports (
    session_id            TEXT PRIMARY KEY,
    overall_score         INTEGER NOT NULL,
    categories_json       TEXT    NOT NULL,
    strengths_json        TEXT    NOT NULL,
    weaknesses_json       TEXT    NOT NULL,
    advice_json           TEXT    NOT NULL,
    question_feedback_json TEXT   NOT NULL,
    created_at            DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE CASCADE
  );
`);

/* ── Safe migration: add candidate_name if it doesn't exist ── */
try {
  db.exec(`ALTER TABLE sessions ADD COLUMN candidate_name TEXT NOT NULL DEFAULT 'Candidate'`);
  console.log('[DB] Migrated: added candidate_name column to sessions');
} catch {
  // Column already exists — this is expected on fresh or already-migrated DBs
}

/* ─────────────────────────────────────────────────────────
   SESSION OPERATIONS
───────────────────────────────────────────────────────── */

/** Create a new interview session. */
function createSession(id, track, candidateName = 'Candidate') {
  db.prepare('INSERT INTO sessions (id, track, candidate_name) VALUES (?, ?, ?)')
    .run(id, track, candidateName);
}

/** Retrieve a session by ID. Returns undefined if not found. */
function getSession(id) {
  return db.prepare('SELECT * FROM sessions WHERE id = ?').get(id);
}

/** Update session status (e.g. 'active' → 'completed'). */
function updateSessionStatus(id, status) {
  db.prepare('UPDATE sessions SET status = ? WHERE id = ?').run(status, id);
}

/* ─────────────────────────────────────────────────────────
   MESSAGE OPERATIONS
───────────────────────────────────────────────────────── */

/** Append a message to a session's conversation. */
function addMessage(sessionId, sender, text) {
  db.prepare('INSERT INTO messages (session_id, sender, text) VALUES (?, ?, ?)')
    .run(sessionId, sender, text);
}

/** Retrieve all messages for a session, in chronological order. */
function getMessages(sessionId) {
  return db
    .prepare('SELECT * FROM messages WHERE session_id = ? ORDER BY id ASC')
    .all(sessionId);
}

/* ─────────────────────────────────────────────────────────
   REPORT OPERATIONS
───────────────────────────────────────────────────────── */

/** Persist a structured evaluation report. */
function createReport(sessionId, overallScore, categories, strengths, weaknesses, advice, questionFeedback) {
  db.prepare(`
    INSERT OR REPLACE INTO reports
      (session_id, overall_score, categories_json, strengths_json,
       weaknesses_json, advice_json, question_feedback_json)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    sessionId,
    overallScore,
    JSON.stringify(categories),
    JSON.stringify(strengths),
    JSON.stringify(weaknesses),
    JSON.stringify(advice),
    JSON.stringify(questionFeedback)
  );
}

/** Retrieve a report and deserialize JSON fields. Returns null if not found. */
function getReport(sessionId) {
  const row = db.prepare('SELECT * FROM reports WHERE session_id = ?').get(sessionId);
  if (!row) return null;

  return {
    session_id:        row.session_id,
    overall_score:     row.overall_score,
    scores:            JSON.parse(row.categories_json),
    strengths:         JSON.parse(row.strengths_json),
    weaknesses:        JSON.parse(row.weaknesses_json),
    actionable_tips:   JSON.parse(row.advice_json),
    question_feedback: JSON.parse(row.question_feedback_json),
    created_at:        row.created_at,
  };
}

module.exports = {
  db,
  createSession,
  getSession,
  updateSessionStatus,
  addMessage,
  getMessages,
  createReport,
  getReport,
};
