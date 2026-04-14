import * as journalService from "./journal.service.js";
import { HTTP, MSG } from "../../utils/constants.js";

// ─── Response Helpers ──────────────────────────────────────────────────────
const ok      = (res, msg, data) => res.status(HTTP.OK).json({ success: true, message: msg, data });
const created = (res, msg, data) => res.status(HTTP.CREATED).json({ success: true, message: msg, data });
const fail    = (res, code, msg, errors) => {
  const body = { success: false, message: msg };
  if (errors?.length) body.errors = errors;
  return res.status(code).json(body);
};

// ─── Validation ───────────────────────────────────────────────────────────
function validateJournalEntry(body) {
  const errors = [];

  if (!body.description?.trim()) {
    errors.push("Description is required.");
  }

  if (body.description && body.description.length > 500) {
    errors.push("Description must not exceed 500 characters.");
  }

  if (body.debitAmount === undefined && body.creditAmount === undefined) {
    errors.push("At least one of debitAmount or creditAmount is required.");
  }

  if (body.debitAmount !== undefined) {
    const deb = parseFloat(body.debitAmount);
    if (isNaN(deb) || deb < 0) {
      errors.push("Debit amount must be a non-negative number.");
    }
  }

  if (body.creditAmount !== undefined) {
    const cred = parseFloat(body.creditAmount);
    if (isNaN(cred) || cred < 0) {
      errors.push("Credit amount must be a non-negative number.");
    }
  }

  if (body.entryDate && isNaN(new Date(body.entryDate).getTime())) {
    errors.push("Invalid entry date.");
  }

  if (body.referenceNumber && body.referenceNumber.length > 50) {
    errors.push("Reference number must not exceed 50 characters.");
  }

  return errors;
}

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

// ─── Create Journal Entry ──────────────────────────────────────────────────

export async function createJournalEntry(req, res) {
  try {
    const errors = validateJournalEntry(req.body);
    if (errors.length > 0) return fail(res, HTTP.BAD_REQUEST, MSG.VALIDATION_ERROR, errors);

    const entry = await journalService.createJournalEntry(req.business.id, {
      partyId: req.body.partyId,
      description: req.body.description,
      debitAmount: req.body.debitAmount,
      creditAmount: req.body.creditAmount,
      entryDate: req.body.entryDate,
      referenceNumber: req.body.referenceNumber,
    });

    return created(res, MSG.JOURNAL_CREATED, entry);
  } catch (err) {
    return fail(res, err.statusCode ?? HTTP.INTERNAL, err.message);
  }
}

// ─── List Journal Entries ──────────────────────────────────────────────────

export async function listJournalEntries(req, res) {
  try {
    const errors = validateDateRange(req.query.from, req.query.to);
    if (errors.length > 0) return fail(res, HTTP.BAD_REQUEST, MSG.VALIDATION_ERROR, errors);

    const result = await journalService.listJournalEntries(req.business.id, {
      from: req.query.from,
      to: req.query.to,
      partyId: req.query.partyId,
      page: req.query.page,
      limit: req.query.limit,
    });

    return ok(res, MSG.JOURNAL_FETCHED, result);
  } catch (err) {
    return fail(res, err.statusCode ?? HTTP.INTERNAL, err.message);
  }
}
