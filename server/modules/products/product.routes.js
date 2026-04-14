import { Router } from "express";
import { authenticate, requireBusiness } from "../../middlewares/auth.middleware.js";
import {
  createProduct,
  listProducts,
  getStockSummary,
  getLowStockProducts,
  getProductByBarcode,
  getProduct,
  updateProduct,
  deleteProduct,
  adjustStock,
} from "./product.controller.js";

const router = Router();

router.use(authenticate, requireBusiness);

// ── Static routes first (avoids :productId conflicts) ─────────────────────

// GET  /api/products/stock-summary       → inventory overview card
router.get("/stock-summary",    getStockSummary);

// GET  /api/products/low-stock           → low/out-of-stock items
router.get("/low-stock",        getLowStockProducts);

// GET  /api/products/barcode/:barcode    → POS barcode scan lookup
router.get("/barcode/:barcode", getProductByBarcode);

// ── Collection ────────────────────────────────────────────────────────────
// POST /api/products
// GET  /api/products?search=&categoryId=&lowStock=true&outOfStock=true&page=&limit=
router.post("/",  createProduct);
router.get("/",   listProducts);

// ── Single resource ───────────────────────────────────────────────────────
router.get   ("/:productId",              getProduct);
router.patch ("/:productId",              updateProduct);
router.delete("/:productId",              deleteProduct);

// POST /api/products/:productId/adjust-stock
router.post  ("/:productId/adjust-stock", adjustStock);

export default router;