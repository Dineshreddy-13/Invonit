import {
  pgTable, uuid, varchar, numeric, boolean, timestamp,
} from "drizzle-orm/pg-core";
import { businesses } from "./businesses.schema.js";

export const taxRates = pgTable("tax_rates", {
  id:         uuid("id").defaultRandom().primaryKey(),
  businessId: uuid("business_id")
                .notNull()
                .references(() => businesses.id, { onDelete: "cascade" }),
  taxName:    varchar("tax_name", { length: 50 }).notNull(),   // e.g. "GST 18%"
  hsnCode:    varchar("hsn_code",  { length: 10 }),
  sacCode:    varchar("sac_code",  { length: 10 }),
  cgstRate:   numeric("cgst_rate", { precision: 5, scale: 2 }).default("0"),
  sgstRate:   numeric("sgst_rate", { precision: 5, scale: 2 }).default("0"),
  igstRate:   numeric("igst_rate", { precision: 5, scale: 2 }).default("0"),
  cessRate:   numeric("cess_rate", { precision: 5, scale: 2 }).default("0"),
  isActive:   boolean("is_active").default(true),
  createdAt:  timestamp("created_at").defaultNow(),
  updatedAt:  timestamp("updated_at").defaultNow(),
});