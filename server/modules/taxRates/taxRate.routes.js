import { Router } from "express";
import { authenticate, requireBusiness } from "../../middlewares/auth.middleware.js";
import {
  createTaxRate,
  listTaxRates,
  getTaxRate,
  updateTaxRate,
  deleteTaxRate,
  seedTaxRates,
} from "./taxRate.controller.js";

const router = Router();

router.use(authenticate, requireBusiness);

// POST   /api/tax-rates/seed          → seed default GST slabs (call once after business setup)
// POST   /api/tax-rates               → create custom tax rate
// GET    /api/tax-rates               → list all active tax rates
// GET    /api/tax-rates/:taxRateId    → get single rate
// PATCH  /api/tax-rates/:taxRateId    → update
// DELETE /api/tax-rates/:taxRateId    → soft delete

// NOTE: /seed must be declared before /:taxRateId to avoid param conflict
router.post("/seed",           seedTaxRates);
router.post("/",               createTaxRate);
router.get("/",                listTaxRates);
router.get("/:taxRateId",      getTaxRate);
router.patch("/:taxRateId",    updateTaxRate);
router.delete("/:taxRateId",   deleteTaxRate);

export default router;