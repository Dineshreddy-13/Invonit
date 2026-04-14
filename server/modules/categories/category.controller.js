import * as categoryService from "./category.service.js";
import { HTTP, MSG } from "../../utils/constants.js";

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
function validateCategory(body, isUpdate = false) {
  const errors = [];

  if (!isUpdate && (!body.name?.trim() || body.name.trim().length < 2)) {
    errors.push("Category name is required and must be at least 2 characters.");
  }

  if (isUpdate && body.name !== undefined && body.name.trim().length < 2) {
    errors.push("Category name must be at least 2 characters.");
  }

  if (body.name && body.name.trim().length > 100) {
    errors.push("Category name must not exceed 100 characters.");
  }

  if (body.parentId !== undefined && body.parentId !== null) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(body.parentId)) {
      errors.push("parentId must be a valid UUID.");
    }
  }

  return errors;
}

// ─── Controllers ──────────────────────────────────────────────────────────

// POST /api/categories
export async function createCategory(req, res) {
  try {
    const errors = validateCategory(req.body);
    if (errors.length) return fail(res, HTTP.BAD_REQUEST, MSG.VALIDATION_ERROR, errors);

    const category = await categoryService.createCategory(req.business.id, req.body);
    return created(res, MSG.CATEGORY_CREATED, { category });
  } catch (err) {
    return fail(res, err.statusCode ?? HTTP.INTERNAL, err.message);
  }
}

// GET /api/categories
// ?parentId=<uuid>  → children of that parent
// ?flat=true        → all categories flat (for dropdowns)
// ?search=<term>    → search by name
export async function listCategories(req, res) {
  try {
    const data = await categoryService.listCategories(req.business.id, req.query);
    return ok(res, MSG.CATEGORIES_FETCHED, { categories: data });
  } catch (err) {
    return fail(res, err.statusCode ?? HTTP.INTERNAL, err.message);
  }
}

// GET /api/categories/:categoryId
export async function getCategory(req, res) {
  try {
    const category = await categoryService.getCategoryById(
      req.params.categoryId,
      req.business.id
    );
    return ok(res, MSG.CATEGORY_FETCHED, { category });
  } catch (err) {
    return fail(res, err.statusCode ?? HTTP.INTERNAL, err.message);
  }
}

// PATCH /api/categories/:categoryId
export async function updateCategory(req, res) {
  try {
    const errors = validateCategory(req.body, true);
    if (errors.length) return fail(res, HTTP.BAD_REQUEST, MSG.VALIDATION_ERROR, errors);

    const category = await categoryService.updateCategory(
      req.params.categoryId,
      req.business.id,
      req.body
    );
    return ok(res, MSG.CATEGORY_UPDATED, { category });
  } catch (err) {
    return fail(res, err.statusCode ?? HTTP.INTERNAL, err.message);
  }
}

// DELETE /api/categories/:categoryId
export async function deleteCategory(req, res) {
  try {
    await categoryService.deleteCategory(req.params.categoryId, req.business.id);
    return noData(res, MSG.CATEGORY_DELETED);
  } catch (err) {
    return fail(res, err.statusCode ?? HTTP.INTERNAL, err.message);
  }
}