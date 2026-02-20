import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth";
import {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../services/categoryService";
import { validate, createCategorySchema, updateCategorySchema } from "../utils/validation";
import { createAuditLog } from "../services/auditService";
import { AuditAction } from "@prisma/client";

export const getCategoriesController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const categories = await getCategories();
    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

export const getCategoryController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const category = await getCategory(id);
    res.json({
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

export const createCategoryController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = validate(createCategorySchema, req.body);
    const category = await createCategory(data);

    // Create audit log with metadata
    await createAuditLog({
      userId: req.user?.userId,
      action: AuditAction.CREATE,
      entityType: "Category",
      entityId: category.categoryId,
      details: `Category created: ${category.name}${category.description ? ` (${category.description})` : ""}`,
      metadata: {
        categoryName: category.name,
        description: category.description || null,
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.status(201).json({
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCategoryController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const data = validate(updateCategorySchema, req.body);
    
    // Get existing category to track changes
    const existingCategory = await getCategory(id);
    const category = await updateCategory(id, data);

    // Track changes for metadata
    const changes: Record<string, { old: any; new: any }> = {};
    if (data.name !== undefined && data.name !== existingCategory.name) {
      changes.name = { old: existingCategory.name, new: data.name };
    }
    if (data.description !== undefined && data.description !== existingCategory.description) {
      changes.description = { old: existingCategory.description || null, new: data.description || null };
    }

    // Create audit log with metadata
    const detailsParts = [`Category updated: ${category.name}`];
    if (Object.keys(changes).length > 0) {
      const changeDescriptions = Object.entries(changes).map(([key, value]) => {
        return `${key}: "${value.old || "null"}" → "${value.new || "null"}"`;
      });
      detailsParts.push(`Changes: ${changeDescriptions.join(", ")}`);
    }

    await createAuditLog({
      userId: req.user?.userId,
      action: AuditAction.UPDATE,
      entityType: "Category",
      entityId: category.categoryId,
      details: detailsParts.join(". "),
      metadata: Object.keys(changes).length > 0 ? { changes } : undefined,
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.json({
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCategoryController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Get category with product count before deletion
    const categoryWithCount = await getCategory(id);
    const category = await deleteCategory(id);

    // Create audit log with metadata
    await createAuditLog({
      userId: req.user?.userId,
      action: AuditAction.DELETE,
      entityType: "Category",
      entityId: id,
      details: `Category deleted: ${category.name}${category.description ? ` (${category.description})` : ""}`,
      metadata: {
        categoryName: category.name,
        description: category.description || null,
        productCount: categoryWithCount._count.products,
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

