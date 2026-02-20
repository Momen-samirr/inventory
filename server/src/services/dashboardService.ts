import { prisma } from "../config/database";

const LOW_STOCK_THRESHOLD = 10;

export interface DashboardStatistics {
  totalProducts: number;
  totalInventoryValue: number;
  totalUsers: number;
  lowStockProducts: number;
  totalSalesValue: number;
  totalPurchasesValue: number;
  recentActivityCount: number;
  customerGrowth: {
    current: number;
    previous: number;
    changePercentage: number;
  };
  salesStats: {
    total: number;
    changePercentage: number;
  };
  expensesStats: {
    total: number;
    changePercentage: number;
  };
}

export const calculateDashboardStatistics = async (): Promise<DashboardStatistics> => {
  // Total products count
  const totalProducts = await prisma.products.count();

  // Total inventory value (sum of price * stockQuantity)
  const inventoryValueResult = await prisma.products.aggregate({
    _sum: {
      stockQuantity: true,
    },
  });

  const productsWithValue = await prisma.products.findMany({
    select: {
      price: true,
      stockQuantity: true,
    },
  });

  const totalInventoryValue = productsWithValue.reduce(
    (sum, product) => sum + product.price * product.stockQuantity,
    0
  );

  // Total users count
  const totalUsers = await prisma.users.count();

  // Low stock products count
  const lowStockProducts = await prisma.products.count({
    where: {
      stockQuantity: {
        lte: LOW_STOCK_THRESHOLD,
        gt: 0,
      },
    },
  });

  // Total sales value
  const salesAggregate = await prisma.sales.aggregate({
    _sum: {
      totalAmount: true,
    },
  });
  const totalSalesValue = salesAggregate._sum.totalAmount || 0;

  // Total purchases value
  const purchasesAggregate = await prisma.purchases.aggregate({
    _sum: {
      totalCost: true,
    },
  });
  const totalPurchasesValue = purchasesAggregate._sum.totalCost || 0;

  // Recent activity count (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentActivityCount = await prisma.auditLog.count({
    where: {
      createdAt: {
        gte: sevenDaysAgo,
      },
    },
  });

  // Customer growth (users created in last 30 days vs previous 30 days)
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sixtyDaysAgo = new Date(now);
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const currentPeriodUsers = await prisma.users.count({
    where: {
      createdAt: {
        gte: thirtyDaysAgo,
      },
    },
  });

  const previousPeriodUsers = await prisma.users.count({
    where: {
      createdAt: {
        gte: sixtyDaysAgo,
        lt: thirtyDaysAgo,
      },
    },
  });

  const customerGrowthChangePercentage =
    previousPeriodUsers > 0
      ? ((currentPeriodUsers - previousPeriodUsers) / previousPeriodUsers) * 100
      : currentPeriodUsers > 0
      ? 100
      : 0;

  // Sales stats (last 30 days vs previous 30 days)
  const currentPeriodSales = await prisma.sales.aggregate({
    where: {
      timestamp: {
        gte: thirtyDaysAgo,
      },
    },
    _sum: {
      totalAmount: true,
    },
  });

  const previousPeriodSales = await prisma.sales.aggregate({
    where: {
      timestamp: {
        gte: sixtyDaysAgo,
        lt: thirtyDaysAgo,
      },
    },
    _sum: {
      totalAmount: true,
    },
  });

  const currentSalesTotal = currentPeriodSales._sum.totalAmount || 0;
  const previousSalesTotal = previousPeriodSales._sum.totalAmount || 0;
  const salesChangePercentage =
    previousSalesTotal > 0
      ? ((currentSalesTotal - previousSalesTotal) / previousSalesTotal) * 100
      : currentSalesTotal > 0
      ? 100
      : 0;

  // Expenses stats (last 30 days vs previous 30 days)
  const currentPeriodExpenses = await prisma.expenses.aggregate({
    where: {
      timestamp: {
        gte: thirtyDaysAgo,
      },
    },
    _sum: {
      amount: true,
    },
  });

  const previousPeriodExpenses = await prisma.expenses.aggregate({
    where: {
      timestamp: {
        gte: sixtyDaysAgo,
        lt: thirtyDaysAgo,
      },
    },
    _sum: {
      amount: true,
    },
  });

  const currentExpensesTotal = currentPeriodExpenses._sum.amount || 0;
  const previousExpensesTotal = previousPeriodExpenses._sum.amount || 0;
  const expensesChangePercentage =
    previousExpensesTotal > 0
      ? ((currentExpensesTotal - previousExpensesTotal) / previousExpensesTotal) * 100
      : currentExpensesTotal > 0
      ? 100
      : 0;

  return {
    totalProducts,
    totalInventoryValue,
    totalUsers,
    lowStockProducts,
    totalSalesValue,
    totalPurchasesValue,
    recentActivityCount,
    customerGrowth: {
      current: currentPeriodUsers,
      previous: previousPeriodUsers,
      changePercentage: customerGrowthChangePercentage,
    },
    salesStats: {
      total: currentSalesTotal,
      changePercentage: salesChangePercentage,
    },
    expensesStats: {
      total: currentExpensesTotal,
      changePercentage: expensesChangePercentage,
    },
  };
};

