import * as reportService from "./report.service.js";
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

  if (from && isNaN(new Date(from).getTime())) {
    errors.push("Invalid 'from' date.");
  }

  if (to && isNaN(new Date(to).getTime())) {
    errors.push("Invalid 'to' date.");
  }

  if (from && to) {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    if (fromDate > toDate) {
      errors.push("'from' date must be before 'to' date.");
    }
  }

  return errors;
}

// ─── Sales Report ─────────────────────────────────────────────────────────

export async function getSalesReport(req, res) {
  try {
    const errors = validateDateRange(req.query.from, req.query.to);
    if (errors.length > 0) return fail(res, HTTP.BAD_REQUEST, MSG.VALIDATION_ERROR, errors);

    const groupBy = req.query.groupBy || "day";
    if (!["day", "week", "month", "none"].includes(groupBy)) {
      return fail(res, HTTP.BAD_REQUEST, MSG.VALIDATION_ERROR, ["groupBy must be 'day', 'week', 'month', or 'none'."]);
    }

    const result = await reportService.getSalesReport(req.business.id, {
      from: req.query.from,
      to: req.query.to,
      customerId: req.query.customerId,
      groupBy,
    });

    return ok(res, MSG.REPORT_FETCHED, result);
  } catch (err) {
    return fail(res, err.statusCode ?? HTTP.INTERNAL, err.message);
  }
}

// ─── Purchases Report ─────────────────────────────────────────────────────

export async function getPurchasesReport(req, res) {
  try {
    const errors = validateDateRange(req.query.from, req.query.to);
    if (errors.length > 0) return fail(res, HTTP.BAD_REQUEST, MSG.VALIDATION_ERROR, errors);

    const groupBy = req.query.groupBy || "day";
    if (!["day", "week", "month", "none"].includes(groupBy)) {
      return fail(res, HTTP.BAD_REQUEST, MSG.VALIDATION_ERROR, ["groupBy must be 'day', 'week', 'month', or 'none'."]);
    }

    const result = await reportService.getPurchasesReport(req.business.id, {
      from: req.query.from,
      to: req.query.to,
      supplierId: req.query.supplierId,
      groupBy,
    });

    return ok(res, MSG.REPORT_FETCHED, result);
  } catch (err) {
    return fail(res, err.statusCode ?? HTTP.INTERNAL, err.message);
  }
}

// ─── Stock Report ─────────────────────────────────────────────────────────

export async function getStockReport(req, res) {
  try {
    const result = await reportService.getStockReport(req.business.id, {
      categoryId: req.query.categoryId,
      lowStock: req.query.lowStock,
      search: req.query.search,
      sortBy: req.query.sortBy || "name",
    });

    return ok(res, MSG.REPORT_FETCHED, result);
  } catch (err) {
    return fail(res, err.statusCode ?? HTTP.INTERNAL, err.message);
  }
}

// ─── Party Statement ──────────────────────────────────────────────────────

export async function getPartyStatement(req, res) {
  try {
    const errors = validateDateRange(req.query.from, req.query.to);
    if (errors.length > 0) return fail(res, HTTP.BAD_REQUEST, MSG.VALIDATION_ERROR, errors);

    const result = await reportService.getPartyStatement(req.params.partyId, req.business.id, {
      from: req.query.from,
      to: req.query.to,
    });

    return ok(res, MSG.REPORT_FETCHED, result);
  } catch (err) {
    return fail(res, err.statusCode ?? HTTP.INTERNAL, err.message);
  }
}

// ─── Monthly Analysis ─────────────────────────────────────────────────────

export async function getMonthlyAnalysis(req, res) {
  try {
    const year = req.query.year;
    if (year && (isNaN(parseInt(year)) || parseInt(year) < 1900 || parseInt(year) > 2100)) {
      return fail(res, HTTP.BAD_REQUEST, MSG.VALIDATION_ERROR, ["Year must be between 1900 and 2100."]);
    }

    const result = await reportService.getMonthlyAnalysis(req.business.id, {
      year,
    });

    return ok(res, MSG.REPORT_FETCHED, result);
  } catch (err) {
    return fail(res, err.statusCode ?? HTTP.INTERNAL, err.message);
  }
}

// ─── Top Customers ───────────────────────────────────────────────────────

export async function getTopCustomers(req, res) {
  try {
    const errors = validateDateRange(req.query.from, req.query.to);
    if (errors.length > 0) return fail(res, HTTP.BAD_REQUEST, MSG.VALIDATION_ERROR, errors);

    const result = await reportService.getTopCustomers(req.business.id, {
      from: req.query.from,
      to: req.query.to,
      limit: req.query.limit,
    });

    return ok(res, MSG.REPORT_FETCHED, result);
  } catch (err) {
    return fail(res, err.statusCode ?? HTTP.INTERNAL, err.message);
  }
}

// ─── Top Suppliers ────────────────────────────────────────────────────────

export async function getTopSuppliers(req, res) {
  try {
    const errors = validateDateRange(req.query.from, req.query.to);
    if (errors.length > 0) return fail(res, HTTP.BAD_REQUEST, MSG.VALIDATION_ERROR, errors);

    const result = await reportService.getTopSuppliers(req.business.id, {
      from: req.query.from,
      to: req.query.to,
      limit: req.query.limit,
    });

    return ok(res, MSG.REPORT_FETCHED, result);
  } catch (err) {
    return fail(res, err.statusCode ?? HTTP.INTERNAL, err.message);
  }
}
