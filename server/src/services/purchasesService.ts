import { prisma } from "../config/database";
import { NotFoundError, ValidationError } from "../utils/errors";
import { StockMovementType } from "@prisma/client";
import { createAuditLog } from "./auditService";
import { AuditAction } from "@prisma/client";

export interface CreatePurchaseData {
  productId: string;
  userId?: string;
  quantity: number;
  unitCost: number;
}

export const createPurchase = async (data: CreatePurchaseData) => {
  const { productId, userId, quantity, unitCost } = data;

  if (quantity <= 0) {
    throw new ValidationError("Quantity must be greater than 0");
  }

  if (unitCost <= 0) {
    throw new ValidationError("Unit cost must be greater than 0");
  }

  // Get product
  const product = await prisma.products.findUnique({
    where: { productId },
  });

  if (!product) {
    throw new NotFoundError("Product");
  }

  const totalCost = quantity * unitCost;
  const previousStock = product.stockQuantity;
  const newStock = previousStock + quantity;

  // Create purchase transaction
  const purchase = await prisma.purchases.create({
    data: {
      productId,
      userId: userId || null,
      quantity,
      unitCost,
      totalCost,
    },
  });

  // Update product stock
  await prisma.products.update({
    where: { productId },
    data: { stockQuantity: newStock },
  });

  // Create stock movement - need a valid userId
  // If no userId provided, get a system/admin user
  let systemUserId = userId;
  if (!systemUserId) {
    const adminUser = await prisma.users.findFirst({
      where: { role: "ADMIN" },
      select: { userId: true },
    });
    systemUserId = adminUser?.userId || "";
  }

  if (systemUserId) {
    await prisma.stockMovement.create({
      data: {
        productId,
        userId: systemUserId,
        movementType: StockMovementType.PURCHASE,
        quantity,
        previousStock,
        newStock,
        reason: `Purchase: ${purchase.purchaseId}`,
      },
    });
  }

  // Create audit log
  await createAuditLog({
    userId: userId,
    action: AuditAction.CREATE,
    entityType: "Purchase",
    entityId: purchase.purchaseId,
    details: `Purchase created: ${product.name} x${quantity} @ $${unitCost} = $${totalCost}`,
    metadata: {
      productName: product.name,
      quantity,
      unitCost,
      totalCost,
      previousStock,
      newStock,
    },
  });

  return purchase;
};

export const getPurchases = async (filters: {
  productId?: string;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) => {
  const where: any = {};

  if (filters.productId) {
    where.productId = filters.productId;
  }

  if (filters.userId) {
    where.userId = filters.userId;
  }

  if (filters.startDate || filters.endDate) {
    where.timestamp = {};
    if (filters.startDate) {
      where.timestamp.gte = filters.startDate;
    }
    if (filters.endDate) {
      where.timestamp.lte = filters.endDate;
    }
  }

  const [purchases, total] = await Promise.all([
    prisma.purchases.findMany({
      where,
      orderBy: { timestamp: "desc" },
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
    prisma.purchases.count({ where }),
  ]);

  return {
    purchases,
    total,
    limit: filters.limit || 50,
    offset: filters.offset || 0,
  };
};

