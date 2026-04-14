import { and, eq, ilike, isNull, sql, asc } from "drizzle-orm";
import { db } from "../../database/db.js";
import { categories } from "../../database/schemas/index.js";
import { MSG } from "../../utils/constants.js";

// ─── Helpers ──────────────────────────────────────────────────────────────
function notFound() {
  const e = new Error(MSG.CATEGORY_NOT_FOUND); e.statusCode = 404; return e;
}
function forbidden() {
  const e = new Error(MSG.CATEGORY_FORBIDDEN); e.statusCode = 403; return e;
}

async function verifyOwnership(categoryId, businessId) {
  const [cat] = await db
    .select()
    .from(categories)
    .where(eq(categories.id, categoryId))
    .limit(1);

  if (!cat) throw notFound();
  if (cat.businessId !== businessId) throw forbidden();
  return cat;
}

// ─── Duplicate name check within same business + same parent level ─────────
async function checkDuplicate(businessId, name, parentId = null, excludeId = null) {
  const conditions = [
    eq(categories.businessId, businessId),
    ilike(categories.name, name.trim()),
    eq(categories.isActive, true),
  ];

  // Match at same parent level
  if (parentId) {
    conditions.push(eq(categories.parentId, parentId));
  } else {
    conditions.push(isNull(categories.parentId));
  }

  if (excludeId) {
    conditions.push(sql`${categories.id} != ${excludeId}`);
  }

  const [dup] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(and(...conditions))
    .limit(1);

  return !!dup;
}

// ─── Create Category ───────────────────────────────────────────────────────
export async function createCategory(businessId, payload) {
  const parentId = payload.parentId ?? null;

  // Validate parent exists and belongs to this business
  if (parentId) {
    const [parent] = await db
      .select({ id: categories.id, businessId: categories.businessId })
      .from(categories)
      .where(and(eq(categories.id, parentId), eq(categories.isActive, true)))
      .limit(1);

    if (!parent) {
      const e = new Error(MSG.CATEGORY_PARENT_NOT_FOUND); e.statusCode = 404; throw e;
    }
    if (parent.businessId !== businessId) throw forbidden();
  }

  const isDuplicate = await checkDuplicate(businessId, payload.name, parentId);
  if (isDuplicate) {
    const e = new Error(MSG.CATEGORY_NAME_EXISTS); e.statusCode = 409; throw e;
  }

  const [cat] = await db
    .insert(categories)
    .values({
      businessId,
      name:        payload.name.trim(),
      description: payload.description ?? null,
      parentId,
    })
    .returning();

  return cat;
}

// ─── List Categories (tree-aware) ─────────────────────────────────────────
// Returns flat list. Pass ?parentId=<id> for children, omit for root categories.
// Pass ?flat=true to get all categories without tree structure.
export async function listCategories(businessId, query) {
  const conditions = [
    eq(categories.businessId, businessId),
    eq(categories.isActive, true),
  ];

  if (query.flat !== "true") {
    // Default: only root categories (parentId is null)
    if (query.parentId) {
      conditions.push(eq(categories.parentId, query.parentId));
    } else {
      conditions.push(isNull(categories.parentId));
    }
  }

  if (query.search?.trim()) {
    conditions.push(ilike(categories.name, `%${query.search.trim()}%`));
  }

  const rows = await db
    .select()
    .from(categories)
    .where(and(...conditions))
    .orderBy(asc(categories.name));

  // If fetching root categories, attach children count to each
  if (!query.flat && !query.parentId) {
    const withChildren = await Promise.all(
      rows.map(async (cat) => {
        const [{ count }] = await db
          .select({ count: sql`count(*)::int` })
          .from(categories)
          .where(
            and(
              eq(categories.parentId, cat.id),
              eq(categories.isActive, true)
            )
          );
        return { ...cat, childrenCount: count };
      })
    );
    return withChildren;
  }

  return rows;
}

// ─── Get Category by ID ────────────────────────────────────────────────────
export async function getCategoryById(categoryId, businessId) {
  const cat = await verifyOwnership(categoryId, businessId);

  // Attach children
  const children = await db
    .select()
    .from(categories)
    .where(
      and(
        eq(categories.parentId, categoryId),
        eq(categories.isActive, true)
      )
    )
    .orderBy(asc(categories.name));

  return { ...cat, children };
}

// ─── Update Category ───────────────────────────────────────────────────────
export async function updateCategory(categoryId, businessId, payload) {
  const cat = await verifyOwnership(categoryId, businessId);

  // Circular reference guard
  if (payload.parentId && payload.parentId === categoryId) {
    const e = new Error(MSG.CATEGORY_CIRCULAR_REF); e.statusCode = 400; throw e;
  }

  // Validate new parent if changing
  if (payload.parentId !== undefined && payload.parentId !== null) {
    const [parent] = await db
      .select({ id: categories.id, businessId: categories.businessId })
      .from(categories)
      .where(and(eq(categories.id, payload.parentId), eq(categories.isActive, true)))
      .limit(1);

    if (!parent) {
      const e = new Error(MSG.CATEGORY_PARENT_NOT_FOUND); e.statusCode = 404; throw e;
    }
    if (parent.businessId !== businessId) throw forbidden();
  }

  // Duplicate name check at the target level
  if (payload.name) {
    const targetParentId = payload.parentId !== undefined
      ? payload.parentId
      : cat.parentId;

    const isDuplicate = await checkDuplicate(
      businessId,
      payload.name,
      targetParentId,
      categoryId
    );
    if (isDuplicate) {
      const e = new Error(MSG.CATEGORY_NAME_EXISTS); e.statusCode = 409; throw e;
    }
  }

  const ALLOWED = ["name", "description", "parentId"];
  const updates = {};
  for (const field of ALLOWED) {
    if (payload[field] !== undefined) {
      updates[field] = field === "name" ? payload[field].trim() : payload[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    const e = new Error("No valid fields provided for update."); e.statusCode = 400; throw e;
  }

  updates.updatedAt = new Date();

  const [updated] = await db
    .update(categories)
    .set(updates)
    .where(eq(categories.id, categoryId))
    .returning();

  return updated;
}

// ─── Delete Category (soft) ────────────────────────────────────────────────
export async function deleteCategory(categoryId, businessId) {
  await verifyOwnership(categoryId, businessId);

  // Block if has active children
  const [{ count }] = await db
    .select({ count: sql`count(*)::int` })
    .from(categories)
    .where(
      and(
        eq(categories.parentId, categoryId),
        eq(categories.isActive, true)
      )
    );

  if (count > 0) {
    const e = new Error(MSG.CATEGORY_HAS_CHILDREN); e.statusCode = 409; throw e;
  }

  await db
    .update(categories)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(categories.id, categoryId));
}