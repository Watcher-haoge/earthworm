import { createId } from "@paralleldrive/cuid2";
import { integer, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";

import { timestamp } from "./coursePack";

export const userCourseProgress = sqliteTable(
  "user_course_progress",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("user_id").notNull(),
    coursePackId: text("course_pack_id").notNull(),
    courseId: text("course_id").notNull(),

    /**
     * from Statement's order
     */
    statementIndex: integer("statement_index").notNull(),
    createdAt: timestamp("created_at")
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: timestamp("updated_at").$onUpdateFn(() => new Date()),
  },
  (t) => ({
    unq: unique().on(t.userId, t.coursePackId),
  }),
);
