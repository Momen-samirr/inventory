import { prisma } from "../config/database";
import { NotFoundError, ValidationError } from "../utils/errors";
import { StockMovementType } from "@prisma/client";
import { createAuditLog } from "./auditService";
import { AuditAction } from "@prisma/client";

export interface CreateSaleData {
  productId: string;
  userId?: string;
  quantity: number;
  unitPrice: number;
}

export const createSale = async (data: CreateSaleData) => {
  const { productId, userId, quantity, unitPrice } = data;

  if (quantity <= 0) {
    throw new ValidationError("Quantity must be greater than 0");
  }

  if (unitPrice <= 0) {
    throw new ValidationError("Unit price must be greater than 0");
  }

  // Get product
  const product = await prisma.products.findUnique({
    where: { productId },
  });

  if (!product) {
    throw new NotFoundError("Product");
  }

  // Check stock availability
  if (product.stockQuantity < quantity) {
    throw new ValidationError(`Insufficient stock. Available: ${product.stockQuantity}, Requested: ${quantity}`);
  }

  const totalAmount = quantity * unitPrice;
  const previousStock = product.stockQuantity;
  const newStock = previousStock - quantity;

  // Create sale transaction
  const sale = await prisma.sales.create({
    data: {
      productId,
      userId: userId || null,
      quantity,
      unitPrice,
      totalAmount,
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
        movementType: StockMovementType.SALE,
        quantity: -quantity, // Negative for outbound
        previousStock,
        newStock,
        reason: `Sale: ${sale.saleId}`,
      },
    });
  }

  // Create audit log
  await createAuditLog({
    userId: userId,
    action: AuditAction.CREATE,
    entityType: "Sale",
    entityId: sale.saleId,
    details: `Sale created: ${product.name} x${quantity} @ $${unitPrice} = $${totalAmount}`,
    metadata: {
      productName: product.name,
      quantity,
      unitPrice,
      totalAmount,
      previousStock,
      newStock,
    },
  });

  return sale;
};

export const getSales = async (filters: {
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

  const [sales, total] = await Promise.all([
    prisma.sales.findMany({
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
    prisma.sales.count({ where }),
  ]);

  return {
    sales,
    total,
    limit: filters.limit || 50,
    offset: filters.offset || 0,
  };
};

