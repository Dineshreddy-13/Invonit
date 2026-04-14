import * as partyService from "./party.service.js";
import {
  HTTP, MSG,
  PARTY_TYPES, BALANCE_TYPES,
  GSTIN_REGEX, PAN_REGEX, PINCODE_REGEX, PHONE_REGEX, EMAIL_REGEX,
} from "../../utils/constants.js";

// ─── Response Helpers ──────────────────────────────────────────────────────
const ok      = (res, msg, data)  => res.status(HTTP.OK).json({ success: true, message: msg, data });
const created = (res, msg, data)  => res.status(HTTP.CREATED).json({ success: true, message: msg, data });
const noData  = (res, msg)        => res.status(HTTP.OK).json({ success: true, message: msg });
const fail    = (res, code, msg, errors) => {
  const body = { success: false, message: msg };
  if (errors?.length) body.errors = errors;
  return res.status(code).json(body);
};

// ─── Validation ───────────────────────────────────────────────────────────
function validateParty(body, isUpdate = false) {
  const errors = [];

  if (!isUpdate) {
    if (!body.name?.trim()) {
      errors.push("Party name is required.");
    }
    if (!body.partyType || !PARTY_TYPES.includes(body.partyType)) {
      errors.push(`Party type must be one of: ${PARTY_TYPES.join(", ")}.`);
    }
  }

  if (body.name !== undefined && body.name.trim().length < 2) {
    errors.push("Party name must be at least 2 characters.");
  }

  if (body.partyType !== undefined && !PARTY_TYPES.includes(body.partyType)) {
    errors.push(`Party type must be one of: ${PARTY_TYPES.join(", ")}.`);
  }

  if (body.phone && !PHONE_REGEX.test(body.phone)) {
    errors.push("Invalid phone number. Must be a 10-digit Indian mobile number.");
  }

  if (body.email && !EMAIL_REGEX.test(body.email)) {
    errors.push("Invalid email address.");
  }

  if (body.gstin && !GSTIN_REGEX.test(body.gstin)) {
    errors.push("Invalid GSTIN format.");
  }

  if (body.pan && !PAN_REGEX.test(body.pan)) {
    errors.push("Invalid PAN format.");
  }

  if (body.pincode && !PINCODE_REGEX.test(body.pincode)) {
    errors.push("Invalid pincode. Must be a 6-digit Indian pincode.");
  }

  if (body.openingBalance !== undefined) {
    const val = parseFloat(body.openingBalance);
    if (isNaN(val) || val < 0) {
      errors.push("Opening balance must be a non-negative number.");
    }
  }

  if (body.openingBalanceType && !BALANCE_TYPES.includes(body.openingBalanceType)) {
    errors.push(`Opening balance type must be one of: ${BALANCE_TYPES.join(", ")}.`);
  }

  if (body.creditLimit !== undefined) {
    const val = parseFloat(body.creditLimit);
    if (isNaN(val) || val < 0) {
      errors.push("Credit limit must be a non-negative number.");
    }
  }

  if (body.creditDays !== undefined) {
    const val = parseInt(body.creditDays, 10);
    if (isNaN(val) || val < 0) {
      errors.push("Credit days must be a non-negative integer.");
    }
  }

  return errors;
}

// ─── Controllers ───────────────────────────────────────────────────────────

// POST /api/parties
export async function createParty(req, res) {
  try {
    const errors = validateParty(req.body);
    if (errors.length > 0) return fail(res, HTTP.BAD_REQUEST, MSG.VALIDATION_ERROR, errors);

    const party = await partyService.createParty(req.business.id, req.body);
    return created(res, MSG.PARTY_CREATED, { party });
  } catch (err) {
    return fail(res, err.statusCode ?? HTTP.INTERNAL, err.message);
  }
}

// GET /api/parties
// Query params: type, search, page, limit, sortBy, order
export async function listParties(req, res) {
  try {
    const result = await partyService.listParties(req.business.id, req.query);
    return ok(res, MSG.PARTIES_FETCHED, result);
  } catch (err) {
    return fail(res, err.statusCode ?? HTTP.INTERNAL, err.message);
  }
}

// GET /api/parties/:partyId
export async function getParty(req, res) {
  try {
    const party = await partyService.getPartyById(req.params.partyId, req.business.id);
    return ok(res, MSG.PARTY_FETCHED, { party });
  } catch (err) {
    return fail(res, err.statusCode ?? HTTP.INTERNAL, err.message);
  }
}

// PATCH /api/parties/:partyId
export async function updateParty(req, res) {
  try {
    const errors = validateParty(req.body, true);
    if (errors.length > 0) return fail(res, HTTP.BAD_REQUEST, MSG.VALIDATION_ERROR, errors);

    const party = await partyService.updateParty(req.params.partyId, req.business.id, req.body);
    return ok(res, MSG.PARTY_UPDATED, { party });
  } catch (err) {
    return fail(res, err.statusCode ?? HTTP.INTERNAL, err.message);
  }
}

// DELETE /api/parties/:partyId
export async function deleteParty(req, res) {
  try {
    await partyService.deleteParty(req.params.partyId, req.business.id);
    return noData(res, MSG.PARTY_DELETED);
  } catch (err) {
    return fail(res, err.statusCode ?? HTTP.INTERNAL, err.message);
  }
}

// GET /api/parties/:partyId/outstanding
export async function getPartyOutstanding(req, res) {
  try {
    const data = await partyService.getPartyOutstanding(req.params.partyId, req.business.id);
    return ok(res, MSG.PARTY_FETCHED, data);
  } catch (err) {
    return fail(res, err.statusCode ?? HTTP.INTERNAL, err.message);
  }
}