import * as accountingService from "./accounting.service.js";
import { HTTP, MSG } from "../../utils/constants.js";

// ─── Response Helpers ──────────────────────────────────────────────────────
const ok      = (res, msg, data) => res.status(HTTP.OK).json({ success: true, message: msg, data });
const fail    = (res, code, msg, errors) => {
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

// ─── Ledger ───────────────────────────────────────────────────────────────

export async function getLedger(req, res) {
  try {
    const errors = validateDateRange(req.query.from, req.query.to);
    if (errors.length > 0) return fail(res, HTTP.BAD_REQUEST, MSG.VALIDATION_ERROR, errors);

    const result = await accountingService.getLedger(req.business.id, {
      partyId: req.query.partyId,
      entryType: req.query.entryType,
      from: req.query.from,
      to: req.query.to,
      page: req.query.page,
      limit: req.query.limit,
    });

    return ok(res, MSG.LEDGER_FETCHED, result);
  } catch (err) {
    return fail(res, err.statusCode ?? HTTP.INTERNAL, err.message);
  }
}

export async function getDaybook(req, res) {
  try {
    const errors = validateDateRange(req.query.from, req.query.to);
    if (errors.length > 0) return fail(res, HTTP.BAD_REQUEST, MSG.VALIDATION_ERROR, errors);

    if (req.query.date && isNaN(new Date(req.query.date).getTime())) {
      return fail(res, HTTP.BAD_REQUEST, MSG.VALIDATION_ERROR, ["Invalid date."]);
    }

    const result = await accountingService.getDaybook(req.business.id, {
      date: req.query.date,
      from: req.query.from,
      to: req.query.to,
    });

    return ok(res, MSG.DAYBOOK_FETCHED, result);
  } catch (err) {
    return fail(res, err.statusCode ?? HTTP.INTERNAL, err.message);
  }
}

// ─── Party Ledger ────────────────────────────────────────────────────────

export async function getPartyLedger(req, res) {
  try {
    const errors = validateDateRange(req.query.from, req.query.to);
    if (errors.length > 0) return fail(res, HTTP.BAD_REQUEST, MSG.VALIDATION_ERROR, errors);

    const result = await accountingService.getPartyLedger(req.params.partyId, req.business.id, {
      from: req.query.from,
      to: req.query.to,
    });

    return ok(res, MSG.PARTY_LEDGER_FETCHED, result);
  } catch (err) {
    return fail(res, err.statusCode ?? HTTP.INTERNAL, err.message);
  }
}

// ─── Outstanding ────────────────────────────────────────────────────────

export async function getOutstanding(req, res) {
  try {
    const partyType = req.query.partyType;
    if (partyType && !["customer", "supplier", "both"].includes(partyType)) {
      return fail(res, HTTP.BAD_REQUEST, MSG.VALIDATION_ERROR, ["Party type must be 'customer', 'supplier', or 'both'."]);
    }

    const result = await accountingService.getOutstandingParties(req.business.id, {
      partyType,
    });

    return ok(res, MSG.PARTY_OUTSTANDING_FETCHED, result);
  } catch (err) {
    return fail(res, err.statusCode ?? HTTP.INTERNAL, err.message);
  }
}

// ─── Trial Balance ───────────────────────────────────────────────────────

export async function getTrialBalance(req, res) {
  try {
    if (req.query.asOf && isNaN(new Date(req.query.asOf).getTime())) {
      return fail(res, HTTP.BAD_REQUEST, MSG.VALIDATION_ERROR, ["Invalid 'asOf' date."]);
    }

    const result = await accountingService.getTrialBalance(req.business.id, {
      asOf: req.query.asOf,
    });

    return ok(res, MSG.TRIAL_BALANCE_FETCHED, result);
  } catch (err) {
    return fail(res, err.statusCode ?? HTTP.INTERNAL, err.message);
  }
}

// ─── Profit & Loss ───────────────────────────────────────────────────────

export async function getProfitLoss(req, res) {
  try {
    const errors = validateDateRange(req.query.from, req.query.to);
    if (errors.length > 0) return fail(res, HTTP.BAD_REQUEST, MSG.VALIDATION_ERROR, errors);

    const result = await accountingService.getProfitLoss(req.business.id, {
      from: req.query.from,
      to: req.query.to,
    });

    return ok(res, MSG.PROFIT_LOSS_FETCHED, result);
  } catch (err) {
    return fail(res, err.statusCode ?? HTTP.INTERNAL, err.message);
  }
}

// ─── Balance Sheet ───────────────────────────────────────────────────────

export async function getBalanceSheet(req, res) {
  try {
    if (req.query.asOf && isNaN(new Date(req.query.asOf).getTime())) {
      return fail(res, HTTP.BAD_REQUEST, MSG.VALIDATION_ERROR, ["Invalid 'asOf' date."]);
    }

    const result = await accountingService.getBalanceSheet(req.business.id, {
      asOf: req.query.asOf,
    });

    return ok(res, MSG.BALANCE_SHEET_FETCHED, result);
  } catch (err) {
    return fail(res, err.statusCode ?? HTTP.INTERNAL, err.message);
  }
}

// ─── Cash Flow ───────────────────────────────────────────────────────────

export async function getCashFlow(req, res) {
  try {
    const errors = validateDateRange(req.query.from, req.query.to);
    if (errors.length > 0) return fail(res, HTTP.BAD_REQUEST, MSG.VALIDATION_ERROR, errors);

    const result = await accountingService.getCashFlow(req.business.id, {
      from: req.query.from,
      to: req.query.to,
    });

    return ok(res, MSG.CASH_FLOW_FETCHED, result);
  } catch (err) {
    return fail(res, err.statusCode ?? HTTP.INTERNAL, err.message);
  }
}
