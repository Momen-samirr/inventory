import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth";
import { createPurchase, getPurchases } from "../services/purchasesService";
import { validate, createPurchaseSchema } from "../utils/validation";

export const createPurchaseController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new Error("User not authenticated");
    }

    const data = validate(createPurchaseSchema, req.body);
    
    const purchase = await createPurchase({
      ...data,
      userId: req.user.userId,
    });

    res.status(201).json({
      success: true,
      data: purchase,
    });
  } catch (error) {
    next(error);
  }
};

export const getPurchasesController = async (
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

    const result = await getPurchases(filters);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

