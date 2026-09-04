import { createId } from "@paralleldrive/cuid2";
import { integer, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";

import { timestamp } from "./coursePack";

export const courseHistory = sqliteTable(
  "course_history",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("user_id").notNull(),
    courseId: text("course_id").notNull(),
    coursePackId: text("course_pack_id").notNull(),
    completionCount: integer("completion_count").notNull(),
    createdAt: timestamp("created_at")
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: timestamp("updated_at").$onUpdateFn(() => new Date()),
  },
  (t) => ({
    unq: unique().on(t.userId, t.courseId, t.coursePackId),
  }),
);
