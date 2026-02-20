import { Router } from "express";
import {
  getCategoriesController,
  getCategoryController,
  createCategoryController,
  updateCategoryController,
  deleteCategoryController,
} from "../controllers/categoryController";
import { authenticate } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { UserRole } from "@prisma/client";

const router = Router();

// All category routes require authentication
router.use(authenticate);

// GET /categories - All authenticated users can view categories
router.get("/", getCategoriesController);

// GET /categories/:id - All authenticated users can view a category
router.get("/:id", getCategoryController);

// POST /categories - Admin and Manager can create categories
router.post(
  "/",
  requireRole(UserRole.ADMIN, UserRole.MANAGER),
  createCategoryController
);

// PUT /categories/:id - Admin and Manager can update categories
router.put(
  "/:id",
  requireRole(UserRole.ADMIN, UserRole.MANAGER),
  updateCategoryController
);

// DELETE /categories/:id - Only Admin can delete categories
router.delete("/:id", requireRole(UserRole.ADMIN), deleteCategoryController);

export default router;

