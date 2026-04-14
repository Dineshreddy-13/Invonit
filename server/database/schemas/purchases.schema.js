import {
  pgTable, uuid, varchar, text, numeric,
  boolean, timestamp, pgEnum,
} from "drizzle-orm/pg-core";
import { businesses } from "./businesses.schema.js";
import { parties }    from "./parties.schema.js";
import { products }   from "./products.schema.js";

export const purchaseStatusEnum = pgEnum("purchase_status", [
  "draft", "received", "partial", "returned", "cancelled",
]);

export const purchaseSourceEnum = pgEnum("purchase_source", [
  "manual", "ocr",
]);

export const purchases = pgTable("purchases", {
  id:               uuid("id").defaultRandom().primaryKey(),
  businessId:       uuid("business_id")
                      .notNull()
                      .references(() => businesses.id, { onDelete: "cascade" }),
  supplierId:       uuid("supplier_id")
                      .references(() => parties.id, { onDelete: "set null" }),

  invoiceNumber:    varchar("invoice_number",   { length: 50  }),  // Supplier's invoice
  referenceNumber:  varchar("reference_number", { length: 50  }),  // Internal ref
  purchaseDate:     timestamp("purchase_date").defaultNow(),
  dueDate:          timestamp("due_date"),

  status:           purchaseStatusEnum("status").default("received"),
  source:           purchaseSourceEnum("source").default("manual"),

  // Financials
  subtotal:         numeric("subtotal",          { precision: 12, scale: 2 }).default("0"),
  discountAmount:   numeric("discount_amount",   { precision: 12, scale: 2 }).default("0"),
  taxableAmount:    numeric("taxable_amount",    { precision: 12, scale: 2 }).default("0"),
  cgstAmount:       numeric("cgst_amount",       { precision: 12, scale: 2 }).default("0"),
  sgstAmount:       numeric("sgst_amount",       { precision: 12, scale: 2 }).default("0"),
  igstAmount:       numeric("igst_amount",       { precision: 12, scale: 2 }).default("0"),
  cessAmount:       numeric("cess_amount",       { precision: 12, scale: 2 }).default("0"),
  totalAmount:      numeric("total_amount",      { precision: 12, scale: 2 }).default("0"),
  paidAmount:       numeric("paid_amount",       { precision: 12, scale: 2 }).default("0"),
  balanceAmount:    numeric("balance_amount",    { precision: 12, scale: 2 }).default("0"),

  paymentMode:      varchar("payment_mode", { length: 20 }),
  notes:            text("notes"),

  // OCR fields
  billImageUrl:     text("bill_image_url"),
  ocrRawData:       text("ocr_raw_data"),
  isDuplicate:      boolean("is_duplicate").default(false),

  // Return tracking
  isReturn:         boolean("is_return").default(false),
  originalPurchaseId: uuid("original_purchase_id"),

  createdAt:        timestamp("created_at").defaultNow(),
  updatedAt:        timestamp("updated_at").defaultNow(),
});

export const purchaseItems = pgTable("purchase_items", {
  id:              uuid("id").defaultRandom().primaryKey(),
  purchaseId:      uuid("purchase_id")
                     .notNull()
                     .references(() => purchases.id, { onDelete: "cascade" }),
  productId:       uuid("product_id")
                     .references(() => products.id, { onDelete: "set null" }),

  // Snapshot at time of purchase
  productName:     varchar("product_name", { length: 200 }).notNull(),
  hsnCode:         varchar("hsn_code",     { length: 10  }),
  quantity:        numeric("quantity",     { precision: 10, scale: 3 }).notNull(),
  unit:            varchar("unit",         { length: 20  }),
  purchasePrice:   numeric("purchase_price",  { precision: 12, scale: 2 }).notNull(),

  discountPercent: numeric("discount_percent",  { precision: 5,  scale: 2 }).default("0"),
  discountAmount:  numeric("discount_amount",   { precision: 12, scale: 2 }).default("0"),
  taxableAmount:   numeric("taxable_amount",    { precision: 12, scale: 2 }).default("0"),

  cgstRate:        numeric("cgst_rate",   { precision: 5,  scale: 2 }).default("0"),
  sgstRate:        numeric("sgst_rate",   { precision: 5,  scale: 2 }).default("0"),
  igstRate:        numeric("igst_rate",   { precision: 5,  scale: 2 }).default("0"),
  cgstAmount:      numeric("cgst_amount", { precision: 12, scale: 2 }).default("0"),
  sgstAmount:      numeric("sgst_amount", { precision: 12, scale: 2 }).default("0"),
  igstAmount:      numeric("igst_amount", { precision: 12, scale: 2 }).default("0"),
  totalAmount:     numeric("total_amount",{ precision: 12, scale: 2 }).notNull(),

  isOcrMatched:    boolean("is_ocr_matched").default(false),
  createdAt:       timestamp("created_at").defaultNow(),
});