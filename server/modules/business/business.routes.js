import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import {
  createBusiness,
  getMyBusiness,
  getBusinessById,
  updateBusiness,
} from "./business.controller.js";

const router = Router();

// All business routes require authentication
router.use(authenticate);

// POST   /api/business          → create business (first-time setup)
router.post("/", createBusiness);

// GET    /api/business          → get the authenticated user's business
router.get("/", getMyBusiness);

// GET    /api/business/:businessId → get specific business (ownership verified)
router.get("/:businessId", getBusinessById);

// PATCH  /api/business/:businessId → update business details
router.patch("/:businessId", updateBusiness);

export default router;