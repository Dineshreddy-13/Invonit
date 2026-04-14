import { Router } from "express";
import { authenticate, requireBusiness } from "../../middlewares/auth.middleware.js";
import {
  createParty,
  listParties,
  getParty,
  updateParty,
  deleteParty,
  getPartyOutstanding,
} from "./party.controller.js";

const router = Router();

// Every party route needs a verified user AND an active business
router.use(authenticate, requireBusiness);

// POST   /api/parties                         → create party
router.post("/", createParty);

// GET    /api/parties                         → list (filter/search/paginate)
// ?type=customer|supplier|both
// ?search=<name|phone|email>
// ?page=1&limit=20
// ?sortBy=name|createdAt  &order=asc|desc
router.get("/", listParties);

// GET    /api/parties/:partyId                → get single party
router.get("/:partyId", getParty);

// PATCH  /api/parties/:partyId                → update party
router.patch("/:partyId", updateParty);

// DELETE /api/parties/:partyId                → soft delete
router.delete("/:partyId", deleteParty);

// GET    /api/parties/:partyId/outstanding    → outstanding balance
router.get("/:partyId/outstanding", getPartyOutstanding);

export default router;