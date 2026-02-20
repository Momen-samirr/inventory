import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth";
import { prisma } from "../config/database";
import { calculateDashboardStatistics } from "../services/dashboardService";
import {
  calculateSalesSummary,
  calculatePurchaseSummary,
  calculateExpenseSummary,
  calculateExpenseByCategorySummary,
} from "../services/summaryService";

export const getDashboardMetrics = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const popularProducts = await prisma.products.findMany({
      take: 15,
      orderBy: {
        stockQuantity: "desc",
      },
      select: {
        productId: true,
        name: true,
        description: true,
        price: true,
        rating: true,
        stockQuantity: true,
        imageUrl: true,
        categoryId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Calculate summaries from actual data instead of empty summary tables
    const salesSummary = await calculateSalesSummary(30);
    const purchaseSummary = await calculatePurchaseSummary(30);
    const expenseSummary = await calculateExpenseSummary(30);
    const expenseByCategorySummary = await calculateExpenseByCategorySummary(30);

    // Calculate real statistics
    const statistics = await calculateDashboardStatistics();

    res.json({
      success: true,
      data: {
        popularProducts,
        salesSummary: salesSummary.slice(-5), // Return last 5 for display
        purchaseSummary: purchaseSummary.slice(-5), // Return last 5 for display
        expenseSummary: expenseSummary.slice(-5), // Return last 5 for display
        expenseByCategorySummary: expenseByCategorySummary.slice(0, 5), // Return top 5
        statistics,
      },
    });
  } catch (error) {
    next(error);
  }
};
