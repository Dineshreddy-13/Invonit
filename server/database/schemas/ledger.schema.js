import {
  pgTable, uuid, varchar, text, numeric, timestamp, pgEnum,
} from "drizzle-orm/pg-core";
import { businesses } from "./businesses.schema.js";
import { parties }    from "./parties.schema.js";

export const ledgerEntryTypeEnum = pgEnum("ledger_entry_type", [
  "sale",
  "purchase",
  "payment_receipt",    // received from customer
  "payment_made",       // paid to supplier
  "expense",
  "opening_balance",
  "journal",
  "sale_return",
  "purchase_return",
]);

export const ledgerEntries = pgTable("ledger_entries", {
  id:              uuid("id").defaultRandom().primaryKey(),
  businessId:      uuid("business_id")
                     .notNull()
                     .references(() => businesses.id, { onDelete: "cascade" }),
  partyId:         uuid("party_id")
                     .references(() => parties.id, { onDelete: "set null" }),

  entryType:       ledgerEntryTypeEnum("entry_type").notNull(),
  referenceId:     uuid("reference_id"),         // purchase/sale/payment id
  referenceType:   varchar("reference_type",  { length: 30 }),
  referenceNumber: varchar("reference_number",{ length: 50 }), // invoice/receipt no

  debitAmount:     numeric("debit_amount",  { precision: 12, scale: 2 }).default("0"),
  creditAmount:    numeric("credit_amount", { precision: 12, scale: 2 }).default("0"),
  description:     text("description"),
  entryDate:       timestamp("entry_date").defaultNow(),

  createdAt:       timestamp("created_at").defaultNow(),
});