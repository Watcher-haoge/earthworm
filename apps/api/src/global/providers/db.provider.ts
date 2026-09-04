import { FactoryProvider } from "@nestjs/common";
import { type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";

import { SchemaType } from "@earthworm/schema";
import { setupDB } from "../../common/db";

export const DB = Symbol("DB_SERVICE");
export type DbType = BetterSQLite3Database<SchemaType>;

export const DbProvider: FactoryProvider<DbType> = {
  provide: DB,
  useFactory: async () => {
    return await setupDB();
  },
};
