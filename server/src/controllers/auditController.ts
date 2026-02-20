import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth";
import { getAuditLogs } from "../services/auditService";
import { AuditAction } from "@prisma/client";

export const getAuditLogsController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      userId,
      action,
      entityType,
      search,
      startDate,
      endDate,
      limit,
      offset,
    } = req.query;

    const filters: any = {
      limit: limit ? parseInt(limit as string) : 50,
      offset: offset ? parseInt(offset as string) : 0,
    };

    if (userId) filters.userId = userId as string;
    if (action) filters.action = action as AuditAction;
    if (entityType) filters.entityType = entityType as string;
    if (search) filters.search = search as string;
    if (startDate) {
      const start = new Date(startDate as string);
      if (!isNaN(start.getTime())) {
        filters.startDate = start;
      }
    }
    if (endDate) {
      const end = new Date(endDate as string);
      if (!isNaN(end.getTime())) {
        filters.endDate = end;
      }
    }

    const result = await getAuditLogs(filters);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

