import { eq } from "drizzle-orm";
import { db } from "../../database/db.js";
import { businesses } from "../../database/schemas/index.js";
import { MSG } from "../../utils/constants.js";
import { seedDefaultTaxRates } from "../taxRates/taxRate.service.js";


// ─── Create Business ───────────────────────────────────────────────────────
export async function createBusiness(ownerId, payload) {
    // One business per user (for now — multi-branch later)
    const existing = await db
        .select({ id: businesses.id })
        .from(businesses)
        .where(eq(businesses.ownerId, ownerId))
        .limit(1);

    if (existing.length > 0) {
        const err = new Error(MSG.BUSINESS_ALREADY_EXISTS);
        err.statusCode = 409;
        throw err;
    }

    const [business] = await db
        .insert(businesses)
        .values({
            ownerId,
            name: payload.name,
            legalName: payload.legalName ?? null,
            businessType: payload.businessType ?? "retail",
            gstin: payload.gstin ?? null,
            pan: payload.pan ?? null,
            phone: payload.phone ?? null,
            email: payload.email ?? null,
            address: payload.address ?? null,
            city: payload.city ?? null,
            state: payload.state ?? null,
            pincode: payload.pincode ?? null,
            country: payload.country ?? "India",
            currency: payload.currency ?? "INR",
            financialYearStart: payload.financialYearStart ?? "04-01",
            invoicePrefix: payload.invoicePrefix ?? "INV",
        })
        .returning();

    await seedDefaultTaxRates(business.id);

    return business;
}

// ─── Get Business by Owner ─────────────────────────────────────────────────
export async function getBusinessByOwner(ownerId) {
    const [business] = await db
        .select()
        .from(businesses)
        .where(eq(businesses.ownerId, ownerId))
        .limit(1);

    return business ?? null;
}

// ─── Get Business by ID (with ownership check) ────────────────────────────
export async function getBusinessById(businessId, ownerId) {
    const [business] = await db
        .select()
        .from(businesses)
        .where(eq(businesses.id, businessId))
        .limit(1);

    if (!business) {
        const err = new Error(MSG.BUSINESS_NOT_FOUND);
        err.statusCode = 404;
        throw err;
    }

    if (business.ownerId !== ownerId) {
        const err = new Error(MSG.BUSINESS_FORBIDDEN);
        err.statusCode = 403;
        throw err;
    }

    return business;
}

// ─── Update Business ───────────────────────────────────────────────────────
export async function updateBusiness(businessId, ownerId, payload) {
    // Verify ownership first
    await getBusinessById(businessId, ownerId);

    const allowedFields = [
        "name", "legalName", "businessType", "gstin", "pan",
        "phone", "email", "address", "city", "state", "pincode",
        "country", "currency", "financialYearStart", "invoicePrefix", "logoUrl",
    ];

    const updates = {};
    for (const field of allowedFields) {
        if (payload[field] !== undefined) {
            updates[field] = payload[field];
        }
    }

    if (Object.keys(updates).length === 0) {
        const err = new Error("No valid fields provided for update.");
        err.statusCode = 400;
        throw err;
    }

    updates.updatedAt = new Date();

    const [updated] = await db
        .update(businesses)
        .set(updates)
        .where(eq(businesses.id, businessId))
        .returning();

    return updated;
}