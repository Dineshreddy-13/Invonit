import { and, eq, desc, gte, lte, sql } from "drizzle-orm";
import { db } from "../../database/db.js";
import { ledgerEntries, parties } from "../../database/schemas/index.js";
import { MSG, DEFAULT_PAGE, DEFAULT_LIMIT, MAX_LIMIT } from "../../utils/constants.js";

// ─── Helpers ──────────────────────────────────────────────────────────────
function notFound(type = "Party") {
  const e = new Error(`${type} not found.`);
  e.statusCode = 404;
  return e;
}

function forbidden(type = "Party") {
  const e = new Error(`You do not have access to this ${type.toLowerCase()}.`);
  e.statusCode = 403;
  return e;
}

async function verifyPartyOwnership(partyId, businessId) {
  if (!partyId) return null;

  const [party] = await db
    .select()
    .from(parties)
    .where(eq(parties.id, partyId))
    .limit(1);

  if (!party) throw notFound("Party");
  if (party.businessId !== businessId) throw forbidden("Party");
  return party;
}

// ─── Create Journal Entry ──────────────────────────────────────────────────

export async function createJournalEntry(businessId, { partyId, description, debitAmount, creditAmount, entryDate, referenceNumber }) {
  // Verify party if provided
  if (partyId) {
    await verifyPartyOwnership(partyId, businessId);
  }

  // Validate exactly one of debit or credit is > 0
  const debit = parseFloat(debitAmount || 0);
  const credit = parseFloat(creditAmount || 0);

  if ((debit > 0 && credit > 0) || (debit === 0 && credit === 0)) {
    const e = new Error("Exactly one of debitAmount or creditAmount must be greater than 0.");
    e.statusCode = 400;
    throw e;
  }

  const [created] = await db
    .insert(ledgerEntries)
    .values({
      businessId,
      partyId: partyId || null,
      entryType: "journal",
      referenceId: null,
      referenceType: null,
      referenceNumber: referenceNumber || null,
      debitAmount: debit > 0 ? debit.toFixed(2) : "0",
      creditAmount: credit > 0 ? credit.toFixed(2) : "0",
      description: description?.trim() || null,
      entryDate: entryDate ? new Date(entryDate) : new Date(),
    })
    .returning();

  return created;
}

// ─── List Journal Entries ──────────────────────────────────────────────────

export async function listJournalEntries(businessId, { from, to, partyId, page = DEFAULT_PAGE, limit = DEFAULT_LIMIT }) {
  const p = Math.max(1, parseInt(page) || DEFAULT_PAGE);
  const l = Math.min(parseInt(limit) || DEFAULT_LIMIT, MAX_LIMIT);
  const offset = (p - 1) * l;

  const conditions = [
    eq(ledgerEntries.businessId, businessId),
    eq(ledgerEntries.entryType, "journal"),
  ];

  if (from) {
    conditions.push(gte(ledgerEntries.entryDate, new Date(from)));
  }

  if (to) {
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);
    conditions.push(lte(ledgerEntries.entryDate, toDate));
  }

  if (partyId) {
    conditions.push(eq(ledgerEntries.partyId, partyId));
  }

  const [{ total }] = await db
    .select({ total: sql`count(*)::int` })
    .from(ledgerEntries)
    .where(and(...conditions));

  const data = await db
    .select({
      id: ledgerEntries.id,
      partyId: ledgerEntries.partyId,
      partyName: parties.name,
      description: ledgerEntries.description,
      debitAmount: ledgerEntries.debitAmount,
      creditAmount: ledgerEntries.creditAmount,
      referenceNumber: ledgerEntries.referenceNumber,
      entryDate: ledgerEntries.entryDate,
      createdAt: ledgerEntries.createdAt,
    })
    .from(ledgerEntries)
    .leftJoin(parties, eq(ledgerEntries.partyId, parties.id))
    .where(and(...conditions))
    .orderBy(desc(ledgerEntries.entryDate))
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
