import * as businessService from "./business.service.js";
import { HTTP, MSG } from "../../utils/constants.js";
import { GSTIN_REGEX, PAN_REGEX, PINCODE_REGEX, BUSINESS_TYPES, CURRENCIES } from "../../utils/constants.js";

// ─── Helpers ───────────────────────────────────────────────────────────────
function sendSuccess(res, statusCode, message, data = null) {
  const payload = { success: true, message };
  if (data !== null) payload.data = data;
  return res.status(statusCode).json(payload);
}

function sendError(res, statusCode, message, errors = null) {
  const payload = { success: false, message };
  if (errors) payload.errors = errors;
  return res.status(statusCode).json(payload);
}

// ─── Validation ───────────────────────────────────────────────────────────
function validateCreatePayload(body) {
  const errors = [];

  if (!body.name || typeof body.name !== "string" || body.name.trim().length < 2) {
    errors.push("Business name must be at least 2 characters.");
  }

  if (body.businessType && !BUSINESS_TYPES.includes(body.businessType)) {
    errors.push(`Business type must be one of: ${BUSINESS_TYPES.join(", ")}.`);
  }

  if (body.gstin && !GSTIN_REGEX.test(body.gstin)) {
    errors.push("Invalid GSTIN format.");
  }

  if (body.pan && !PAN_REGEX.test(body.pan)) {
    errors.push("Invalid PAN format.");
  }

  if (body.pincode && !PINCODE_REGEX.test(body.pincode)) {
    errors.push("Invalid pincode format.");
  }

  if (body.currency && !CURRENCIES.includes(body.currency)) {
    errors.push(`Currency must be one of: ${CURRENCIES.join(", ")}.`);
  }

  if (body.invoicePrefix && !/^[A-Z0-9-]{1,10}$/.test(body.invoicePrefix)) {
    errors.push("Invoice prefix must be 1–10 alphanumeric characters.");
  }

  return errors;
}

// ─── Controllers ───────────────────────────────────────────────────────────

// POST /api/business
export async function createBusiness(req, res) {
  try {
    const errors = validateCreatePayload(req.body);
    if (errors.length > 0) {
      return sendError(res, HTTP.BAD_REQUEST, MSG.VALIDATION_ERROR, errors);
    }

    const business = await businessService.createBusiness(req.user.id, req.body);
    return sendSuccess(res, HTTP.CREATED, MSG.BUSINESS_CREATED, { business });
  } catch (err) {
    return sendError(res, err.statusCode ?? HTTP.INTERNAL, err.message);
  }
}

// GET /api/business
export async function getMyBusiness(req, res) {
  try {
    const business = await businessService.getBusinessByOwner(req.user.id);

    if (!business) {
      return sendError(res, HTTP.NOT_FOUND, MSG.BUSINESS_NOT_FOUND);
    }

    return sendSuccess(res, HTTP.OK, MSG.BUSINESS_FETCHED, { business });
  } catch (err) {
    return sendError(res, err.statusCode ?? HTTP.INTERNAL, err.message);
  }
}

// GET /api/business/:businessId
export async function getBusinessById(req, res) {
  try {
    const business = await businessService.getBusinessById(
      req.params.businessId,
      req.user.id
    );
    return sendSuccess(res, HTTP.OK, MSG.BUSINESS_FETCHED, { business });
  } catch (err) {
    return sendError(res, err.statusCode ?? HTTP.INTERNAL, err.message);
  }
}

// PATCH /api/business/:businessId
export async function updateBusiness(req, res) {
  try {
    const errors = validateCreatePayload({ name: req.body.name ?? "xx", ...req.body });
    // For updates, name validation is only needed if name is provided
    const updateErrors = req.body.name !== undefined
      ? validateCreatePayload(req.body)
      : validateCreatePayload({ name: "placeholder", ...req.body });

    const filteredErrors = updateErrors.filter(
      (e) => req.body.name !== undefined || !e.includes("Business name")
    );

    if (filteredErrors.length > 0) {
      return sendError(res, HTTP.BAD_REQUEST, MSG.VALIDATION_ERROR, filteredErrors);
    }

    const updated = await businessService.updateBusiness(
      req.params.businessId,
      req.user.id,
      req.body
    );

    return sendSuccess(res, HTTP.OK, MSG.BUSINESS_UPDATED, { business: updated });
  } catch (err) {
    return sendError(res, err.statusCode ?? HTTP.INTERNAL, err.message);
  }
}