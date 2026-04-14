import * as taxRateService from "./taxRate.service.js";
import { HTTP, MSG, MAX_TAX_RATE, HSN_REGEX, SAC_REGEX } from "../../utils/constants.js";

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
function validateRate(value, fieldName, errors) {
  if (value === undefined) return;
  const num = parseFloat(value);
  if (isNaN(num) || num < 0 || num > MAX_TAX_RATE) {
    errors.push(`${fieldName} must be a number between 0 and ${MAX_TAX_RATE}.`);
  }
}

function validateTaxRate(body, isUpdate = false) {
  const errors = [];

  if (!isUpdate) {
    if (!body.taxName?.trim() || body.taxName.trim().length < 2) {
      errors.push("Tax name is required and must be at least 2 characters.");
    }
  }

  if (isUpdate && body.taxName !== undefined && body.taxName.trim().length < 2) {
    errors.push("Tax name must be at least 2 characters.");
  }

  if (body.taxName && body.taxName.trim().length > 50) {
    errors.push("Tax name must not exceed 50 characters.");
  }

  if (body.hsnCode && !HSN_REGEX.test(body.hsnCode)) {
    errors.push("HSN code must be 4–8 digits.");
  }

  if (body.sacCode && !SAC_REGEX.test(body.sacCode)) {
    errors.push("SAC code must be exactly 6 digits.");
  }

  validateRate(body.cgstRate, "CGST rate", errors);
  validateRate(body.sgstRate, "SGST rate", errors);
  validateRate(body.igstRate, "IGST rate", errors);
  validateRate(body.cessRate, "CESS rate", errors);

  // CGST and SGST must be equal (they always are in GST law)
  if (body.cgstRate !== undefined && body.sgstRate !== undefined) {
    if (parseFloat(body.cgstRate) !== parseFloat(body.sgstRate)) {
      errors.push("CGST rate and SGST rate must be equal.");
    }
  }

  // IGST should equal CGST + SGST if all three are provided
  if (
    body.cgstRate !== undefined &&
    body.sgstRate !== undefined &&
    body.igstRate !== undefined
  ) {
    const expected = parseFloat(body.cgstRate) + parseFloat(body.sgstRate);
    const actual   = parseFloat(body.igstRate);
    if (Math.abs(expected - actual) > 0.01) {
      errors.push("IGST rate must equal CGST + SGST.");
    }
  }

  return errors;
}

// ─── Controllers ──────────────────────────────────────────────────────────

// POST /api/tax-rates
export async function createTaxRate(req, res) {
  try {
    const errors = validateTaxRate(req.body);
    if (errors.length) return fail(res, HTTP.BAD_REQUEST, MSG.VALIDATION_ERROR, errors);

    const taxRate = await taxRateService.createTaxRate(req.business.id, req.body);
    return created(res, MSG.TAX_RATE_CREATED, { taxRate });
  } catch (err) {
    return fail(res, err.statusCode ?? HTTP.INTERNAL, err.message);
  }
}

// GET /api/tax-rates
// ?search=<name>  ?hsnCode=<code>
export async function listTaxRates(req, res) {
  try {
    const data = await taxRateService.listTaxRates(req.business.id, req.query);
    return ok(res, MSG.TAX_RATES_FETCHED, { taxRates: data });
  } catch (err) {
    return fail(res, err.statusCode ?? HTTP.INTERNAL, err.message);
  }
}

// GET /api/tax-rates/:taxRateId
export async function getTaxRate(req, res) {
  try {
    const taxRate = await taxRateService.getTaxRateById(
      req.params.taxRateId,
      req.business.id
    );
    return ok(res, MSG.TAX_RATE_FETCHED, { taxRate });
  } catch (err) {
    return fail(res, err.statusCode ?? HTTP.INTERNAL, err.message);
  }
}

// PATCH /api/tax-rates/:taxRateId
export async function updateTaxRate(req, res) {
  try {
    const errors = validateTaxRate(req.body, true);
    if (errors.length) return fail(res, HTTP.BAD_REQUEST, MSG.VALIDATION_ERROR, errors);

    const taxRate = await taxRateService.updateTaxRate(
      req.params.taxRateId,
      req.business.id,
      req.body
    );
    return ok(res, MSG.TAX_RATE_UPDATED, { taxRate });
  } catch (err) {
    return fail(res, err.statusCode ?? HTTP.INTERNAL, err.message);
  }
}

// DELETE /api/tax-rates/:taxRateId
export async function deleteTaxRate(req, res) {
  try {
    await taxRateService.deleteTaxRate(req.params.taxRateId, req.business.id);
    return noData(res, MSG.TAX_RATE_DELETED);
  } catch (err) {
    return fail(res, err.statusCode ?? HTTP.INTERNAL, err.message);
  }
}

// POST /api/tax-rates/seed
// Seeds the standard GST slabs (0%, 3%, 5%, 7.5%, 12%, 18%, 28%)
export async function seedTaxRates(req, res) {
  try {
    await taxRateService.seedDefaultTaxRates(req.business.id);
    return ok(res, "Default GST slabs seeded successfully.", null);
  } catch (err) {
    return fail(res, err.statusCode ?? HTTP.INTERNAL, err.message);
  }
}