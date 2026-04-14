import {
  pgTable, uuid, varchar, text, numeric, timestamp, pgEnum,
} from "drizzle-orm/pg-core";
import { businesses } from "./businesses.schema.js";
import { parties }    from "./parties.schema.js";

export const paymentTypeEnum = pgEnum("payment_type", [
  "receipt",   // money received FROM customer
  "payment",   // money paid TO supplier
]);

export const payments = pgTable("payments", {
  id:             uuid("id").defaultRandom().primaryKey(),
  businessId:     uuid("business_id")
                    .notNull()
                    .references(() => businesses.id, { onDelete: "cascade" }),
  partyId:        uuid("party_id")
                    .references(() => parties.id, { onDelete: "set null" }),

  paymentType:    paymentTypeEnum("payment_type").notNull(),
  referenceId:    uuid("reference_id"),          // purchase_id or sale_id
  referenceType:  varchar("reference_type", { length: 20 }), // "purchase" | "sale"
  referenceNumber:varchar("reference_number",{ length: 50 }), // invoice number

  amount:         numeric("amount", { precision: 12, scale: 2 }).notNull(),
  paymentMode:    varchar("payment_mode",   { length: 20  }),
  transactionRef: varchar("transaction_ref",{ length: 100 }), // UPI txn / cheque no

  paymentDate:    timestamp("payment_date").defaultNow(),
  notes:          text("notes"),

  createdAt:      timestamp("created_at").defaultNow(),
  updatedAt:      timestamp("updated_at").defaultNow(),
});