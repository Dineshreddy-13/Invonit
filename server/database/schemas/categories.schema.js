import {
  pgTable, uuid, varchar, text, boolean, timestamp,
} from "drizzle-orm/pg-core";
import { businesses } from "./businesses.schema.js";

export const categories = pgTable("categories", {
  id:          uuid("id").defaultRandom().primaryKey(),
  businessId:  uuid("business_id")
                 .notNull()
                 .references(() => businesses.id, { onDelete: "cascade" }),
  name:        varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  // Self-referencing for sub-categories — no FK constraint to avoid
  // drizzle circular reference issues; enforced at service layer
  parentId:    uuid("parent_id"),
  isActive:    boolean("is_active").default(true),
  createdAt:   timestamp("created_at").defaultNow(),
  updatedAt:   timestamp("updated_at").defaultNow(),
});