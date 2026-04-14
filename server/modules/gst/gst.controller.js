import * as gstService from "./gst.service.js";
import { HTTP, MSG } from "../../utils/constants.js";

// ─── Response Helpers ──────────────────────────────────────────────────────
const ok   = (res, msg, data) => res.status(HTTP.OK).json({ success: true, message: msg, data });
const fail = (res, code, msg, errors) => {
  const body = { success: false, message: msg };
  if (errors?.length) body.errors = errors;
  return res.status(code).json(body);
};

// ─── Validation ───────────────────────────────────────────────────────────
function validateDateRange(from, to) {
  const errors = [];

  if (!from || !to) {
    errors.push("Both 'from' and 'to' dates are required.");
    return errors;
  }

  if (isNaN(new Date(from).getTime())) {
    errors.push("Invalid 'from' date.");
  }

  if (isNaN(new Date(to).getTime())) {
    errors.push("Invalid 'to' date.");
  }

  if (errors.length === 0) {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    if (fromDate > toDate) {
      errors.push("'from' date must be before 'to' date.");
    }
  }

  return errors;
}

// ─── GST Summary ───────────────────────────────────────────────────────────

export async function getGstSummary(req, res) {
  try {
    const errors = validateDateRange(req.query.from, req.query.to);
    if (errors.length > 0) return fail(res, HTTP.BAD_REQUEST, MSG.VALIDATION_ERROR, errors);

    const result = await gstService.getGstSummary(req.business.id, {
      from: req.query.from,
      to: req.query.to,
    });

    return ok(res, MSG.GST_SUMMARY_FETCHED, result);
  } catch (err) {
    return fail(res, err.statusCode ?? HTTP.INTERNAL, err.message);
  }
}

// ─── HSN Summary ───────────────────────────────────────────────────────────

export async function getHsnSummary(req, res) {
  try {
    const errors = validateDateRange(req.query.from, req.query.to);
    if (errors.length > 0) return fail(res, HTTP.BAD_REQUEST, MSG.VALIDATION_ERROR, errors);

    const type = req.query.type || "both";
    if (!["sales", "purchases", "both"].includes(type)) {
      return fail(res, HTTP.BAD_REQUEST, MSG.VALIDATION_ERROR, ["Type must be 'sales', 'purchases', or 'both'."]);
    }

    const result = await gstService.getHsnSummary(req.business.id, {
      from: req.query.from,
      to: req.query.to,
      type,
    });

    return ok(res, MSG.HSN_SUMMARY_FETCHED, result);
  } catch (err) {
    return fail(res, err.statusCode ?? HTTP.INTERNAL, err.message);
  }
}

// ─── GSTR-1 ─────────────────────────────────────────────────────────────

export async function getGstr1(req, res) {
  try {
    const errors = validateDateRange(req.query.from, req.query.to);
    if (errors.length > 0) return fail(res, HTTP.BAD_REQUEST, MSG.VALIDATION_ERROR, errors);

    const result = await gstService.getGstr1(req.business.id, {
      from: req.query.from,
      to: req.query.to,
    });

    return ok(res, MSG.GSTR1_FETCHED, result);
  } catch (err) {
    return fail(res, err.statusCode ?? HTTP.INTERNAL, err.message);
  }
}

// ─── GSTR-3B ────────────────────────────────────────────────────────────

export async function getGstr3b(req, res) {
  try {
    const errors = validateDateRange(req.query.from, req.query.to);
    if (errors.length > 0) return fail(res, HTTP.BAD_REQUEST, MSG.VALIDATION_ERROR, errors);

    const result = await gstService.getGstr3b(req.business.id, {
      from: req.query.from,
      to: req.query.to,
    });

    return ok(res, MSG.GSTR3B_FETCHED, result);
  } catch (err) {
    return fail(res, err.statusCode ?? HTTP.INTERNAL, err.message);
  }
}
