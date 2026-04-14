import { Router } from "express";
import { authenticate, requireBusiness } from "../../middlewares/auth.middleware.js";
import {
  getLedger,
  getDaybook,
  getPartyLedger,
  getOutstanding,
  getTrialBalance,
  getProfitLoss,
  getBalanceSheet,
  getCashFlow,
} from "./accounting.controller.js";

const router = Router();

router.use(authenticate, requireBusiness);

// ── Ledger & Accounts ──────────────────────────────────────────────────────
router.get("/ledger", getLedger);
router.get("/daybook", getDaybook);
router.get("/party-ledger/:partyId", getPartyLedger);
router.get("/party-outstanding", getOutstanding);

// ── Financial Reports ─────────────────────────────────────────────────────
router.get("/trial-balance", getTrialBalance);
router.get("/profit-loss", getProfitLoss);
router.get("/balance-sheet", getBalanceSheet);
router.get("/cash-flow", getCashFlow);

export default router;
