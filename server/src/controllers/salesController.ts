import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth";
import { createSale, getSales } from "../services/salesService";
import { validate, createSaleSchema } from "../utils/validation";

export const createSaleController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new Error("User not authenticated");
    }

    const data = validate(createSaleSchema, req.body);
    
    const sale = await createSale({
      ...data,
      userId: req.user.userId,
    });

    res.status(201).json({
      success: true,
      data: sale,
    });
  } catch (error) {
    next(error);
  }
};

export const getSalesController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { productId, userId, startDate, endDate, limit, offset } = req.query;

    const filters: any = {
      limit: limit ? parseInt(limit as string) : 50,
      offset: offset ? parseInt(offset as string) : 0,
    };

    if (productId) filters.productId = productId as string;
    if (userId) filters.userId = userId as string;
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

    const result = await getSales(filters);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

