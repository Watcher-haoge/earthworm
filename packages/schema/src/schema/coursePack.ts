import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { course } from "./course";

export const timestamp = (name: string) => integer(name, { mode: "timestamp" });

export const coursePack = sqliteTable("course_packs", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  order: integer("order").notNull(),
  title: text("title").notNull(),
  description: text("description").default(""),
  isFree: integer("is_free", { mode: "boolean" }),
  cover: text("cover"),
  creatorId: text("creator_id").notNull(),
  shareLevel: text("share_level").default("private"),
  createdAt: timestamp("created_at")
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at").$onUpdateFn(() => new Date()),
});

export const coursePackRelations = relations(coursePack, ({ many }) => ({
  courses: many(course),
}));
