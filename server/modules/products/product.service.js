import {
  and, eq, ilike, or, sql, desc, asc,
  lte, isNull, isNotNull,
} from "drizzle-orm";
import { db }          from "../../database/db.js";
import {
  products, categories, taxRates,
} from "../../database/schemas/index.js";
import {
  MSG,
  DEFAULT_PAGE, DEFAULT_LIMIT, MAX_LIMIT,
  DEFAULT_LOW_STOCK_THRESHOLD,
  STOCK_ADJUSTMENT_REASONS,
} from "../../utils/constants.js";

// ─── Helpers ──────────────────────────────────────────────────────────────
function notFound() {
  const e = new Error(MSG.PRODUCT_NOT_FOUND); e.statusCode = 404; return e;
}
function forbidden() {
  const e = new Error(MSG.PRODUCT_FORBIDDEN); e.statusCode = 403; return e;
}

async function verifyOwnership(productId, businessId) {
  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);

  if (!product) throw notFound();
  if (product.businessId !== businessId) throw forbidden();
  return product;
}

// ─── Build product row with joined names ──────────────────────────────────
// Returns product + categoryName + taxRateName for display
async function withRelations(productId) {
  const [row] = await db
    .select({
      // All product fields
      id:                products.id,
      businessId:        products.businessId,
      categoryId:        products.categoryId,
      taxRateId:         products.taxRateId,
      name:              products.name,
      sku:               products.sku,
      barcode:           products.barcode,
      hsnCode:           products.hsnCode,
      description:       products.description,
      imageUrl:          products.imageUrl,
      unit:              products.unit,
      purchasePrice:     products.purchasePrice,
      sellingPrice:      products.sellingPrice,
      mrp:               products.mrp,
      wholesalePrice:    products.wholesalePrice,
      openingStock:      products.openingStock,
      currentStock:      products.currentStock,
      lowStockThreshold: products.lowStockThreshold,
      trackInventory:    products.trackInventory,
      allowNegativeStock:products.allowNegativeStock,
      isActive:          products.isActive,
      createdAt:         products.createdAt,
      updatedAt:         products.updatedAt,
      // Joined
      categoryName:      categories.name,
      taxRateName:       taxRates.taxName,
      cgstRate:          taxRates.cgstRate,
      sgstRate:          taxRates.sgstRate,
      igstRate:          taxRates.igstRate,
      cessRate:          taxRates.cessRate,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .leftJoin(taxRates,   eq(products.taxRateId,  taxRates.id))
    .where(eq(products.id, productId))
    .limit(1);

  return row ?? null;
}

// ─── Uniqueness checks ────────────────────────────────────────────────────
async function checkUnique(businessId, field, value, excludeId = null) {
  const conditions = [
    eq(products.businessId, businessId),
    eq(products[field], value),
  ];
  if (excludeId) {
    conditions.push(sql`${products.id} != ${excludeId}`);
  }
  const [dup] = await db
    .select({ id: products.id })
    .from(products)
    .where(and(...conditions))
    .limit(1);
  return !!dup;
}

// ─── Validate FK references belong to same business ───────────────────────
async function validateFKs(businessId, categoryId, taxRateId) {
  const errors = [];

  if (categoryId) {
    const [cat] = await db
      .select({ id: categories.id, businessId: categories.businessId, isActive: categories.isActive })
      .from(categories)
      .where(eq(categories.id, categoryId))
      .limit(1);

    if (!cat || cat.businessId !== businessId || !cat.isActive) {
      errors.push("Category not found or does not belong to this business.");
    }
  }

  if (taxRateId) {
    const [rate] = await db
      .select({ id: taxRates.id, businessId: taxRates.businessId, isActive: taxRates.isActive })
      .from(taxRates)
      .where(eq(taxRates.id, taxRateId))
      .limit(1);

    if (!rate || rate.businessId !== businessId || !rate.isActive) {
      errors.push("Tax rate not found or does not belong to this business.");
    }
  }

  return errors;
}

// ─── Create Product ────────────────────────────────────────────────────────
export async function createProduct(businessId, payload) {
  // FK validation
  const fkErrors = await validateFKs(
    businessId,
    payload.categoryId ?? null,
    payload.taxRateId  ?? null
  );
  if (fkErrors.length > 0) {
    const e = new Error(fkErrors.join(" ")); e.statusCode = 400; throw e;
  }

  // Uniqueness checks
  if (payload.sku) {
    const exists = await checkUnique(businessId, "sku", payload.sku);
    if (exists) { const e = new Error(MSG.PRODUCT_SKU_EXISTS); e.statusCode = 409; throw e; }
  }

  if (payload.barcode) {
    const exists = await checkUnique(businessId, "barcode", payload.barcode);
    if (exists) { const e = new Error(MSG.PRODUCT_BARCODE_EXISTS); e.statusCode = 409; throw e; }
  }

  // Name uniqueness within business
  const [dupName] = await db
    .select({ id: products.id })
    .from(products)
    .where(
      and(
        eq(products.businessId, businessId),
        ilike(products.name, payload.name.trim())
      )
    )
    .limit(1);
  if (dupName) { const e = new Error(MSG.PRODUCT_NAME_EXISTS); e.statusCode = 409; throw e; }

  const openingStock = payload.openingStock ?? "0";

  const [product] = await db
    .insert(products)
    .values({
      businessId,
      categoryId:         payload.categoryId         ?? null,
      taxRateId:          payload.taxRateId           ?? null,
      name:               payload.name.trim(),
      sku:                payload.sku                 ?? null,
      barcode:            payload.barcode             ?? null,
      hsnCode:            payload.hsnCode             ?? null,
      description:        payload.description         ?? null,
      imageUrl:           payload.imageUrl            ?? null,
      unit:               payload.unit                ?? "pcs",
      purchasePrice:      payload.purchasePrice       ?? "0",
      sellingPrice:       payload.sellingPrice        ?? "0",
      mrp:                payload.mrp                 ?? null,
      wholesalePrice:     payload.wholesalePrice      ?? null,
      openingStock,
      currentStock:       openingStock,              // currentStock starts at openingStock
      lowStockThreshold:  payload.lowStockThreshold  ?? String(DEFAULT_LOW_STOCK_THRESHOLD),
      trackInventory:     payload.trackInventory      ?? true,
      allowNegativeStock: payload.allowNegativeStock  ?? false,
    })
    .returning();

  return withRelations(product.id);
}

// ─── List Products ─────────────────────────────────────────────────────────
export async function listProducts(businessId, query) {
  const page   = Math.max(parseInt(query.page  ?? DEFAULT_PAGE,  10), 1);
  const limit  = Math.min(parseInt(query.limit ?? DEFAULT_LIMIT, 10), MAX_LIMIT);
  const offset = (page - 1) * limit;

  const conditions = [
    eq(products.businessId, businessId),
    eq(products.isActive, true),
  ];

  // Filter by category
  if (query.categoryId) {
    conditions.push(eq(products.categoryId, query.categoryId));
  }

  // Filter by tax rate
  if (query.taxRateId) {
    conditions.push(eq(products.taxRateId, query.taxRateId));
  }

  // Only low-stock items
  if (query.lowStock === "true") {
    conditions.push(
      and(
        eq(products.trackInventory, true),
        lte(products.currentStock, products.lowStockThreshold)
      )
    );
  }

  // Only out-of-stock
  if (query.outOfStock === "true") {
    conditions.push(
      and(
        eq(products.trackInventory, true),
        lte(products.currentStock, sql`0`)
      )
    );
  }

  // Search by name, SKU, or barcode
  if (query.search?.trim()) {
    const term = `%${query.search.trim()}%`;
    conditions.push(
      or(
        ilike(products.name,    term),
        ilike(products.sku,     term),
        ilike(products.barcode, term),
        ilike(products.hsnCode, term)
      )
    );
  }

  // Barcode lookup (exact — used by POS scanner)
  if (query.barcode?.trim()) {
    conditions.push(eq(products.barcode, query.barcode.trim()));
  }

  const whereClause = and(...conditions);

  // Sorting
  const SORT_MAP = {
    name:         products.name,
    sellingPrice: products.sellingPrice,
    currentStock: products.currentStock,
    createdAt:    products.createdAt,
  };
  const sortField = SORT_MAP[query.sortBy] ?? products.createdAt;
  const sortOrder = query.order === "asc" ? asc(sortField) : desc(sortField);

  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        id:                products.id,
        businessId:        products.businessId,
        categoryId:        products.categoryId,
        taxRateId:         products.taxRateId,
        name:              products.name,
        sku:               products.sku,
        barcode:           products.barcode,
        hsnCode:           products.hsnCode,
        description:       products.description,
        imageUrl:          products.imageUrl,
        unit:              products.unit,
        purchasePrice:     products.purchasePrice,
        sellingPrice:      products.sellingPrice,
        mrp:               products.mrp,
        wholesalePrice:    products.wholesalePrice,
        openingStock:      products.openingStock,
        currentStock:      products.currentStock,
        lowStockThreshold: products.lowStockThreshold,
        trackInventory:    products.trackInventory,
        allowNegativeStock:products.allowNegativeStock,
        isActive:          products.isActive,
        createdAt:         products.createdAt,
        updatedAt:         products.updatedAt,
        categoryName:      categories.name,
        taxRateName:       taxRates.taxName,
        cgstRate:          taxRates.cgstRate,
        sgstRate:          taxRates.sgstRate,
        igstRate:          taxRates.igstRate,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .leftJoin(taxRates,   eq(products.taxRateId,  taxRates.id))
      .where(whereClause)
      .orderBy(sortOrder)
      .limit(limit)
      .offset(offset),

    db
      .select({ total: sql`count(*)::int` })
      .from(products)
      .where(whereClause),
  ]);

  return {
    products: rows,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

// ─── Get Product by ID ─────────────────────────────────────────────────────
export async function getProductById(productId, businessId) {
  await verifyOwnership(productId, businessId);
  return withRelations(productId);
}

// ─── Get Product by Barcode (POS use) ─────────────────────────────────────
export async function getProductByBarcode(barcode, businessId) {
  const [product] = await db
    .select({ id: products.id, businessId: products.businessId })
    .from(products)
    .where(
      and(
        eq(products.businessId, businessId),
        eq(products.barcode, barcode),
        eq(products.isActive, true)
      )
    )
    .limit(1);

  if (!product) throw notFound();
  return withRelations(product.id);
}

// ─── Update Product ────────────────────────────────────────────────────────
export async function updateProduct(productId, businessId, payload) {
  await verifyOwnership(productId, businessId);

  // FK validation if changing category or taxRate
  if (payload.categoryId !== undefined || payload.taxRateId !== undefined) {
    const fkErrors = await validateFKs(
      businessId,
      payload.categoryId,
      payload.taxRateId
    );
    if (fkErrors.length > 0) {
      const e = new Error(fkErrors.join(" ")); e.statusCode = 400; throw e;
    }
  }

  // Uniqueness checks on change
  if (payload.sku) {
    const exists = await checkUnique(businessId, "sku", payload.sku, productId);
    if (exists) { const e = new Error(MSG.PRODUCT_SKU_EXISTS); e.statusCode = 409; throw e; }
  }

  if (payload.barcode) {
    const exists = await checkUnique(businessId, "barcode", payload.barcode, productId);
    if (exists) { const e = new Error(MSG.PRODUCT_BARCODE_EXISTS); e.statusCode = 409; throw e; }
  }

  if (payload.name) {
    const [dup] = await db
      .select({ id: products.id })
      .from(products)
      .where(
        and(
          eq(products.businessId, businessId),
          ilike(products.name, payload.name.trim()),
          sql`${products.id} != ${productId}`
        )
      )
      .limit(1);
    if (dup) { const e = new Error(MSG.PRODUCT_NAME_EXISTS); e.statusCode = 409; throw e; }
  }

  const ALLOWED = [
    "categoryId", "taxRateId", "name", "sku", "barcode", "hsnCode",
    "description", "imageUrl", "unit",
    "purchasePrice", "sellingPrice", "mrp", "wholesalePrice",
    "lowStockThreshold", "trackInventory", "allowNegativeStock",
  ];

  const updates = {};
  for (const field of ALLOWED) {
    if (payload[field] !== undefined) {
      updates[field] = field === "name" ? payload[field].trim() : payload[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    const e = new Error("No valid fields provided for update."); e.statusCode = 400; throw e;
  }

  updates.updatedAt = new Date();

  await db
    .update(products)
    .set(updates)
    .where(eq(products.id, productId));

  return withRelations(productId);
}

// ─── Soft Delete Product ───────────────────────────────────────────────────
export async function deleteProduct(productId, businessId) {
  await verifyOwnership(productId, businessId);

  await db
    .update(products)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(products.id, productId));
}

// ─── Manual Stock Adjustment ───────────────────────────────────────────────
// reason: opening_stock | damage | loss | return | correction | other
// type: "add" | "subtract"
export async function adjustStock(productId, businessId, payload) {
  const product = await verifyOwnership(productId, businessId);

  const quantity   = parseFloat(payload.quantity);
  const adjustType = payload.type; // "add" | "subtract"

  const currentStock = parseFloat(product.currentStock);
  let newStock;

  if (adjustType === "add") {
    newStock = currentStock + quantity;
  } else {
    newStock = currentStock - quantity;

    // Enforce no-negative-stock rule (unless product allows it)
    if (newStock < 0 && !product.allowNegativeStock) {
      const e = new Error(MSG.PRODUCT_NEGATIVE_STOCK); e.statusCode = 409; throw e;
    }
  }

  await db
    .update(products)
    .set({
      currentStock: String(newStock),
      updatedAt: new Date(),
    })
    .where(eq(products.id, productId));

  return {
    productId,
    productName:  product.name,
    previousStock: currentStock,
    adjustment:   adjustType === "add" ? quantity : -quantity,
    newStock,
    reason:       payload.reason ?? "correction",
    notes:        payload.notes  ?? null,
  };
}

// ─── Stock Summary Report ──────────────────────────────────────────────────
export async function getStockSummary(businessId) {
  const [summary] = await db
    .select({
      totalProducts:    sql`count(*)::int`,
      totalStockValue:  sql`sum(
                            cast(current_stock as numeric) *
                            cast(purchase_price as numeric)
                          )::numeric(14,2)`,
      lowStockCount:    sql`count(*) filter (
                            where track_inventory = true
                            and cast(current_stock as numeric) <= cast(low_stock_threshold as numeric)
                            and cast(current_stock as numeric) > 0
                          )::int`,
      outOfStockCount:  sql`count(*) filter (
                            where track_inventory = true
                            and cast(current_stock as numeric) <= 0
                          )::int`,
    })
    .from(products)
    .where(
      and(
        eq(products.businessId, businessId),
        eq(products.isActive, true)
      )
    );

  return summary;
}

// ─── Low Stock Items ───────────────────────────────────────────────────────
export async function getLowStockProducts(businessId) {
  const rows = await db
    .select({
      id:                products.id,
      name:              products.name,
      sku:               products.sku,
      barcode:           products.barcode,
      unit:              products.unit,
      currentStock:      products.currentStock,
      lowStockThreshold: products.lowStockThreshold,
      categoryName:      categories.name,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(
      and(
        eq(products.businessId, businessId),
        eq(products.isActive, true),
        eq(products.trackInventory, true),
        lte(products.currentStock, products.lowStockThreshold)
      )
    )
    .orderBy(asc(products.currentStock));

  return rows;
}