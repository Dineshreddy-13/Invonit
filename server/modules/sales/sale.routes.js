import { Router } from "express";
import { authenticate, requireBusiness } from "../../middlewares/auth.middleware.js";
import {
  createSale,
  listSales,
  listSaleReturns,
  getSalesSummary,
  getTopSellingProducts,
  getSale,
  recordPayment,
  createSaleReturn,
  cancelSale,
  convertEstimate,
} from "./sale.controller.js";

const router = Router();

router.use(authenticate, requireBusiness);

// ── Static routes first ────────────────────────────────────────────────────

// GET  /api/sales/returns          → all sale returns
router.get("/returns",      listSaleReturns);

// GET  /api/sales/summary          → revenue summary for dashboard
// ?from= ?to=
router.get("/summary",      getSalesSummary);

// GET  /api/sales/top-products     → top selling products
// ?from= ?to= ?limit=
router.get("/top-products", getTopSellingProducts);

// ── Collection ────────────────────────────────────────────────────────────

// POST /api/sales                  → create sale / POS bill / estimate
// GET  /api/sales                  → list sales
//   ?customerId= ?status= ?saleType= ?search=
//   ?from= ?to= ?page= ?limit= ?sortBy= ?order=
router.post("/", createSale);
router.get("/",  listSales);

// ── Single resource ───────────────────────────────────────────────────────

// GET  /api/sales/:saleId          → get sale with all items
router.get("/:saleId", getSale);

// POST /api/sales/:saleId/payment  → record payment against balance
router.post("/:saleId/payment", recordPayment);

// POST /api/sales/:saleId/return   → create sale return (restores stock)
router.post("/:saleId/return",  createSaleReturn);

// POST /api/sales/:saleId/cancel   → cancel sale (restores stock)
router.post("/:saleId/cancel",  cancelSale);

// POST /api/sales/:saleId/convert  → convert estimate → invoice
router.post("/:saleId/convert", convertEstimate);

export default router;