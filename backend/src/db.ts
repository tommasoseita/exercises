import Database, { Database as DatabaseType } from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(__dirname, '..', 'exercises.db');

const db: DatabaseType = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS exercises (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    system_prompt TEXT NOT NULL,
    end_condition_type TEXT NOT NULL CHECK(end_condition_type IN ('max_turns', 'keyword', 'ai_decides')),
    end_condition_value TEXT NOT NULL DEFAULT '',
    feedback_type TEXT NOT NULL CHECK(feedback_type IN ('static', 'ai_generated')) DEFAULT 'static',
    feedback_message TEXT NOT NULL DEFAULT '',
    video_url TEXT NOT NULL DEFAULT '',
    published INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS completions (
    id TEXT PRIMARY KEY,
    exercise_id TEXT NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    learner_id TEXT NOT NULL DEFAULT 'anonymous',
    messages TEXT NOT NULL DEFAULT '[]',
    feedback TEXT NOT NULL DEFAULT '',
    completed_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

export default db;
