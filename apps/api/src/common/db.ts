import * as fs from "node:fs";
import * as path from "node:path";

import { Logger } from "@nestjs/common";
import { DefaultLogger, LogWriter } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";

import { schemas } from "@earthworm/schema";

import Database = require("better-sqlite3");

let connection: Database.Database;

export async function endDB() {
  if (connection) {
    connection.close();
    connection = null;
  }
}

export async function setupDB() {
  if (connection) return;

  const logger = new Logger("DB");

  class CustomDbLogWriter implements LogWriter {
    write(message: string) {
      logger.verbose(message);
    }
  }

  // 本地自部署模式：使用 SQLite 单文件数据库，无需外部 Postgres
  // 从当前目录向上查找已存在的 .volumes/earthworm.db（兼容 dev/src 与 dist 两种深度）
  function findDbFile(): string {
    if (process.env.SQLITE_PATH) return process.env.SQLITE_PATH;
    let dir = __dirname;
    for (let i = 0; i < 6; i++) {
      const candidate = path.resolve(dir, ".volumes/earthworm.db");
      if (fs.existsSync(candidate)) return candidate;
      dir = path.resolve(dir, "..");
    }
    return path.resolve(__dirname, ".volumes/earthworm.db");
  }
  const dbFile = findDbFile();
  fs.mkdirSync(path.dirname(dbFile), { recursive: true });
  logger.debug(`Opening sqlite file ${dbFile}`);

  connection = new Database(dbFile);
  connection.pragma("journal_mode = WAL");

  return drizzle(connection, {
    schema: schemas,
    logger: new DefaultLogger({ writer: new CustomDbLogWriter() }),
  });
}
