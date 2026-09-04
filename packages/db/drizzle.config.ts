import path from "path";
import type { Config } from "drizzle-kit";

import * as dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "../../apps/api/.env") });

const dbFile = process.env.SQLITE_PATH || path.resolve(__dirname, "../../.volumes/earthworm.db");
console.log("sqlite file: ", dbFile);

export default {
  schema: "../schema/src/schema/*",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: dbFile,
  },
} satisfies Config;
