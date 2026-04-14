import { Router } from "express";
import { authenticate, requireBusiness } from "../../middlewares/auth.middleware.js";
import {
  createExpenseCategory,
  listExpenseCategories,
  updateExpenseCategory,
  deleteExpenseCategory,
  createExpense,
  listExpenses,
  getExpense,
  updateExpense,
  deleteExpense,
  getExpenseSummary,
} from "./expense.controller.js";

const router = Router();

router.use(authenticate, requireBusiness);

// ── Expense Categories ────────────────────────────────────────────────────
router.post("/categories", createExpenseCategory);
router.get("/categories", listExpenseCategories);
router.patch("/categories/:categoryId", updateExpenseCategory);
router.delete("/categories/:categoryId", deleteExpenseCategory);

// ── Expenses (static routes first) ────────────────────────────────────────
router.get("/summary", getExpenseSummary);

// ── Expenses Collection ───────────────────────────────────────────────────
router.post("/", createExpense);
router.get("/", listExpenses);

// ── Single Expense ────────────────────────────────────────────────────────
router.get("/:expenseId", getExpense);
router.patch("/:expenseId", updateExpense);
router.delete("/:expenseId", deleteExpense);

export default router;
