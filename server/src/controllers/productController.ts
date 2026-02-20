import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth";
import { prisma } from "../config/database";
import { validate, createProductSchema, updateProductSchema } from "../utils/validation";
import { NotFoundError } from "../utils/errors";
import { createAuditLog } from "../services/auditService";
import { AuditAction } from "@prisma/client";
import { uploadImage, deleteImage } from "../services/cloudinaryService";

export const getProducts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const search = req.query.search?.toString();
    const categoryId = req.query.categoryId?.toString();
    const stockStatus = req.query.stockStatus?.toString(); // "inStock", "lowStock", "outOfStock"
    const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice.toString()) : undefined;
    const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice.toString()) : undefined;
    const sortBy = req.query.sortBy?.toString() || "createdAt";
    const sortOrder = req.query.sortOrder?.toString() || "desc";
    const page = req.query.page ? parseInt(req.query.page.toString()) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit.toString()) : 20;
    const skip = (page - 1) * limit;
    
    const where: any = {};
    
    // Search by name, description, or SKU
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
      ];
    }
    
    // Filter by category
    if (categoryId) {
      where.categoryId = categoryId;
    }
    
    // Filter by stock status
    if (stockStatus === "inStock") {
      where.stockQuantity = { gt: 10 };
    } else if (stockStatus === "lowStock") {
      where.stockQuantity = { lte: 10, gt: 0 };
    } else if (stockStatus === "outOfStock") {
      where.stockQuantity = 0;
    }
    
    // Filter by price range
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) {
        where.price.gte = minPrice;
      }
      if (maxPrice !== undefined) {
        where.price.lte = maxPrice;
      }
    }

    // Build orderBy
    const orderBy: any = {};
    if (sortBy === "name") {
      orderBy.name = sortOrder;
    } else if (sortBy === "price") {
      orderBy.price = sortOrder;
    } else if (sortBy === "stock") {
      orderBy.stockQuantity = sortOrder;
    } else {
      orderBy.createdAt = sortOrder;
    }

    // Get total count for pagination
    const total = await prisma.products.count({ where });

    // Get products with pagination
    const products = await prisma.products.findMany({
      where,
      include: {
        category: {
          select: {
            categoryId: true,
            name: true,
            description: true,
          },
        },
      },
      orderBy,
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getProduct = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const product = await prisma.products.findUnique({
      where: { productId: id },
      include: {
        category: {
          select: {
            categoryId: true,
            name: true,
            description: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundError("Product");
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = validate(createProductSchema, req.body);
    const product = await prisma.products.create({
      data,
    });

    // Create audit log with metadata
    await createAuditLog({
      userId: req.user?.userId,
      action: AuditAction.CREATE,
      entityType: "Product",
      entityId: product.productId,
      details: `Product created: ${product.name} (Price: $${product.price}, Stock: ${product.stockQuantity})`,
      metadata: {
        productName: product.name,
        price: product.price,
        stockQuantity: product.stockQuantity,
        categoryId: product.categoryId || null,
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.status(201).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const data = validate(updateProductSchema, req.body);

    const existingProduct = await prisma.products.findUnique({
      where: { productId: id },
    });

    if (!existingProduct) {
      throw new NotFoundError("Product");
    }

    // Track changes for metadata
    const changes: Record<string, { old: any; new: any }> = {};
    if (data.name !== undefined && data.name !== existingProduct.name) {
      changes.name = { old: existingProduct.name, new: data.name };
    }
    if (data.price !== undefined && data.price !== existingProduct.price) {
      changes.price = { old: existingProduct.price, new: data.price };
    }
    if (data.stockQuantity !== undefined && data.stockQuantity !== existingProduct.stockQuantity) {
      changes.stockQuantity = { old: existingProduct.stockQuantity, new: data.stockQuantity };
    }
    if (data.categoryId !== undefined && data.categoryId !== existingProduct.categoryId) {
      changes.categoryId = { old: existingProduct.categoryId, new: data.categoryId };
    }

    const product = await prisma.products.update({
      where: { productId: id },
      data,
    });

    // Create audit log with metadata
    const detailsParts = [`Product updated: ${product.name}`];
    if (Object.keys(changes).length > 0) {
      const changeDescriptions = Object.entries(changes).map(([key, value]) => {
        if (key === "price") return `${key}: $${value.old} → $${value.new}`;
        return `${key}: ${value.old} → ${value.new}`;
      });
      detailsParts.push(`Changes: ${changeDescriptions.join(", ")}`);
    }

    await createAuditLog({
      userId: req.user?.userId,
      action: AuditAction.UPDATE,
      entityType: "Product",
      entityId: product.productId,
      details: detailsParts.join(". "),
      metadata: Object.keys(changes).length > 0 ? { changes } : undefined,
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const product = await prisma.products.findUnique({
      where: { productId: id },
    });

    if (!product) {
      throw new NotFoundError("Product");
    }

    // Delete image from Cloudinary if exists
    if (product.imageUrl) {
      await deleteImage(product.imageUrl);
    }

    await prisma.products.delete({
      where: { productId: id },
    });

    // Create audit log with metadata
    await createAuditLog({
      userId: req.user?.userId,
      action: AuditAction.DELETE,
      entityType: "Product",
      entityId: id,
      details: `Product deleted: ${product.name} (Price: $${product.price}, Stock: ${product.stockQuantity})`,
      metadata: {
        productName: product.name,
        price: product.price,
        stockQuantity: product.stockQuantity,
        categoryId: product.categoryId || null,
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const uploadProductImage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const file = req.file;

    if (!file) {
      throw new Error("No file uploaded");
    }

    const product = await prisma.products.findUnique({
      where: { productId: id },
    });

    if (!product) {
      throw new NotFoundError("Product");
    }

    // Delete old image if exists
    if (product.imageUrl) {
      await deleteImage(product.imageUrl);
    }

    // Upload new image
    const imageUrl = await uploadImage(file, "products");

    // Update product
    const updatedProduct = await prisma.products.update({
      where: { productId: id },
      data: { imageUrl },
    });

    // Create audit log with metadata
    await createAuditLog({
      userId: req.user?.userId,
      action: AuditAction.UPDATE,
      entityType: "Product",
      entityId: product.productId,
      details: `Product image uploaded: ${product.name}`,
      metadata: {
        imageUrl: imageUrl,
        previousImageUrl: product.imageUrl || null,
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.json({
      success: true,
      data: updatedProduct,
    });
  } catch (error) {
    next(error);
  }
};
