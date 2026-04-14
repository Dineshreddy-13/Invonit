import { Router } from "express";
import { authenticate, requireBusiness } from "../../middlewares/auth.middleware.js";
import {
  createCategory,
  listCategories,
  getCategory,
  updateCategory,
  deleteCategory,
} from "./category.controller.js";

const router = Router();

router.use(authenticate, requireBusiness);

// POST   /api/categories                  → create
// GET    /api/categories                  → list root categories
// GET    /api/categories?parentId=<uuid>  → list sub-categories
// GET    /api/categories?flat=true        → all categories (dropdown use)
// GET    /api/categories?search=<term>    → search
router.post("/",              createCategory);
router.get("/",               listCategories);
router.get("/:categoryId",    getCategory);
router.patch("/:categoryId",  updateCategory);
router.delete("/:categoryId", deleteCategory);

export default router;