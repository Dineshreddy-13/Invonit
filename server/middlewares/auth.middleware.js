import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { db } from "../database/db.js";
import { users, businesses } from "../database/schemas/index.js";
import { JWT_SECRET } from "../config/env.js";
import { HTTP, MSG } from "../utils/constants.js";

function sendError(res, statusCode, message) {
  return res.status(statusCode).json({ success: false, message });
}

// ─── authenticate ──────────────────────────────────────────────────────────
// Verifies JWT and attaches req.user = { id, email, name }
export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return sendError(res, HTTP.UNAUTHORIZED, MSG.UNAUTHORIZED);
    }

    const token = authHeader.split(" ")[1];

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return sendError(res, HTTP.UNAUTHORIZED, MSG.TOKEN_INVALID);
    }

    const [user] = await db
      .select({
        id:         users.id,
        name:       users.name,
        email:      users.email,
        isVerified: users.isVerified,
      })
      .from(users)
      .where(eq(users.id, decoded.id))
      .limit(1);

    if (!user) {
      return sendError(res, HTTP.UNAUTHORIZED, MSG.USER_NOT_FOUND);
    }

    if (!user.isVerified) {
      return sendError(res, HTTP.FORBIDDEN, "Account not verified.");
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("[authenticate] error:", err);
    return sendError(res, HTTP.INTERNAL, MSG.INTERNAL_ERROR);
  }
}

// ─── requireBusiness ───────────────────────────────────────────────────────
// Use on routes that need an active business.
// Attaches req.business = { id, ownerId, name, ... }
// Usage: router.get("/something", authenticate, requireBusiness, controller)
export async function requireBusiness(req, res, next) {
  try {
    const [business] = await db
      .select()
      .from(businesses)
      .where(eq(businesses.ownerId, req.user.id))
      .limit(1);

    if (!business || !business.isActive) {
      return sendError(res, HTTP.FORBIDDEN, MSG.BUSINESS_NOT_FOUND);
    }

    req.business = business;
    next();
  } catch (err) {
    console.error("[requireBusiness] error:", err);
    return sendError(res, HTTP.INTERNAL, MSG.INTERNAL_ERROR);
  }
}