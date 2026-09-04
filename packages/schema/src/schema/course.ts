import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { coursePack, timestamp } from "./coursePack";
import { statement } from "./statement";

export const course = sqliteTable("courses", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  title: text("title").notNull(),
  description: text("description").default(""),
  video: text("video").default(""),
  order: integer("order").notNull(),
  coursePackId: text("course_pack_id")
    .notNull()
    .references(() => coursePack.id),
  createdAt: timestamp("created_at")
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at").$onUpdateFn(() => new Date()),
});

export const courseRelations = relations(course, ({ one, many }) => ({
  statements: many(statement),
  coursePack: one(coursePack, {
    fields: [course.coursePackId],
    references: [coursePack.id],
  }),
}));
