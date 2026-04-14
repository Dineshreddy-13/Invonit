import { Router } from "express";
import { authenticate, requireBusiness } from "../../middlewares/auth.middleware.js";
import {
  createPurchase,
  listPurchases,
  listPurchaseReturns,
  getPurchase,
  recordPayment,
  createPurchaseReturn,
  cancelPurchase,
} from "./purchase.controller.js";

const router = Router();

router.use(authenticate, requireBusiness);

// ── Static routes first ────────────────────────────────────────────────────

// GET  /api/purchases/returns              → all purchase returns
router.get("/returns", listPurchaseReturns);

// ── Collection ────────────────────────────────────────────────────────────

// POST /api/purchases                     → create purchase
// GET  /api/purchases                     → list purchases
//   ?supplierId= ?status= ?source= ?search=
//   ?from=<ISO date> ?to=<ISO date>
//   ?page= ?limit=
router.post("/", createPurchase);
router.get("/",  listPurchases);

// ── Single resource ───────────────────────────────────────────────────────

// GET  /api/purchases/:purchaseId         → get purchase with items
router.get("/:purchaseId", getPurchase);

// POST /api/purchases/:purchaseId/payment → record payment against balance
router.post("/:purchaseId/payment", recordPayment);

// POST /api/purchases/:purchaseId/return  → create purchase return
router.post("/:purchaseId/return",  createPurchaseReturn);

// POST /api/purchases/:purchaseId/cancel  → cancel & reverse stock
router.post("/:purchaseId/cancel",  cancelPurchase);

export default router;