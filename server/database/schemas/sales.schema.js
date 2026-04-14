import {
  pgTable, uuid, varchar, text, numeric,
  boolean, timestamp, pgEnum,
} from "drizzle-orm/pg-core";
import { businesses } from "./businesses.schema.js";
import { parties }    from "./parties.schema.js";
import { products }   from "./products.schema.js";

export const saleTypeEnum = pgEnum("sale_type", [
  "invoice", "estimate", "delivery_challan", "pos",
]);

export const saleStatusEnum = pgEnum("sale_status", [
  "draft", "confirmed", "delivered", "returned", "cancelled",
]);

export const salePaymentModeEnum = pgEnum("sale_payment_mode", [
  "cash", "upi", "card", "bank_transfer", "credit", "cheque", "mixed",
]);

export const sales = pgTable("sales", {
  id:               uuid("id").defaultRandom().primaryKey(),
  businessId:       uuid("business_id")
                      .notNull()
                      .references(() => businesses.id, { onDelete: "cascade" }),
  customerId:       uuid("customer_id")
                      .references(() => parties.id, { onDelete: "set null" }),

  invoiceNumber:    varchar("invoice_number", { length: 50 }).notNull(),
  saleType:         saleTypeEnum("sale_type").default("invoice"),
  status:           saleStatusEnum("status").default("confirmed"),
  saleDate:         timestamp("sale_date").defaultNow(),
  dueDate:          timestamp("due_date"),

  // Financials
  subtotal:         numeric("subtotal",         { precision: 12, scale: 2 }).default("0"),
  discountAmount:   numeric("discount_amount",  { precision: 12, scale: 2 }).default("0"),
  taxableAmount:    numeric("taxable_amount",   { precision: 12, scale: 2 }).default("0"),
  cgstAmount:       numeric("cgst_amount",      { precision: 12, scale: 2 }).default("0"),
  sgstAmount:       numeric("sgst_amount",      { precision: 12, scale: 2 }).default("0"),
  igstAmount:       numeric("igst_amount",      { precision: 12, scale: 2 }).default("0"),
  cessAmount:       numeric("cess_amount",      { precision: 12, scale: 2 }).default("0"),
  roundOffAmount:   numeric("round_off_amount", { precision: 5,  scale: 2 }).default("0"),
  totalAmount:      numeric("total_amount",     { precision: 12, scale: 2 }).default("0"),
  paidAmount:       numeric("paid_amount",      { precision: 12, scale: 2 }).default("0"),
  balanceAmount:    numeric("balance_amount",   { precision: 12, scale: 2 }).default("0"),

  paymentMode:      salePaymentModeEnum("payment_mode").default("cash"),
  notes:            text("notes"),
  termsConditions:  text("terms_conditions"),

  // Return tracking
  isReturn:         boolean("is_return").default(false),
  originalSaleId:   uuid("original_sale_id"),

  createdAt:        timestamp("created_at").defaultNow(),
  updatedAt:        timestamp("updated_at").defaultNow(),
});

export const saleItems = pgTable("sale_items", {
  id:              uuid("id").defaultRandom().primaryKey(),
  saleId:          uuid("sale_id")
                     .notNull()
                     .references(() => sales.id, { onDelete: "cascade" }),
  productId:       uuid("product_id")
                     .references(() => products.id, { onDelete: "set null" }),

  // Snapshot at time of sale
  productName:     varchar("product_name", { length: 200 }).notNull(),
  hsnCode:         varchar("hsn_code",     { length: 10  }),
  quantity:        numeric("quantity",     { precision: 10, scale: 3 }).notNull(),
  unit:            varchar("unit",         { length: 20  }),
  sellingPrice:    numeric("selling_price",{ precision: 12, scale: 2 }).notNull(),
  mrp:             numeric("mrp",          { precision: 12, scale: 2 }),

  discountPercent: numeric("discount_percent", { precision: 5,  scale: 2 }).default("0"),
  discountAmount:  numeric("discount_amount",  { precision: 12, scale: 2 }).default("0"),
  taxableAmount:   numeric("taxable_amount",   { precision: 12, scale: 2 }).default("0"),

  cgstRate:        numeric("cgst_rate",   { precision: 5,  scale: 2 }).default("0"),
  sgstRate:        numeric("sgst_rate",   { precision: 5,  scale: 2 }).default("0"),
  igstRate:        numeric("igst_rate",   { precision: 5,  scale: 2 }).default("0"),
  cgstAmount:      numeric("cgst_amount", { precision: 12, scale: 2 }).default("0"),
  sgstAmount:      numeric("sgst_amount", { precision: 12, scale: 2 }).default("0"),
  igstAmount:      numeric("igst_amount", { precision: 12, scale: 2 }).default("0"),
  totalAmount:     numeric("total_amount",{ precision: 12, scale: 2 }).notNull(),

  createdAt:       timestamp("created_at").defaultNow(),
});