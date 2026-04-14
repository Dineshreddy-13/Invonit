import { and, eq, ilike, or, sql, desc, asc } from "drizzle-orm";
import { db } from "../../database/db.js";
import { parties } from "../../database/schemas/index.js";
import { MSG, DEFAULT_PAGE, DEFAULT_LIMIT, MAX_LIMIT } from "../../utils/constants.js";

// ─── helpers ──────────────────────────────────────────────────────────────
function notFound() {
  const e = new Error(MSG.PARTY_NOT_FOUND);
  e.statusCode = 404;
  return e;
}

function forbidden() {
  const e = new Error(MSG.PARTY_FORBIDDEN);
  e.statusCode = 403;
  return e;
}

// ─── Verify party belongs to business ─────────────────────────────────────
async function verifyOwnership(partyId, businessId) {
  const [party] = await db
    .select()
    .from(parties)
    .where(eq(parties.id, partyId))
    .limit(1);

  if (!party) throw notFound();
  if (party.businessId !== businessId) throw forbidden();

  return party;
}

// ─── Create Party ──────────────────────────────────────────────────────────
export async function createParty(businessId, payload) {
  // Case-insensitive duplicate name check within same business
  const duplicate = await db
    .select({ id: parties.id })
    .from(parties)
    .where(
      and(
        eq(parties.businessId, businessId),
        ilike(parties.name, payload.name.trim())
      )
    )
    .limit(1);

  if (duplicate.length > 0) {
    const err = new Error(MSG.PARTY_NAME_EXISTS);
    err.statusCode = 409;
    throw err;
  }

  const [party] = await db
    .insert(parties)
    .values({
      businessId,
      name:                payload.name.trim(),
      partyType:           payload.partyType,
      phone:               payload.phone               ?? null,
      email:               payload.email               ?? null,
      gstin:               payload.gstin               ?? null,
      pan:                 payload.pan                 ?? null,
      address:             payload.address             ?? null,
      city:                payload.city                ?? null,
      state:               payload.state               ?? null,
      pincode:             payload.pincode             ?? null,
      openingBalance:      payload.openingBalance      ?? "0",
      openingBalanceType:  payload.openingBalanceType  ?? "Dr",
      creditLimit:         payload.creditLimit         ?? "0",
      creditDays:          payload.creditDays          ?? "0",
      notes:               payload.notes               ?? null,
    })
    .returning();

  return party;
}

// ─── List Parties (with filter + search + pagination) ─────────────────────
export async function listParties(businessId, query) {
  const page   = Math.max(parseInt(query.page  ?? DEFAULT_PAGE,  10), 1);
  const limit  = Math.min(parseInt(query.limit ?? DEFAULT_LIMIT, 10), MAX_LIMIT);
  const offset = (page - 1) * limit;

  // Build WHERE conditions
  const conditions = [
    eq(parties.businessId, businessId),
    eq(parties.isActive, true),
  ];

  // Filter by party type: customer | supplier | both
  if (query.type && ["customer", "supplier", "both"].includes(query.type)) {
    // "both" parties should appear in customer and supplier filtered views
    if (query.type === "customer") {
      conditions.push(
        or(eq(parties.partyType, "customer"), eq(parties.partyType, "both"))
      );
    } else if (query.type === "supplier") {
      conditions.push(
        or(eq(parties.partyType, "supplier"), eq(parties.partyType, "both"))
      );
    } else {
      conditions.push(eq(parties.partyType, "both"));
    }
  }

  // Search by name, phone, or email
  if (query.search?.trim()) {
    const term = `%${query.search.trim()}%`;
    conditions.push(
      or(
        ilike(parties.name,  term),
        ilike(parties.phone, term),
        ilike(parties.email, term)
      )
    );
  }

  const whereClause = and(...conditions);

  // Sorting
  const sortField = query.sortBy === "name" ? parties.name : parties.createdAt;
  const sortOrder = query.order === "asc" ? asc(sortField) : desc(sortField);

  // Fetch rows + total count in parallel
  const [rows, [{ total }]] = await Promise.all([
    db
      .select()
      .from(parties)
      .where(whereClause)
      .orderBy(sortOrder)
      .limit(limit)
      .offset(offset),

    db
      .select({ total: sql`count(*)::int` })
      .from(parties)
      .where(whereClause),
  ]);

  return {
    parties: rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ─── Get Party by ID ───────────────────────────────────────────────────────
export async function getPartyById(partyId, businessId) {
  return verifyOwnership(partyId, businessId);
}

// ─── Update Party ──────────────────────────────────────────────────────────
export async function updateParty(partyId, businessId, payload) {
  // Verify ownership
  await verifyOwnership(partyId, businessId);

  // Duplicate name check (exclude current party)
  if (payload.name) {
    const duplicate = await db
      .select({ id: parties.id })
      .from(parties)
      .where(
        and(
          eq(parties.businessId, businessId),
          ilike(parties.name, payload.name.trim()),
          sql`${parties.id} != ${partyId}`
        )
      )
      .limit(1);

    if (duplicate.length > 0) {
      const err = new Error(MSG.PARTY_NAME_EXISTS);
      err.statusCode = 409;
      throw err;
    }
  }

  const ALLOWED = [
    "name", "partyType", "phone", "email", "gstin", "pan",
    "address", "city", "state", "pincode",
    "openingBalance", "openingBalanceType",
    "creditLimit", "creditDays", "notes",
  ];

  const updates = {};
  for (const field of ALLOWED) {
    if (payload[field] !== undefined) {
      updates[field] = field === "name" ? payload[field].trim() : payload[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    const err = new Error("No valid fields provided for update.");
    err.statusCode = 400;
    throw err;
  }

  updates.updatedAt = new Date();

  const [updated] = await db
    .update(parties)
    .set(updates)
    .where(eq(parties.id, partyId))
    .returning();

  return updated;
}

// ─── Soft Delete Party ─────────────────────────────────────────────────────
export async function deleteParty(partyId, businessId) {
  await verifyOwnership(partyId, businessId);

  await db
    .update(parties)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(parties.id, partyId));
}

// ─── Get Party Outstanding Balance ────────────────────────────────────────
// Will be enriched with real ledger data in the Accounting step.
// For now returns opening balance as the outstanding amount.
export async function getPartyOutstanding(partyId, businessId) {
  const party = await verifyOwnership(partyId, businessId);

  return {
    partyId:            party.id,
    partyName:          party.name,
    partyType:          party.partyType,
    openingBalance:     party.openingBalance,
    openingBalanceType: party.openingBalanceType,
    creditLimit:        party.creditLimit,
    creditDays:         party.creditDays,
    // Real outstanding will come from ledger entries in accounting step
    outstandingAmount:  party.openingBalance,
    balanceType:        party.openingBalanceType,
  };
}