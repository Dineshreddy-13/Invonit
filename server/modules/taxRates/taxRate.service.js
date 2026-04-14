import { and, eq, ilike, sql, asc } from "drizzle-orm";
import { db } from "../../database/db.js";
import { taxRates } from "../../database/schemas/index.js";
import { MSG, MAX_TAX_RATE } from "../../utils/constants.js";

// ─── Helpers ──────────────────────────────────────────────────────────────
function notFound() {
  const e = new Error(MSG.TAX_RATE_NOT_FOUND); e.statusCode = 404; return e;
}
function forbidden() {
  const e = new Error(MSG.TAX_RATE_FORBIDDEN); e.statusCode = 403; return e;
}

async function verifyOwnership(taxRateId, businessId) {
  const [rate] = await db
    .select()
    .from(taxRates)
    .where(eq(taxRates.id, taxRateId))
    .limit(1);

  if (!rate) throw notFound();
  if (rate.businessId !== businessId) throw forbidden();
  return rate;
}

// ─── Compute total GST rate ────────────────────────────────────────────────
function computeTotals(payload) {
  const cgst = parseFloat(payload.cgstRate ?? 0);
  const sgst = parseFloat(payload.sgstRate ?? 0);
  const igst = parseFloat(payload.igstRate ?? 0);
  const cess = parseFloat(payload.cessRate ?? 0);

  // Business rule: IGST = CGST + SGST (inter-state)
  // Either set CGST+SGST (intra-state) OR IGST (inter-state), not both
  // We store all four and let the billing layer pick the right ones.
  return { cgst, sgst, igst, cess, total: cgst + sgst + cess };
}

// ─── Create Tax Rate ───────────────────────────────────────────────────────
export async function createTaxRate(businessId, payload) {
  // Duplicate name check
  const [dup] = await db
    .select({ id: taxRates.id })
    .from(taxRates)
    .where(
      and(
        eq(taxRates.businessId, businessId),
        ilike(taxRates.taxName, payload.taxName.trim()),
        eq(taxRates.isActive, true)
      )
    )
    .limit(1);

  if (dup) {
    const e = new Error(MSG.TAX_RATE_NAME_EXISTS); e.statusCode = 409; throw e;
  }

  const [rate] = await db
    .insert(taxRates)
    .values({
      businessId,
      taxName:  payload.taxName.trim(),
      hsnCode:  payload.hsnCode  ?? null,
      sacCode:  payload.sacCode  ?? null,
      cgstRate: payload.cgstRate ?? "0",
      sgstRate: payload.sgstRate ?? "0",
      igstRate: payload.igstRate ?? "0",
      cessRate: payload.cessRate ?? "0",
    })
    .returning();

  return rate;
}

// ─── List Tax Rates ────────────────────────────────────────────────────────
export async function listTaxRates(businessId, query) {
  const conditions = [
    eq(taxRates.businessId, businessId),
    eq(taxRates.isActive, true),
  ];

  if (query.search?.trim()) {
    conditions.push(ilike(taxRates.taxName, `%${query.search.trim()}%`));
  }

  if (query.hsnCode?.trim()) {
    conditions.push(ilike(taxRates.hsnCode, `%${query.hsnCode.trim()}%`));
  }

  const rows = await db
    .select()
    .from(taxRates)
    .where(and(...conditions))
    .orderBy(asc(taxRates.taxName));

  return rows;
}

// ─── Get Tax Rate by ID ────────────────────────────────────────────────────
export async function getTaxRateById(taxRateId, businessId) {
  return verifyOwnership(taxRateId, businessId);
}

// ─── Update Tax Rate ───────────────────────────────────────────────────────
export async function updateTaxRate(taxRateId, businessId, payload) {
  await verifyOwnership(taxRateId, businessId);

  if (payload.taxName) {
    const [dup] = await db
      .select({ id: taxRates.id })
      .from(taxRates)
      .where(
        and(
          eq(taxRates.businessId, businessId),
          ilike(taxRates.taxName, payload.taxName.trim()),
          eq(taxRates.isActive, true),
          sql`${taxRates.id} != ${taxRateId}`
        )
      )
      .limit(1);

    if (dup) {
      const e = new Error(MSG.TAX_RATE_NAME_EXISTS); e.statusCode = 409; throw e;
    }
  }

  const ALLOWED = [
    "taxName", "hsnCode", "sacCode",
    "cgstRate", "sgstRate", "igstRate", "cessRate",
  ];

  const updates = {};
  for (const field of ALLOWED) {
    if (payload[field] !== undefined) {
      updates[field] = field === "taxName" ? payload[field].trim() : payload[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    const e = new Error("No valid fields provided for update."); e.statusCode = 400; throw e;
  }

  updates.updatedAt = new Date();

  const [updated] = await db
    .update(taxRates)
    .set(updates)
    .where(eq(taxRates.id, taxRateId))
    .returning();

  return updated;
}

// ─── Delete Tax Rate (soft) ────────────────────────────────────────────────
// Hard block if products are using this rate (checked in Step 4 — products)
// For now: safe soft-delete always. Product step will add the in-use check.
export async function deleteTaxRate(taxRateId, businessId) {
  await verifyOwnership(taxRateId, businessId);

  await db
    .update(taxRates)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(taxRates.id, taxRateId));
}

// ─── Seed default GST slabs for a new business ────────────────────────────
// Called automatically after business creation. Idempotent.
export async function seedDefaultTaxRates(businessId) {
  const defaults = [
    { taxName: "GST 0%",    cgstRate: "0",   sgstRate: "0",   igstRate: "0",   cessRate: "0" },
    { taxName: "GST 5%",    cgstRate: "2.5", sgstRate: "2.5", igstRate: "5",   cessRate: "0" },
    { taxName: "GST 12%",   cgstRate: "6",   sgstRate: "6",   igstRate: "12",  cessRate: "0" },
    { taxName: "GST 18%",   cgstRate: "9",   sgstRate: "9",   igstRate: "18",  cessRate: "0" },
    { taxName: "GST 28%",   cgstRate: "14",  sgstRate: "14",  igstRate: "28",  cessRate: "0" },
    { taxName: "GST 3%",    cgstRate: "1.5", sgstRate: "1.5", igstRate: "3",   cessRate: "0" },
    { taxName: "GST 7.5%",  cgstRate: "3.75",sgstRate: "3.75",igstRate: "7.5", cessRate: "0" },
  ];

  // Only insert if no tax rates exist yet for this business
  const [{ count }] = await db
    .select({ count: sql`count(*)::int` })
    .from(taxRates)
    .where(eq(taxRates.businessId, businessId));

  if (count > 0) return; // already seeded

  await db.insert(taxRates).values(
    defaults.map((d) => ({ businessId, ...d }))
  );
}