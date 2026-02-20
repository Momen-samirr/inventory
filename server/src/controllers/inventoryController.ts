import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth";
import { adjustStock, getStockMovements, getLowStockProducts } from "../services/inventoryService";
import { validate, stockAdjustmentSchema } from "../utils/validation";

export const adjustStockController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new Error("User not authenticated");
    }

    const validatedData = validate(stockAdjustmentSchema, req.body);
    
    const data = {
      ...validatedData,
      userId: req.user.userId,
    };

    const result = await adjustStock(data);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getStockMovementsController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { productId, userId, movementType, limit, offset } = req.query;

    const result = await getStockMovements({
      productId: productId as string,
      userId: userId as string,
      movementType: movementType as any,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getLowStockController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const threshold = req.query.threshold 
      ? parseInt(req.query.threshold as string) 
      : 10;

    const products = await getLowStockProducts(threshold);

    res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

