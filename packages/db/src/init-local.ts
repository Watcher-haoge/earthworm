import fs from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";
import dotenv from "dotenv";

// 本地自部署模式：直接用幂等 DDL 创建 SQLite 表，替代 drizzle-kit push
// （drizzle-kit 0.23 与 better-sqlite3 v11 不兼容，且本机无原生编译工具链）
dotenv.config({ path: path.resolve(__dirname, "../../apps/api/.env") });

const dbFile = process.env.SQLITE_PATH || path.resolve(__dirname, "../../../.volumes/earthworm.db");
fs.mkdirSync(path.dirname(dbFile), { recursive: true });
console.log("sqlite file: ", dbFile);

const db = new Database(dbFile);
db.pragma("journal_mode = WAL");

db.exec(`
CREATE TABLE IF NOT EXISTS course_packs (
  id TEXT PRIMARY KEY,
  "order" INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  is_free INTEGER,
  cover TEXT,
  creator_id TEXT NOT NULL,
  share_level TEXT DEFAULT 'private',
  created_at INTEGER NOT NULL,
  updated_at INTEGER
);

CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  video TEXT DEFAULT '',
  "order" INTEGER NOT NULL,
  course_pack_id TEXT NOT NULL REFERENCES course_packs(id),
  created_at INTEGER NOT NULL,
  updated_at INTEGER
);

CREATE TABLE IF NOT EXISTS statements (
  id TEXT PRIMARY KEY,
  "order" INTEGER NOT NULL,
  chinese TEXT NOT NULL,
  english TEXT NOT NULL,
  soundmark TEXT NOT NULL,
  course_id TEXT NOT NULL REFERENCES courses(id),
  created_at INTEGER NOT NULL,
  updated_at INTEGER
);

CREATE TABLE IF NOT EXISTS user_course_progress (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  course_pack_id TEXT NOT NULL,
  course_id TEXT NOT NULL,
  statement_index INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER,
  UNIQUE (user_id, course_pack_id)
);

CREATE TABLE IF NOT EXISTS course_history (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  course_id TEXT NOT NULL,
  course_pack_id TEXT NOT NULL,
  completion_count INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER,
  UNIQUE (user_id, course_id, course_pack_id)
);

CREATE TABLE IF NOT EXISTS mastered_elements (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  mastered_at INTEGER
);

CREATE TABLE IF NOT EXISTS user_learning_activities (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,
  activity_type TEXT NOT NULL,
  course_id TEXT,
  duration INTEGER NOT NULL,
  metadata TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER,
  UNIQUE (user_id, date, activity_type)
);

CREATE TABLE IF NOT EXISTS user_learn_record (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  day TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER,
  UNIQUE (user_id, day)
);

CREATE TABLE IF NOT EXISTS memberships (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  start_date INTEGER NOT NULL,
  end_date INTEGER NOT NULL,
  is_active INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER,
  type TEXT NOT NULL DEFAULT 'regular'
);
`);

const tables = db
  .prepare(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
  )
  .all()
  .map((row: any) => row.name);
console.log("tables ready: ", tables.join(", "));
db.close();
