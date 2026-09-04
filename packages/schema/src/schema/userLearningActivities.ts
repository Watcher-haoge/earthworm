import { createId } from "@paralleldrive/cuid2";
import { integer, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";

import { timestamp } from "./coursePack";

export const userLearningActivities = sqliteTable(
  "user_learning_activities",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("user_id").notNull(),
    date: text("date").notNull(),
    activityType: text("activity_type").notNull(),
    courseId: text("course_id"),
    duration: integer("duration").notNull(),
    metadata: text("metadata", { mode: "json" }),
    createdAt: timestamp("created_at")
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: timestamp("updated_at").$onUpdateFn(() => new Date()),
  },
  (t) => ({
    unq: unique().on(t.userId, t.date, t.activityType),
  }),
);
