import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { course } from "./course";
import { timestamp } from "./coursePack";

export const statement = sqliteTable("statements", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  order: integer("order").notNull(),
  chinese: text("chinese").notNull(),
  english: text("english").notNull(),
  soundmark: text("soundmark").notNull(),
  courseId: text("course_id")
    .notNull()
    .references(() => course.id),
  createdAt: timestamp("created_at")
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at").$onUpdateFn(() => new Date()),
});

export const statementRelations = relations(statement, ({ one }) => ({
  course: one(course, {
    fields: [statement.courseId],
    references: [course.id],
  }),
}));
