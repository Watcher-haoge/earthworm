import { createId } from "@paralleldrive/cuid2";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";

import { timestamp } from "./coursePack";

export const masteredElements = sqliteTable("mastered_elements", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: text("user_id").notNull(),
  content: text("content").notNull(),
  masteredAt: timestamp("mastered_at").$defaultFn(() => new Date()),
});
