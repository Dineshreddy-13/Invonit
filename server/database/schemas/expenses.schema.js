import { pgTable, uuid, varchar, text, numeric, boolean, timestamp } from "drizzle-orm/pg-core";
import { businesses } from "./index.js";

// ────── Expense Categories ──────────────────────────────────────────────────
export const expenseCategories = pgTable("expenseCategories", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("businessId").notNull().references(() => businesses.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

// ────── Expenses ────────────────────────────────────────────────────────────
export const expenses = pgTable("expenses", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("businessId").notNull().references(() => businesses.id, { onDelete: "cascade" }),
  categoryId: uuid("categoryId").references(() => expenseCategories.id, { onDelete: "set null" }),
  title: varchar("title", { length: 200 }).notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  gstAmount: numeric("gstAmount", { precision: 12, scale: 2 }).notNull().default("0"),
  paymentMode: varchar("paymentMode", { length: 20 }),
  expenseDate: timestamp("expenseDate").notNull().defaultNow(),
  receiptUrl: text("receiptUrl"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});
