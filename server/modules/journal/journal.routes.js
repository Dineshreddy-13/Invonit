import { Router } from "express";
import { authenticate, requireBusiness } from "../../middlewares/auth.middleware.js";
import {
  createJournalEntry,
  listJournalEntries,
} from "./journal.controller.js";

const router = Router();

router.use(authenticate, requireBusiness);

// ── Journal Entry ──────────────────────────────────────────────────────────
router.post("/", createJournalEntry);
router.get("/", listJournalEntries);

export default router;
