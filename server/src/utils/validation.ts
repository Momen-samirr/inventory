import { z } from "zod";
import { ValidationError } from "./errors";

export const validate = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errors = result.error.errors.map((err) => `${err.path.join(".")}: ${err.message}`).join(", ");
    throw new ValidationError(errors);
  }
  return result.data;
};

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["ADMIN", "MANAGER", "EMPLOYEE"]).optional(),
});

// Product schemas
export const createProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  price: z.number().positive("Price must be positive"),
  rating: z.number().min(0).max(5).optional(),
  stockQuantity: z.number().int().min(0, "Stock quantity cannot be negative"),
  categoryId: z.string().uuid("Invalid category ID").optional(),
  imageUrl: z.string().url().optional(),
});

export const updateProductSchema = createProductSchema.partial();

// Inventory schemas
export const stockAdjustmentSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  quantity: z.number().int(),
  reason: z.string().optional(),
  movementType: z.enum(["ADJUSTMENT", "RETURN"]),
});

// User schemas
export const createUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["ADMIN", "MANAGER", "EMPLOYEE"]).optional(),
  isActive: z.boolean().optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional().or(z.literal("")),
  role: z.enum(["ADMIN", "MANAGER", "EMPLOYEE"]).optional(),
  isActive: z.boolean().optional(),
});

// Category schemas
export const createCategorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").optional(),
  description: z.string().optional(),
});

// Sales schemas
export const createSaleSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  quantity: z.number().int().positive("Quantity must be positive"),
  unitPrice: z.number().positive("Unit price must be positive"),
});

// Purchases schemas
export const createPurchaseSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  quantity: z.number().int().positive("Quantity must be positive"),
  unitCost: z.number().positive("Unit cost must be positive"),
});

// Expenses schemas
export const createExpenseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  amount: z.number().positive("Amount must be positive"),
});

export const updateExpenseSchema = createExpenseSchema.partial();

