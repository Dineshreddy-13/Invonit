import * as purchaseService from "./purchase.service.js";
import { HTTP, MSG, PURCHASE_STATUSES, PAYMENT_MODES } from "../../utils/constants.js";

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

  const price = parseFloat(item.purchasePrice);
  if (item.purchasePrice === undefined || isNaN(price) || price < 0) {
    errors.push(`${label}: purchasePrice must be a non-negative number.`);
  }

  if (item.discountPercent !== undefined) {
    const d = parseFloat(item.discountPercent);
    if (isNaN(d) || d < 0 || d > 100) {
      errors.push(`${label}: discountPercent must be between 0 and 100.`);
    }
  }

  return errors;
}

function validatePurchase(body) {
  const errors = [];

  if (!Array.isArray(body.items) || body.items.length === 0) {
    errors.push("Purchase must have at least one item.");
    return errors; // No point validating items if none exist
  }

  body.items.forEach((item, i) => {
    errors.push(...validateItem(item, i));
  });

  if (body.paidAmount !== undefined) {
    const paid = parseFloat(body.paidAmount);
    if (isNaN(paid) || paid < 0) {
      errors.push("paidAmount must be a non-negative number.");
    }
  }

  if (body.paymentMode && !PAYMENT_MODES.includes(body.paymentMode)) {
    errors.push(`paymentMode must be one of: ${PAYMENT_MODES.join(", ")}.`);
  }

  if (body.purchaseDate && isNaN(Date.parse(body.purchaseDate))) {
    errors.push("purchaseDate must be a valid date.");
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

// POST /api/purchases
export async function createPurchase(req, res) {
  try {
    const errors = validatePurchase(req.body);
    if (errors.length) return fail(res, HTTP.BAD_REQUEST, MSG.VALIDATION_ERROR, errors);

    const purchase = await purchaseService.createPurchase(req.business.id, req.body);
    return created(res, MSG.PURCHASE_CREATED, { purchase });
  } catch (err) {
    // Surface duplicate invoice as a special flag so frontend can ask user
    if (err.isDuplicate) {
      return res.status(HTTP.CONFLICT).json({
        success:     false,
        message:     err.message,
        isDuplicate: true,
      });
    }
    return fail(res, err.statusCode ?? HTTP.INTERNAL, err.message);
  }
}

// GET /api/purchases
// ?supplierId=  ?status=  ?source=  ?search=  ?from=  ?to=  ?page=  ?limit=
export async function listPurchases(req, res) {
  try {
    const result = await purchaseService.listPurchases(req.business.id, req.query);
    return ok(res, MSG.PURCHASES_FETCHED, result);
  } catch (err) {
    return fail(res, err.statusCode ?? HTTP.INTERNAL, err.message);
  }
}

// GET /api/purchases/returns
export async function listPurchaseReturns(req, res) {
  try {
    const result = await purchaseService.listPurchaseReturns(req.business.id, req.query);
    return ok(res, MSG.PURCHASES_FETCHED, result);
  } catch (err) {
    return fail(res, err.statusCode ?? HTTP.INTERNAL, err.message);
  }
}

// GET /api/purchases/:purchaseId
export async function getPurchase(req, res) {
  try {
    const purchase = await purchaseService.getPurchaseById(
      req.params.purchaseId,
      req.business.id
    );
    return ok(res, MSG.PURCHASE_FETCHED, { purchase });
  } catch (err) {
    return fail(res, err.statusCode ?? HTTP.INTERNAL, err.message);
  }
}

// POST /api/purchases/:purchaseId/payment
export async function recordPayment(req, res) {
  try {
    const errors = validatePayment(req.body);
    if (errors.length) return fail(res, HTTP.BAD_REQUEST, MSG.VALIDATION_ERROR, errors);

    const result = await purchaseService.recordPayment(
      req.params.purchaseId,
      req.business.id,
      req.body
    );
    return ok(res, MSG.PAYMENT_RECORDED, result);
  } catch (err) {
    return fail(res, err.statusCode ?? HTTP.INTERNAL, err.message);
  }
}

// POST /api/purchases/:purchaseId/return
export async function createPurchaseReturn(req, res) {
  try {
    const purchase = await purchaseService.createPurchaseReturn(
      req.params.purchaseId,
      req.business.id,
      req.body
    );
    return created(res, MSG.PURCHASE_RETURN_CREATED, { purchase });
  } catch (err) {
    return fail(res, err.statusCode ?? HTTP.INTERNAL, err.message);
  }
}

// POST /api/purchases/:purchaseId/cancel
export async function cancelPurchase(req, res) {
  try {
    await purchaseService.cancelPurchase(req.params.purchaseId, req.business.id);
    return noData(res, MSG.PURCHASE_DELETED);
  } catch (err) {
    return fail(res, err.statusCode ?? HTTP.INTERNAL, err.message);
  }
}