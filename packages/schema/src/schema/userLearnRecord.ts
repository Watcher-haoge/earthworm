import { createId } from "@paralleldrive/cuid2";
import { integer, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";

import { timestamp } from "./coursePack";

export const userLearnRecord = sqliteTable(
  "user_learn_record",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("user_id").notNull(),
    count: integer("count").notNull().default(0),
    day: text("day").notNull(),
    createdAt: timestamp("created_at")
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: timestamp("updated_at").$onUpdateFn(() => new Date()),
  },
  (t) => ({
    unq: unique().on(t.userId, t.day),
  }),
);
