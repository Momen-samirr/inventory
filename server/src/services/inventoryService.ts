import { prisma } from "../config/database";
import { StockMovementType } from "@prisma/client";
import { NotFoundError, ValidationError } from "../utils/errors";
import { createAuditLog } from "./auditService";
import { AuditAction } from "@prisma/client";

export interface StockAdjustmentData {
  productId: string;
  quantity: number;
  movementType: StockMovementType;
  reason?: string;
  userId: string;
}

export const adjustStock = async (data: StockAdjustmentData) => {
  const { productId, quantity, movementType, reason, userId } = data;

  // Get current product
  const product = await prisma.products.findUnique({
    where: { productId },
  });

  if (!product) {
    throw new NotFoundError("Product");
  }

  const previousStock = product.stockQuantity;
  let newStock: number;

  // Calculate new stock based on movement type
  if (movementType === StockMovementType.ADJUSTMENT) {
    newStock = quantity; // Direct adjustment
  } else if (movementType === StockMovementType.RETURN) {
    newStock = previousStock + quantity; // Add returned items
  } else {
    throw new ValidationError("Invalid movement type for stock adjustment");
  }

  // Prevent negative stock
  if (newStock < 0) {
    throw new ValidationError("Stock quantity cannot be negative");
  }

  // Update product stock
  const updatedProduct = await prisma.products.update({
    where: { productId },
    data: { stockQuantity: newStock },
  });

  // Create stock movement record
  const stockMovement = await prisma.stockMovement.create({
    data: {
      productId,
      userId,
      movementType,
      quantity: movementType === StockMovementType.ADJUSTMENT 
        ? newStock - previousStock 
        : quantity,
      previousStock,
      newStock,
      reason,
    },
  });

  // Create audit log with metadata
  await createAuditLog({
    userId,
    action: AuditAction.STOCK_ADJUSTMENT,
    entityType: "Product",
    entityId: productId,
    details: `Stock adjusted for ${product.name}: ${previousStock} → ${newStock} (${movementType})${reason ? `. Reason: ${reason}` : ""}`,
    metadata: {
      productName: product.name,
      previousStock,
      newStock,
      quantityChange: newStock - previousStock,
      movementType,
      reason: reason || null,
    },
  });

  return {
    product: updatedProduct,
    movement: stockMovement,
  };
};

export const getStockMovements = async (
  filters: {
    productId?: string;
    userId?: string;
    movementType?: StockMovementType;
    limit?: number;
    offset?: number;
  }
) => {
  const where: any = {};

  if (filters.productId) {
    where.productId = filters.productId;
  }

  if (filters.userId) {
    where.userId = filters.userId;
  }

  if (filters.movementType) {
    where.movementType = filters.movementType;
  }

  const [movements, total] = await Promise.all([
    prisma.stockMovement.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: filters.limit || 50,
      skip: filters.offset || 0,
      include: {
        product: {
          select: {
            productId: true,
            name: true,
          },
        },
        user: {
          select: {
            userId: true,
            name: true,
            email: true,
          },
        },
      },
    }),
    prisma.stockMovement.count({ where }),
  ]);

  return {
    movements,
    total,
    limit: filters.limit || 50,
    offset: filters.offset || 0,
  };
};

export const getLowStockProducts = async (threshold: number = 10) => {
  const products = await prisma.products.findMany({
    where: {
      stockQuantity: {
        lte: threshold,
      },
    },
    orderBy: {
      stockQuantity: "asc",
    },
  });

  return products;
};

