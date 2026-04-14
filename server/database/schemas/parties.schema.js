import {
  pgTable, uuid, varchar, text, boolean,
  numeric, timestamp, pgEnum,
} from "drizzle-orm/pg-core";
import { businesses } from "./businesses.schema.js";

export const partyTypeEnum = pgEnum("party_type", [
  "customer", "supplier", "both",
]);

export const parties = pgTable("parties", {
  id:                   uuid("id").defaultRandom().primaryKey(),
  businessId:           uuid("business_id")
                          .notNull()
                          .references(() => businesses.id, { onDelete: "cascade" }),
  name:                 varchar("name", { length: 150 }).notNull(),
  partyType:            partyTypeEnum("party_type").notNull(),
  phone:                varchar("phone", { length: 15 }),
  email:                varchar("email", { length: 150 }),
  gstin:                varchar("gstin", { length: 15 }),
  pan:                  varchar("pan", { length: 10 }),
  address:              text("address"),
  city:                 varchar("city", { length: 100 }),
  state:                varchar("state", { length: 100 }),
  pincode:              varchar("pincode", { length: 10 }),
  openingBalance:       numeric("opening_balance", { precision: 12, scale: 2 }).default("0"),
  openingBalanceType:   varchar("opening_balance_type", { length: 2 }).default("Dr"),  // Dr | Cr
  creditLimit:          numeric("credit_limit", { precision: 12, scale: 2 }).default("0"),
  creditDays:           numeric("credit_days", { precision: 4, scale: 0 }).default("0"),
  isActive:             boolean("is_active").default(true),
  notes:                text("notes"),
  createdAt:            timestamp("created_at").defaultNow(),
  updatedAt:            timestamp("updated_at").defaultNow(),
});