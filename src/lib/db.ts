import Database from 'better-sqlite3';
import path from 'path';
import { existsSync, mkdirSync } from "node:fs";

const DATA_DIR = process.env.DATA_DIR || "/data";
const DB_PATH = path.join(DATA_DIR, 'database.sqlite');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;

  // Ensure data directory exists
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }

  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS people (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('student', 'teacher')),
      class_name TEXT DEFAULT '',
      photo_url TEXT DEFAULT '',
      bio TEXT DEFAULT '',
      password_hash TEXT NOT NULL,
      status TEXT DEFAULT 'approved' CHECK(status IN ('pending', 'approved', 'rejected')),
      rejection_reason TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS evaluations (
      id TEXT PRIMARY KEY,
      person_id TEXT NOT NULL,
      evaluator_id TEXT DEFAULT NULL,
      appearance INTEGER DEFAULT 0,
      personality INTEGER DEFAULT 0,
      grades INTEGER DEFAULT 0,
      talent INTEGER DEFAULT 0,
      popularity INTEGER DEFAULT 0,
      comment TEXT DEFAULT '',
      approved INTEGER DEFAULT 0,
      is_anonymous INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE CASCADE,
      FOREIGN KEY (evaluator_id) REFERENCES people(id) ON DELETE SET NULL
    );
    CREATE TABLE IF NOT EXISTS likes (
      id TEXT PRIMARY KEY,
      person_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('like', 'dislike')),
      ip_hash TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE CASCADE,
      UNIQUE(person_id, ip_hash)
    );
    CREATE TABLE IF NOT EXISTS suggestions (
      id TEXT PRIMARY KEY,
      content TEXT NOT NULL,
      contact TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      read INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT DEFAULT ''
    );
    CREATE INDEX IF NOT EXISTS idx_evaluations_person ON evaluations(person_id);
    CREATE INDEX IF NOT EXISTS idx_likes_person ON likes(person_id);
    CREATE INDEX IF NOT EXISTS idx_people_type ON people(type);
    CREATE INDEX IF NOT EXISTS idx_people_class ON people(class_name);
    CREATE TABLE IF NOT EXISTS game_scores (
      id TEXT PRIMARY KEY,
      person_id TEXT NOT NULL,
      score INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_game_scores_score ON game_scores(score DESC);
  `);

  // Run migrations for existing databases
  const cols = db.prepare("PRAGMA table_info(people)").all() as any[];
  if (!cols.some((c: any) => c.name === 'status')) {
    db.exec("ALTER TABLE people ADD COLUMN status TEXT DEFAULT 'approved'");
    db.prepare("UPDATE people SET status='approved' WHERE status IS NULL").run();
  }
  if (!cols.some((c: any) => c.name === 'rejection_reason')) {
    db.exec("ALTER TABLE people ADD COLUMN rejection_reason TEXT DEFAULT ''");
  }

  const ecols = db.prepare("PRAGMA table_info(evaluations)").all() as any[];
  if (!ecols.some((c: any) => c.name === 'evaluator_id')) {
    db.exec("ALTER TABLE evaluations ADD COLUMN evaluator_id TEXT DEFAULT NULL REFERENCES people(id) ON DELETE SET NULL");
  }
  if (!ecols.some((c: any) => c.name === 'is_anonymous')) {
    db.exec("ALTER TABLE evaluations ADD COLUMN is_anonymous INTEGER DEFAULT 0");
  }

  // Ensure settings table has site_declaration default
  const existing = db.prepare("SELECT value FROM settings WHERE key='site_declaration'").get() as any;
  if (!existing) {
    db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES ('site_declaration', '')").run();
  }

  return db;
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}
