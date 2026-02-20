import { prisma } from "../config/database";
import { AuditAction } from "@prisma/client";

export interface AuditLogData {
  userId?: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  details?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export const createAuditLog = async (data: AuditLogData) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        details: data.details,
        metadata: data.metadata || undefined,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
  } catch (error) {
    // Don't throw error if audit logging fails - it shouldn't break the main operation
    console.error("Failed to create audit log:", error);
  }
};

export const getAuditLogs = async (
  filters: {
    userId?: string;
    action?: AuditAction;
    entityType?: string;
    search?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }
) => {
  const where: any = {};

  if (filters.userId) {
    where.userId = filters.userId;
  }

  if (filters.action) {
    where.action = filters.action;
  }

  if (filters.entityType) {
    where.entityType = filters.entityType;
  }

  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) {
      where.createdAt.gte = filters.startDate;
    }
    if (filters.endDate) {
      where.createdAt.lte = filters.endDate;
    }
  }

  // Search functionality - search in details, entityType, and user name/email
  if (filters.search) {
    where.OR = [
      { details: { contains: filters.search, mode: "insensitive" } },
      { entityType: { contains: filters.search, mode: "insensitive" } },
      {
        user: {
          OR: [
            { name: { contains: filters.search, mode: "insensitive" } },
            { email: { contains: filters.search, mode: "insensitive" } },
          ],
        },
      },
    ];
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: filters.limit || 50,
      skip: filters.offset || 0,
      include: {
        user: {
          select: {
            userId: true,
            name: true,
            email: true,
          },
        },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    logs,
    total,
    limit: filters.limit || 50,
    offset: filters.offset || 0,
  };
};

