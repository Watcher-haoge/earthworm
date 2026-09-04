import { createId } from "@paralleldrive/cuid2";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { timestamp } from "./coursePack";

export const membership = sqliteTable("memberships", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: text("user_id").notNull(),
  start_date: timestamp("start_date").notNull(),
  end_date: timestamp("end_date").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: timestamp("created_at")
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at").$onUpdateFn(() => new Date()),
  type: text("type").notNull().default("regular"), // 先用 string 的形式， 后面需要改成枚举
});
