import { Router } from "express";
import { authenticate, requireBusiness } from "../../middlewares/auth.middleware.js";
import {
  getSalesReport,
  getPurchasesReport,
  getStockReport,
  getPartyStatement,
  getMonthlyAnalysis,
  getTopCustomers,
  getTopSuppliers,
} from "./report.controller.js";

const router = Router();

router.use(authenticate, requireBusiness);

// ── Sales & Purchases ──────────────────────────────────────────────────────
router.get("/sales", getSalesReport);
router.get("/purchases", getPurchasesReport);

// ── Inventory ──────────────────────────────────────────────────────────────
router.get("/stock", getStockReport);

// ── Party Reports ─────────────────────────────────────────────────────────
router.get("/party-statement/:partyId", getPartyStatement);
router.get("/top-customers", getTopCustomers);
router.get("/top-suppliers", getTopSuppliers);

// ── Analysis ───────────────────────────────────────────────────────────────
router.get("/monthly-analysis", getMonthlyAnalysis);

export default router;
