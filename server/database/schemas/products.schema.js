import {
  pgTable, uuid, varchar, text, numeric,
  boolean, timestamp, pgEnum,
} from "drizzle-orm/pg-core";
import { businesses }  from "./businesses.schema.js";
import { categories }  from "./categories.schema.js";
import { taxRates }    from "./taxRates.schema.js";

export const unitTypeEnum = pgEnum("unit_type", [
  "pcs", "kg", "g", "l", "ml", "m", "cm",
  "box", "pack", "dozen", "pair", "set",
]);

export const products = pgTable("products", {
  id:                uuid("id").defaultRandom().primaryKey(),
  businessId:        uuid("business_id")
                       .notNull()
                       .references(() => businesses.id, { onDelete: "cascade" }),
  categoryId:        uuid("category_id")
                       .references(() => categories.id, { onDelete: "set null" }),
  taxRateId:         uuid("tax_rate_id")
                       .references(() => taxRates.id,   { onDelete: "set null" }),

  // Identity
  name:              varchar("name",    { length: 200 }).notNull(),
  sku:               varchar("sku",     { length: 50  }),
  barcode:           varchar("barcode", { length: 50  }),
  hsnCode:           varchar("hsn_code",{ length: 10  }),
  description:       text("description"),
  imageUrl:          text("image_url"),

  // Pricing
  unit:              unitTypeEnum("unit").default("pcs"),
  purchasePrice:     numeric("purchase_price",  { precision: 12, scale: 2 }).default("0"),
  sellingPrice:      numeric("selling_price",   { precision: 12, scale: 2 }).default("0"),
  mrp:               numeric("mrp",             { precision: 12, scale: 2 }),
  wholesalePrice:    numeric("wholesale_price", { precision: 12, scale: 2 }),

  // Inventory
  openingStock:      numeric("opening_stock",      { precision: 10, scale: 3 }).default("0"),
  currentStock:      numeric("current_stock",      { precision: 10, scale: 3 }).default("0"),
  lowStockThreshold: numeric("low_stock_threshold",{ precision: 10, scale: 3 }).default("5"),
  trackInventory:    boolean("track_inventory").default(true),
  allowNegativeStock:boolean("allow_negative_stock").default(false),

  isActive:          boolean("is_active").default(true),
  createdAt:         timestamp("created_at").defaultNow(),
  updatedAt:         timestamp("updated_at").defaultNow(),
});