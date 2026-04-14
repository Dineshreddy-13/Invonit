import * as productService from "./product.service.js";
import {
  HTTP, MSG,
  UNIT_TYPES, SKU_REGEX, BARCODE_REGEX, HSN_REGEX,
  STOCK_ADJUSTMENT_REASONS,
} from "../../utils/constants.js";

// ─── Response Helpers ──────────────────────────────────────────────────────
const ok      = (res, msg, data) => res.status(HTTP.OK).json({ success: true, message: msg, data });
const created = (res, msg, data) => res.status(HTTP.CREATED).json({ success: true, message: msg, data });
const noData  = (res, msg)       => res.status(HTTP.OK).json({ success: true, message: msg });
const fail    = (res, code, msg, errors) => {
  const body = { success: false, message: msg };
  if (errors?.length) body.errors = errors;
  return res.status(code).json(body);
};

// ─── Validation ───────────────────────────────────────────────────────────
function validatePrice(value, label, errors) {
  if (value === undefined) return;
  const n = parseFloat(value);
  if (isNaN(n) || n < 0) errors.push(`${label} must be a non-negative number.`);
}

function validateProduct(body, isUpdate = false) {
  const errors = [];

  if (!isUpdate) {
    if (!body.name?.trim() || body.name.trim().length < 2) {
      errors.push("Product name is required and must be at least 2 characters.");
    }
  }

  if (isUpdate && body.name !== undefined && body.name.trim().length < 2) {
    errors.push("Product name must be at least 2 characters.");
  }

  if (body.name && body.name.length > 200) {
    errors.push("Product name must not exceed 200 characters.");
  }

  if (body.sku && !SKU_REGEX.test(body.sku)) {
    errors.push("SKU must be 1–50 alphanumeric characters (hyphens and underscores allowed).");
  }

  if (body.barcode && !BARCODE_REGEX.test(body.barcode)) {
    errors.push("Barcode must be 4–50 alphanumeric characters.");
  }

  if (body.hsnCode && !HSN_REGEX.test(body.hsnCode)) {
    errors.push("HSN code must be 4–8 digits.");
  }

  if (body.unit && !UNIT_TYPES.includes(body.unit)) {
    errors.push(`Unit must be one of: ${UNIT_TYPES.join(", ")}.`);
  }

  validatePrice(body.purchasePrice,    "Purchase price",     errors);
  validatePrice(body.sellingPrice,     "Selling price",      errors);
  validatePrice(body.mrp,             "MRP",                errors);
  validatePrice(body.wholesalePrice,   "Wholesale price",    errors);
  validatePrice(body.openingStock,     "Opening stock",      errors);
  validatePrice(body.lowStockThreshold,"Low stock threshold",errors);

  // MRP should be >= selling price (warn via error for now)
  if (body.mrp !== undefined && body.sellingPrice !== undefined) {
    if (parseFloat(body.mrp) < parseFloat(body.sellingPrice)) {
      errors.push("MRP must be greater than or equal to selling price.");
    }
  }

  return errors;
}

function validateStockAdjustment(body) {
  const errors = [];

  const qty = parseFloat(body.quantity);
  if (!body.quantity || isNaN(qty) || qty <= 0) {
    errors.push("Quantity must be a positive number.");
  }

  if (!body.type || !["add", "subtract"].includes(body.type)) {
    errors.push('Type must be "add" or "subtract".');
  }

  if (body.reason && !STOCK_ADJUSTMENT_REASONS.includes(body.reason)) {
    errors.push(`Reason must be one of: ${STOCK_ADJUSTMENT_REASONS.join(", ")}.`);
  }

  return errors;
}

// ─── Controllers ──────────────────────────────────────────────────────────

// POST /api/products
export async function createProduct(req, res) {
  try {
    const errors = validateProduct(req.body);
    if (errors.length) return fail(res, HTTP.BAD_REQUEST, MSG.VALIDATION_ERROR, errors);

    const product = await productService.createProduct(req.business.id, req.body);
    return created(res, MSG.PRODUCT_CREATED, { product });
  } catch (err) {
    return fail(res, err.statusCode ?? HTTP.INTERNAL, err.message);
  }
}

// GET /api/products
// ?search=      ?categoryId=    ?taxRateId=
// ?lowStock=true  ?outOfStock=true
// ?barcode=<exact>  (POS scanner lookup)
// ?page=  ?limit=  ?sortBy=name|sellingPrice|currentStock|createdAt  ?order=asc|desc
export async function listProducts(req, res) {
  try {
    const result = await productService.listProducts(req.business.id, req.query);
    return ok(res, MSG.PRODUCTS_FETCHED, result);
  } catch (err) {
    return fail(res, err.statusCode ?? HTTP.INTERNAL, err.message);
  }
}

// GET /api/products/stock-summary
export async function getStockSummary(req, res) {
  try {
    const summary = await productService.getStockSummary(req.business.id);
    return ok(res, MSG.STOCK_FETCHED, { summary });
  } catch (err) {
    return fail(res, err.statusCode ?? HTTP.INTERNAL, err.message);
  }
}

// GET /api/products/low-stock
export async function getLowStockProducts(req, res) {
  try {
    const items = await productService.getLowStockProducts(req.business.id);
    return ok(res, MSG.PRODUCTS_FETCHED, { products: items, total: items.length });
  } catch (err) {
    return fail(res, err.statusCode ?? HTTP.INTERNAL, err.message);
  }
}

// GET /api/products/barcode/:barcode
export async function getProductByBarcode(req, res) {
  try {
    const product = await productService.getProductByBarcode(
      req.params.barcode,
      req.business.id
    );
    return ok(res, MSG.PRODUCT_FETCHED, { product });
  } catch (err) {
    return fail(res, err.statusCode ?? HTTP.INTERNAL, err.message);
  }
}

// GET /api/products/:productId
export async function getProduct(req, res) {
  try {
    const product = await productService.getProductById(
      req.params.productId,
      req.business.id
    );
    return ok(res, MSG.PRODUCT_FETCHED, { product });
  } catch (err) {
    return fail(res, err.statusCode ?? HTTP.INTERNAL, err.message);
  }
}

// PATCH /api/products/:productId
export async function updateProduct(req, res) {
  try {
    const errors = validateProduct(req.body, true);
    if (errors.length) return fail(res, HTTP.BAD_REQUEST, MSG.VALIDATION_ERROR, errors);

    const product = await productService.updateProduct(
      req.params.productId,
      req.business.id,
      req.body
    );
    return ok(res, MSG.PRODUCT_UPDATED, { product });
  } catch (err) {
    return fail(res, err.statusCode ?? HTTP.INTERNAL, err.message);
  }
}

// DELETE /api/products/:productId
export async function deleteProduct(req, res) {
  try {
    await productService.deleteProduct(req.params.productId, req.business.id);
    return noData(res, MSG.PRODUCT_DELETED);
  } catch (err) {
    return fail(res, err.statusCode ?? HTTP.INTERNAL, err.message);
  }
}

// POST /api/products/:productId/adjust-stock
export async function adjustStock(req, res) {
  try {
    const errors = validateStockAdjustment(req.body);
    if (errors.length) return fail(res, HTTP.BAD_REQUEST, MSG.VALIDATION_ERROR, errors);

    const result = await productService.adjustStock(
      req.params.productId,
      req.business.id,
      req.body
    );
    return ok(res, MSG.STOCK_ADJUSTED, result);
  } catch (err) {
    return fail(res, err.statusCode ?? HTTP.INTERNAL, err.message);
  }
}