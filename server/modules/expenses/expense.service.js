import { and, eq, ilike, or, desc, lte, gte, sql, isNotNull } from "drizzle-orm";
import { db } from "../../database/db.js";
import { expenseCategories, expenses, ledgerEntries } from "../../database/schemas/index.js";
import { MSG, DEFAULT_PAGE, DEFAULT_LIMIT, MAX_LIMIT } from "../../utils/constants.js";

// ─── Helpers ──────────────────────────────────────────────────────────────
function notFound(type = "Expense") {
  const e = new Error(`${type} not found.`);
  e.statusCode = 404;
  return e;
}

function forbidden(type = "Expense") {
  const e = new Error(`You do not have access to this ${type.toLowerCase()}.`);
  e.statusCode = 403;
  return e;
}

async function verifyOwnershipCategory(categoryId, businessId) {
  const [category] = await db
    .select()
    .from(expenseCategories)
    .where(eq(expenseCategories.id, categoryId))
    .limit(1);

  if (!category) throw notFound("Expense category");
  if (category.businessId !== businessId) throw forbidden("Expense category");
  return category;
}

async function verifyOwnershipExpense(expenseId, businessId) {
  const [expense] = await db
    .select()
    .from(expenses)
    .where(eq(expenses.id, expenseId))
    .limit(1);

  if (!expense) throw notFound("Expense");
  if (expense.businessId !== businessId) throw forbidden("Expense");
  return expense;
}

// ─── Expense Categories ────────────────────────────────────────────────────

export async function createExpenseCategory(businessId, { name, description }) {
  // Check if category with same name exists (case-insensitive)
  const [existing] = await db
    .select()
    .from(expenseCategories)
    .where(
      and(
        eq(expenseCategories.businessId, businessId),
        sql`LOWER(${expenseCategories.name}) = LOWER(${name})`
      )
    )
    .limit(1);

  if (existing) {
    const e = new Error("An expense category with this name already exists.");
    e.statusCode = 409;
    throw e;
  }

  const [created] = await db
    .insert(expenseCategories)
    .values({
      businessId,
      name: name.trim(),
      description: description?.trim() || null,
    })
    .returning();

  return created;
}

export async function listExpenseCategories(businessId, { search = "", page = DEFAULT_PAGE, limit = DEFAULT_LIMIT }) {
  const p = Math.max(1, parseInt(page) || DEFAULT_PAGE);
  const l = Math.min(parseInt(limit) || DEFAULT_LIMIT, MAX_LIMIT);
  const offset = (p - 1) * l;

  const conditions = [
    eq(expenseCategories.businessId, businessId),
    eq(expenseCategories.isActive, true),
  ];

  if (search.trim()) {
    conditions.push(ilike(expenseCategories.name, `%${search.trim()}%`));
  }

  const [{ total }] = await db
    .select({ total: sql`count(*)::int` })
    .from(expenseCategories)
    .where(and(...conditions));

  const data = await db
    .select()
    .from(expenseCategories)
    .where(and(...conditions))
    .orderBy(expenseCategories.createdAt)
    .limit(l)
    .offset(offset);

  return {
    data,
    pagination: {
      page: p,
      limit: l,
      total,
      totalPages: Math.ceil(total / l),
    },
  };
}

export async function updateExpenseCategory(categoryId, businessId, { name, description }) {
  const category = await verifyOwnershipCategory(categoryId, businessId);

  // Check for duplicate name (case-insensitive) excluding current category
  if (name && name.trim() !== category.name) {
    const [dup] = await db
      .select()
      .from(expenseCategories)
      .where(
        and(
          eq(expenseCategories.businessId, businessId),
          sql`LOWER(${expenseCategories.name}) = LOWER(${name})`,
          sql`${expenseCategories.id} != ${categoryId}`
        )
      )
      .limit(1);

    if (dup) {
      const e = new Error("An expense category with this name already exists.");
      e.statusCode = 409;
      throw e;
    }
  }

  const [updated] = await db
    .update(expenseCategories)
    .set({
      name: name?.trim() || category.name,
      description: description !== undefined ? description?.trim() || null : category.description,
      updatedAt: new Date(),
    })
    .where(eq(expenseCategories.id, categoryId))
    .returning();

  return updated;
}

export async function deleteExpenseCategory(categoryId, businessId) {
  const category = await verifyOwnershipCategory(categoryId, businessId);

  // Check if category has any expenses
  const [hasExpenses] = await db
    .select({ count: sql`count(*)::int` })
    .from(expenses)
    .where(eq(expenses.categoryId, categoryId));

  if (hasExpenses.count > 0) {
    const e = new Error("Cannot delete a category that has expenses.");
    e.statusCode = 409;
    throw e;
  }

  const [updated] = await db
    .update(expenseCategories)
    .set({
      isActive: false,
      updatedAt: new Date(),
    })
    .where(eq(expenseCategories.id, categoryId))
    .returning();

  return updated;
}

// ─── Expenses ───────────────────────────────────────────────────────────────

export async function createExpense(businessId, { title, amount, categoryId, gstAmount = "0", paymentMode, expenseDate, receiptUrl, notes }) {
  // Verify categoryId if provided
  if (categoryId) {
    await verifyOwnershipCategory(categoryId, businessId);
  }

  const [created] = await db
    .insert(expenses)
    .values({
      businessId,
      categoryId: categoryId || null,
      title: title.trim(),
      amount: parseFloat(amount).toFixed(2),
      gstAmount: parseFloat(gstAmount).toFixed(2),
      paymentMode: paymentMode || null,
      expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
      receiptUrl: receiptUrl?.trim() || null,
      notes: notes?.trim() || null,
    })
    .returning();

  // Post ledger entry
  const totalAmount = (parseFloat(amount) + parseFloat(gstAmount)).toFixed(2);
  await db.insert(ledgerEntries).values({
    businessId,
    partyId: null,
    entryType: "expense",
    referenceId: created.id,
    referenceType: "expense",
    referenceNumber: `EXP-${created.id.slice(0, 8).toUpperCase()}`,
    debitAmount: totalAmount,
    creditAmount: "0",
    description: `Expense: ${title}`,
    entryDate: new Date(),
  });

  return created;
}

export async function listExpenses(businessId, { categoryId, paymentMode, from, to, search = "", page = DEFAULT_PAGE, limit = DEFAULT_LIMIT }) {
  const p = Math.max(1, parseInt(page) || DEFAULT_PAGE);
  const l = Math.min(parseInt(limit) || DEFAULT_LIMIT, MAX_LIMIT);
  const offset = (p - 1) * l;

  const conditions = [eq(expenses.businessId, businessId)];

  if (categoryId) {
    conditions.push(eq(expenses.categoryId, categoryId));
  }

  if (paymentMode) {
    conditions.push(eq(expenses.paymentMode, paymentMode));
  }

  if (from) {
    conditions.push(gte(expenses.expenseDate, new Date(from)));
  }

  if (to) {
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);
    conditions.push(lte(expenses.expenseDate, toDate));
  }

  if (search.trim()) {
    conditions.push(ilike(expenses.title, `%${search.trim()}%`));
  }

  const [{ total }] = await db
    .select({ total: sql`count(*)::int` })
    .from(expenses)
    .where(and(...conditions));

  const data = await db
    .select({
      id: expenses.id,
      title: expenses.title,
      amount: expenses.amount,
      gstAmount: expenses.gstAmount,
      paymentMode: expenses.paymentMode,
      expenseDate: expenses.expenseDate,
      receiptUrl: expenses.receiptUrl,
      notes: expenses.notes,
      categoryId: expenses.categoryId,
      categoryName: expenseCategories.name,
      createdAt: expenses.createdAt,
      updatedAt: expenses.updatedAt,
    })
    .from(expenses)
    .leftJoin(expenseCategories, eq(expenses.categoryId, expenseCategories.id))
    .where(and(...conditions))
    .orderBy(desc(expenses.expenseDate))
    .limit(l)
    .offset(offset);

  return {
    data,
    pagination: {
      page: p,
      limit: l,
      total,
      totalPages: Math.ceil(total / l),
    },
  };
}

export async function getExpense(expenseId, businessId) {
  const expense = await verifyOwnershipExpense(expenseId, businessId);

  const [data] = await db
    .select({
      id: expenses.id,
      title: expenses.title,
      amount: expenses.amount,
      gstAmount: expenses.gstAmount,
      paymentMode: expenses.paymentMode,
      expenseDate: expenses.expenseDate,
      receiptUrl: expenses.receiptUrl,
      notes: expenses.notes,
      categoryId: expenses.categoryId,
      categoryName: expenseCategories.name,
      createdAt: expenses.createdAt,
      updatedAt: expenses.updatedAt,
    })
    .from(expenses)
    .leftJoin(expenseCategories, eq(expenses.categoryId, expenseCategories.id))
    .where(eq(expenses.id, expenseId));

  return data;
}

export async function updateExpense(expenseId, businessId, { title, amount, categoryId, gstAmount, paymentMode, expenseDate, receiptUrl, notes }) {
  const expense = await verifyOwnershipExpense(expenseId, businessId);

  // Verify categoryId if provided
  if (categoryId) {
    await verifyOwnershipCategory(categoryId, businessId);
  }

  const [updated] = await db
    .update(expenses)
    .set({
      title: title !== undefined ? title.trim() : expense.title,
      amount: amount !== undefined ? parseFloat(amount).toFixed(2) : expense.amount,
      gstAmount: gstAmount !== undefined ? parseFloat(gstAmount).toFixed(2) : expense.gstAmount,
      paymentMode: paymentMode !== undefined ? paymentMode : expense.paymentMode,
      expenseDate: expenseDate !== undefined ? new Date(expenseDate) : expense.expenseDate,
      receiptUrl: receiptUrl !== undefined ? receiptUrl?.trim() || null : expense.receiptUrl,
      notes: notes !== undefined ? notes?.trim() || null : expense.notes,
      categoryId: categoryId !== undefined ? categoryId || null : expense.categoryId,
      updatedAt: new Date(),
    })
    .where(eq(expenses.id, expenseId))
    .returning();

  return updated;
}

export async function deleteExpense(expenseId, businessId) {
  const expense = await verifyOwnershipExpense(expenseId, businessId);

  // Hard delete acceptable for expenses (no dependencies)
  const [deleted] = await db
    .delete(expenses)
    .where(eq(expenses.id, expenseId))
    .returning();

  // Also delete associated ledger entry
  await db
    .delete(ledgerEntries)
    .where(
      and(
        eq(ledgerEntries.referenceId, expenseId),
        eq(ledgerEntries.referenceType, "expense")
      )
    );

  return deleted;
}

export async function getExpenseSummary(businessId, { from, to }) {
  const fromDate = from ? new Date(from) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const toDate = to ? new Date(to) : new Date();
  toDate.setHours(23, 59, 59, 999);

  const [totals] = await db
    .select({
      totalAmount: sql`COALESCE(SUM(cast(${expenses.amount} as numeric)), 0)`,
      totalGst: sql`COALESCE(SUM(cast(${expenses.gstAmount} as numeric)), 0)`,
      count: sql`count(*)::int`,
    })
    .from(expenses)
    .where(
      and(
        eq(expenses.businessId, businessId),
        gte(expenses.expenseDate, fromDate),
        lte(expenses.expenseDate, toDate)
      )
    );

  const byCategory = await db
    .select({
      categoryId: expenses.categoryId,
      categoryName: expenseCategories.name,
      total: sql`COALESCE(SUM(cast(${expenses.amount} as numeric) + cast(${expenses.gstAmount} as numeric)), 0)`,
      count: sql`count(*)::int`,
    })
    .from(expenses)
    .leftJoin(expenseCategories, eq(expenses.categoryId, expenseCategories.id))
    .where(
      and(
        eq(expenses.businessId, businessId),
        gte(expenses.expenseDate, fromDate),
        lte(expenses.expenseDate, toDate)
      )
    )
    .groupBy(expenses.categoryId, expenseCategories.name);

  return {
    totalExpenses: totals.count,
    totalAmount: parseFloat(totals.totalAmount).toFixed(2),
    totalGst: parseFloat(totals.totalGst).toFixed(2),
    byCategory,
  };
}
