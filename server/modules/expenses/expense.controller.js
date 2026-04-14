import * as expenseService from "./expense.service.js";
import { HTTP, MSG, PAYMENT_MODES } from "../../utils/constants.js";

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
function validateExpenseCategory(body, isUpdate = false) {
  const errors = [];

  if (!isUpdate && (!body.name?.trim() || body.name.trim().length < 2)) {
    errors.push("Category name is required and must be at least 2 characters.");
  }

  if (isUpdate && body.name !== undefined && body.name.trim().length < 2) {
    errors.push("Category name must be at least 2 characters.");
  }

  if (body.name && body.name.length > 100) {
    errors.push("Category name must not exceed 100 characters.");
  }

  if (body.description && body.description.length > 500) {
    errors.push("Description must not exceed 500 characters.");
  }

  return errors;
}

function validateExpense(body, isUpdate = false) {
  const errors = [];

  if (!isUpdate && !body.title?.trim()) {
    errors.push("Title is required.");
  }

  if (body.title && body.title.trim().length > 200) {
    errors.push("Title must not exceed 200 characters.");
  }

  if (!isUpdate && (body.amount === undefined || body.amount === "")) {
    errors.push("Amount is required.");
  }

  if (body.amount !== undefined) {
    const amt = parseFloat(body.amount);
    if (isNaN(amt) || amt <= 0) {
      errors.push("Amount must be a positive number.");
    }
  }

  if (body.gstAmount !== undefined) {
    const gst = parseFloat(body.gstAmount);
    if (isNaN(gst) || gst < 0) {
      errors.push("GST amount must be a non-negative number.");
    }
  }

  if (body.paymentMode && !PAYMENT_MODES.includes(body.paymentMode)) {
    errors.push(`Payment mode must be one of: ${PAYMENT_MODES.join(", ")}.`);
  }

  if (body.expenseDate && isNaN(new Date(body.expenseDate).getTime())) {
    errors.push("Invalid expense date.");
  }

  if (body.notes && body.notes.length > 1000) {
    errors.push("Notes must not exceed 1000 characters.");
  }

  return errors;
}

// ─── Expense Categories Controllers ────────────────────────────────────────

export async function createExpenseCategory(req, res) {
  try {
    const errors = validateExpenseCategory(req.body);
    if (errors.length > 0) return fail(res, HTTP.BAD_REQUEST, MSG.VALIDATION_ERROR, errors);

    const category = await expenseService.createExpenseCategory(req.business.id, {
      name: req.body.name,
      description: req.body.description,
    });

    return created(res, MSG.EXPENSE_CATEGORY_CREATED, category);
  } catch (err) {
    return fail(res, err.statusCode ?? HTTP.INTERNAL, err.message);
  }
}

export async function listExpenseCategories(req, res) {
  try {
    const result = await expenseService.listExpenseCategories(req.business.id, {
      search: req.query.search,
      page: req.query.page,
      limit: req.query.limit,
    });

    return ok(res, MSG.EXPENSE_CATEGORIES_FETCHED, result);
  } catch (err) {
    return fail(res, err.statusCode ?? HTTP.INTERNAL, err.message);
  }
}

export async function updateExpenseCategory(req, res) {
  try {
    const errors = validateExpenseCategory(req.body, true);
    if (errors.length > 0) return fail(res, HTTP.BAD_REQUEST, MSG.VALIDATION_ERROR, errors);

    const category = await expenseService.updateExpenseCategory(req.params.categoryId, req.business.id, {
      name: req.body.name,
      description: req.body.description,
    });

    return ok(res, MSG.EXPENSE_CATEGORY_UPDATED, category);
  } catch (err) {
    return fail(res, err.statusCode ?? HTTP.INTERNAL, err.message);
  }
}

export async function deleteExpenseCategory(req, res) {
  try {
    await expenseService.deleteExpenseCategory(req.params.categoryId, req.business.id);
    return noData(res, MSG.EXPENSE_CATEGORY_DELETED);
  } catch (err) {
    return fail(res, err.statusCode ?? HTTP.INTERNAL, err.message);
  }
}

// ─── Expenses Controllers ───────────────────────────────────────────────────

export async function createExpense(req, res) {
  try {
    const errors = validateExpense(req.body);
    if (errors.length > 0) return fail(res, HTTP.BAD_REQUEST, MSG.VALIDATION_ERROR, errors);

    const expense = await expenseService.createExpense(req.business.id, {
      title: req.body.title,
      amount: req.body.amount,
      categoryId: req.body.categoryId,
      gstAmount: req.body.gstAmount || "0",
      paymentMode: req.body.paymentMode,
      expenseDate: req.body.expenseDate,
      receiptUrl: req.body.receiptUrl,
      notes: req.body.notes,
    });

    return created(res, MSG.EXPENSE_CREATED, expense);
  } catch (err) {
    return fail(res, err.statusCode ?? HTTP.INTERNAL, err.message);
  }
}

export async function listExpenses(req, res) {
  try {
    const result = await expenseService.listExpenses(req.business.id, {
      categoryId: req.query.categoryId,
      paymentMode: req.query.paymentMode,
      from: req.query.from,
      to: req.query.to,
      search: req.query.search,
      page: req.query.page,
      limit: req.query.limit,
    });

    return ok(res, MSG.EXPENSES_FETCHED, result);
  } catch (err) {
    return fail(res, err.statusCode ?? HTTP.INTERNAL, err.message);
  }
}

export async function getExpense(req, res) {
  try {
    const expense = await expenseService.getExpense(req.params.expenseId, req.business.id);

    if (!expense) {
      return fail(res, HTTP.NOT_FOUND, MSG.EXPENSE_NOT_FOUND);
    }

    return ok(res, MSG.EXPENSE_FETCHED, expense);
  } catch (err) {
    return fail(res, err.statusCode ?? HTTP.INTERNAL, err.message);
  }
}

export async function updateExpense(req, res) {
  try {
    const errors = validateExpense(req.body, true);
    if (errors.length > 0) return fail(res, HTTP.BAD_REQUEST, MSG.VALIDATION_ERROR, errors);

    const expense = await expenseService.updateExpense(req.params.expenseId, req.business.id, {
      title: req.body.title,
      amount: req.body.amount,
      categoryId: req.body.categoryId,
      gstAmount: req.body.gstAmount,
      paymentMode: req.body.paymentMode,
      expenseDate: req.body.expenseDate,
      receiptUrl: req.body.receiptUrl,
      notes: req.body.notes,
    });

    return ok(res, MSG.EXPENSE_UPDATED, expense);
  } catch (err) {
    return fail(res, err.statusCode ?? HTTP.INTERNAL, err.message);
  }
}

export async function deleteExpense(req, res) {
  try {
    await expenseService.deleteExpense(req.params.expenseId, req.business.id);
    return noData(res, MSG.EXPENSE_DELETED);
  } catch (err) {
    return fail(res, err.statusCode ?? HTTP.INTERNAL, err.message);
  }
}

export async function getExpenseSummary(req, res) {
  try {
    const summary = await expenseService.getExpenseSummary(req.business.id, {
      from: req.query.from,
      to: req.query.to,
    });

    return ok(res, MSG.EXPENSE_FETCHED, summary);
  } catch (err) {
    return fail(res, err.statusCode ?? HTTP.INTERNAL, err.message);
  }
}
