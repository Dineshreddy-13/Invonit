import { Router } from "express";
import { authenticate, requireBusiness } from "../../middlewares/auth.middleware.js";
import {
  getGstSummary,
  getHsnSummary,
  getGstr1,
  getGstr3b,
} from "./gst.controller.js";

const router = Router();

router.use(authenticate, requireBusiness);

// ── GST & Tax Reports ──────────────────────────────────────────────────────
router.get("/summary", getGstSummary);
router.get("/hsn-summary", getHsnSummary);
router.get("/gstr1", getGstr1);
router.get("/gstr3b", getGstr3b);

export default router;
