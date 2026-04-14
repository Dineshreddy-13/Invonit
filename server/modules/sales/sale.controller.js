import * as saleService from "./sale.service.js";
import {
  HTTP, MSG,
  SALE_TYPES, SALE_STATUSES, PAYMENT_MODES,
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
function validateItem(item, index) {
  const errors = [];
  const label  = `Item[${index}]`;

  if (!item.productName?.trim() && !item.productId) {
    errors.push(`${label}: productName or productId is required.`);
  }

  const qty = parseFloat(item.quantity);
  if (!item.quantity || isNaN(qty) || qty <= 0) {
    errors.push(`${label}: quantity must be a positive number.`);
  }

  if (item.sellingPrice !== undefined) {
    const p = parseFloat(item.sellingPrice);
    if (isNaN(p) || p < 0) {
      errors.push(`${label}: sellingPrice must be a non-negative number.`);
    }
  }

  if (item.discountPercent !== undefined) {
    const d = parseFloat(item.discountPercent);
    if (isNaN(d) || d < 0 || d > 100) {
      errors.push(`${label}: discountPercent must be between 0 and 100.`);
    }
  }

  return errors;
}

function validateSale(body) {
  const errors = [];

  if (!Array.isArray(body.items) || body.items.length === 0) {
    errors.push("Sale must have at least one item.");
    return errors;
  }

  body.items.forEach((item, i) => errors.push(...validateItem(item, i)));

  if (body.saleType && !SALE_TYPES.includes(body.saleType)) {
    errors.push(`saleType must be one of: ${SALE_TYPES.join(", ")}.`);
  }

  if (body.paymentMode && !PAYMENT_MODES.includes(body.paymentMode)) {
    errors.push(`paymentMode must be one of: ${PAYMENT_MODES.join(", ")}.`);
  }

  if (body.paidAmount !== undefined) {
    const paid = parseFloat(body.paidAmount);
    if (isNaN(paid) || paid < 0) {
      errors.push("paidAmount must be a non-negative number.");
    }
  }

  if (body.saleDate && isNaN(Date.parse(body.saleDate))) {
    errors.push("saleDate must be a valid date.");
  }

  if (body.dueDate && isNaN(Date.parse(body.dueDate))) {
    errors.push("dueDate must be a valid date.");
  }

  return errors;
}

function validatePayment(body) {
  const errors = [];
  const amount = parseFloat(body.amount);
  if (!body.amount || isNaN(amount) || amount <= 0) {
    errors.push("Payment amount must be a positive number.");
  }
  if (body.paymentMode && !PAYMENT_MODES.includes(body.paymentMode)) {
    errors.push(`paymentMode must be one of: ${PAYMENT_MODES.join(", ")}.`);
  }
  return errors;
}

// ─── Controllers ──────────────────────────────────────────────────────────

// POST /api/sales
export async function createSale(req, res) {
  try {
    const errors = validateSale(req.body);
    if (errors.length) return fail(res, HTTP.BAD_REQUEST, MSG.VALIDATION_ERROR, errors);

    const sale = await saleService.createSale(req.business.id, req.body);
    return created(res, MSG.SALE_CREATED, { sale });
  } catch (err) {
    // Surface stock errors with detail
    if (err.stockErrors) {
      return res.status(HTTP.CONFLICT).json({
        success:     false,
        message:     err.message,
        stockErrors: err.stockErrors,
      });
    }
    return fail(res, err.statusCode ?? HTTP.INTERNAL, err.message);
  }
}

// GET /api/sales
// ?customerId= ?status= ?saleType= ?search= ?from= ?to= ?page= ?limit= ?sortBy= ?order=
export async function listSales(req, res) {
  try {
    const result = await saleService.listSales(req.business.id, req.query);
    return ok(res, MSG.SALES_FETCHED, result);
  } catch (err) {
    return fail(res, err.statusCode ?? HTTP.INTERNAL, err.message);
  }
}

// GET /api/sales/returns
export async function listSaleReturns(req, res) {
  try {
    const result = await saleService.listSaleReturns(req.business.id, req.query);
    return ok(res, MSG.SALES_FETCHED, result);
  } catch (err) {
    return fail(res, err.statusCode ?? HTTP.INTERNAL, err.message);
  }
}

// GET /api/sales/summary
// ?from= ?to=
export async function getSalesSummary(req, res) {
  try {
    const summary = await saleService.getSalesSummary(req.business.id, req.query);
    return ok(res, MSG.SALES_FETCHED, { summary });
  } catch (err) {
    return fail(res, err.statusCode ?? HTTP.INTERNAL, err.message);
  }
}

// GET /api/sales/top-products
// ?from= ?to= ?limit=
export async function getTopSellingProducts(req, res) {
  try {
    const products = await saleService.getTopSellingProducts(req.business.id, req.query);
    return ok(res, MSG.PRODUCTS_FETCHED, { products });
  } catch (err) {
    return fail(res, err.statusCode ?? HTTP.INTERNAL, err.message);
  }
}

// GET /api/sales/:saleId
export async function getSale(req, res) {
  try {
    const sale = await saleService.getSaleById(req.params.saleId, req.business.id);
    return ok(res, MSG.SALE_FETCHED, { sale });
  } catch (err) {
    return fail(res, err.statusCode ?? HTTP.INTERNAL, err.message);
  }
}

// POST /api/sales/:saleId/payment
export async function recordPayment(req, res) {
  try {
    const errors = validatePayment(req.body);
    if (errors.length) return fail(res, HTTP.BAD_REQUEST, MSG.VALIDATION_ERROR, errors);

    const result = await saleService.recordPayment(
      req.params.saleId,
      req.business.id,
      req.body
    );
    return ok(res, MSG.PAYMENT_RECORDED, result);
  } catch (err) {
    return fail(res, err.statusCode ?? HTTP.INTERNAL, err.message);
  }
}

// POST /api/sales/:saleId/return
export async function createSaleReturn(req, res) {
  try {
    const sale = await saleService.createSaleReturn(
      req.params.saleId,
      req.business.id,
      req.body
    );
    return created(res, MSG.SALE_RETURN_CREATED, { sale });
  } catch (err) {
    return fail(res, err.statusCode ?? HTTP.INTERNAL, err.message);
  }
}

// POST /api/sales/:saleId/cancel
export async function cancelSale(req, res) {
  try {
    await saleService.cancelSale(req.params.saleId, req.business.id);
    return noData(res, MSG.SALE_DELETED);
  } catch (err) {
    return fail(res, err.statusCode ?? HTTP.INTERNAL, err.message);
  }
}

// POST /api/sales/:saleId/convert
export async function convertEstimate(req, res) {
  try {
    const sale = await saleService.convertEstimateToInvoice(
      req.params.saleId,
      req.business.id,
      req.body
    );
    return ok(res, "Estimate converted to invoice successfully.", { sale });
  } catch (err) {
    return fail(res, err.statusCode ?? HTTP.INTERNAL, err.message);
  }
}