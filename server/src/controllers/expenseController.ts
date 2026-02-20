import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth";
import { prisma } from "../config/database";

export const getExpensesByCategory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const expenseByCategorySummaryRaw = await prisma.expenseByCategory.findMany(
      {
        orderBy: {
          date: "desc",
        },
      }
    );
    const expenseByCategorySummary = expenseByCategorySummaryRaw.map(
      (item) => ({
        ...item,
        amount: item.amount.toString(),
      })
    );

    res.json({
      success: true,
      data: expenseByCategorySummary,
    });
  } catch (error) {
    next(error);
  }
};
