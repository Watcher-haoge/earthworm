import fs from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";
import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/better-sqlite3";

import { schemas } from "@earthworm/schema";

const envName = process.env.NODE_ENV === "prod" ? ".env.prod" : ".env";
dotenv.config({ path: path.resolve(__dirname, `../../../apps/api/${envName}`) });

const dbFile = process.env.SQLITE_PATH || path.resolve(__dirname, "../../../.volumes/earthworm.db");
fs.mkdirSync(path.dirname(dbFile), { recursive: true });

console.log("sqlite file: ", dbFile);
const connection = new Database(dbFile);
connection.pragma("journal_mode = WAL");

export const db = drizzle(connection, {
  schema: schemas,
});
