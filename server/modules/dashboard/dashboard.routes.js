import { Router } from "express";
import { authenticate, requireBusiness } from "../../middlewares/auth.middleware.js";
import {
  getDashboardOverview,
  getSalesChart,
} from "./dashboard.controller.js";

const router = Router();

router.use(authenticate, requireBusiness);

// ── Dashboard ──────────────────────────────────────────────────────────────
router.get("/overview", getDashboardOverview);
router.get("/sales-chart", getSalesChart);

export default router;
