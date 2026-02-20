import { prisma } from "../config/database";

interface SalesSummaryItem {
  salesSummaryId: string;
  totalValue: number;
  changePercentage: number | null;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface PurchaseSummaryItem {
  purchaseSummaryId: string;
  totalPurchased: number;
  changePercentage: number | null;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface ExpenseSummaryItem {
  expenseSummaryId: string;
  totalExpenses: number;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Calculate sales summary from actual Sales data
export const calculateSalesSummary = async (days: number = 30): Promise<SalesSummaryItem[]> => {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - days);

  // Get all sales in the period
  const sales = await prisma.sales.findMany({
    where: {
      timestamp: {
        gte: startDate,
      },
    },
    orderBy: {
      timestamp: "asc",
    },
  });

  // Group sales by date (day)
  const salesByDate = new Map<string, number>();
  
  sales.forEach((sale) => {
    const dateKey = sale.timestamp.toISOString().split("T")[0]; // YYYY-MM-DD
    const currentTotal = salesByDate.get(dateKey) || 0;
    salesByDate.set(dateKey, currentTotal + sale.totalAmount);
  });

  // Convert to array and calculate change percentages
  const summary: SalesSummaryItem[] = [];
  let previousTotal = 0;

  Array.from(salesByDate.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .forEach(([dateStr, totalValue], index) => {
      const date = new Date(dateStr);
      const changePercentage = index > 0 && previousTotal > 0
        ? ((totalValue - previousTotal) / previousTotal) * 100
        : null;

      summary.push({
        salesSummaryId: `sales-${dateStr}`,
        totalValue,
        changePercentage,
        date,
        createdAt: date,
        updatedAt: date,
      });

      previousTotal = totalValue;
    });

  // Return last 30 days
  return summary.slice(-30);
};

// Calculate purchase summary from actual Purchases data
export const calculatePurchaseSummary = async (days: number = 30): Promise<PurchaseSummaryItem[]> => {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - days);

  // Get all purchases in the period
  const purchases = await prisma.purchases.findMany({
    where: {
      timestamp: {
        gte: startDate,
      },
    },
    orderBy: {
      timestamp: "asc",
    },
  });

  // Group purchases by date (day)
  const purchasesByDate = new Map<string, number>();
  
  purchases.forEach((purchase) => {
    const dateKey = purchase.timestamp.toISOString().split("T")[0]; // YYYY-MM-DD
    const currentTotal = purchasesByDate.get(dateKey) || 0;
    purchasesByDate.set(dateKey, currentTotal + purchase.totalCost);
  });

  // Convert to array and calculate change percentages
  const summary: PurchaseSummaryItem[] = [];
  let previousTotal = 0;

  Array.from(purchasesByDate.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .forEach(([dateStr, totalPurchased], index) => {
      const date = new Date(dateStr);
      const changePercentage = index > 0 && previousTotal > 0
        ? ((totalPurchased - previousTotal) / previousTotal) * 100
        : null;

      summary.push({
        purchaseSummaryId: `purchase-${dateStr}`,
        totalPurchased,
        changePercentage,
        date,
        createdAt: date,
        updatedAt: date,
      });

      previousTotal = totalPurchased;
    });

  // Return last 30 days
  return summary.slice(-30);
};

// Calculate expense summary from actual Expenses data
export const calculateExpenseSummary = async (days: number = 30): Promise<ExpenseSummaryItem[]> => {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - days);

  // Get all expenses in the period
  const expenses = await prisma.expenses.findMany({
    where: {
      timestamp: {
        gte: startDate,
      },
    },
    orderBy: {
      timestamp: "asc",
    },
  });

  // Group expenses by date (day)
  const expensesByDate = new Map<string, number>();
  
  expenses.forEach((expense) => {
    const dateKey = expense.timestamp.toISOString().split("T")[0]; // YYYY-MM-DD
    const currentTotal = expensesByDate.get(dateKey) || 0;
    expensesByDate.set(dateKey, currentTotal + expense.amount);
  });

  // Convert to array
  const summary: ExpenseSummaryItem[] = [];

  Array.from(expensesByDate.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .forEach(([dateStr, totalExpenses]) => {
      const date = new Date(dateStr);

      summary.push({
        expenseSummaryId: `expense-${dateStr}`,
        totalExpenses,
        date,
        createdAt: date,
        updatedAt: date,
      });
    });

  // Return last 30 days
  return summary.slice(-30);
};

// Calculate expense by category summary
export const calculateExpenseByCategorySummary = async (days: number = 30) => {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - days);

  // Get all expenses in the period
  const expenses = await prisma.expenses.findMany({
    where: {
      timestamp: {
        gte: startDate,
      },
    },
    orderBy: {
      timestamp: "desc",
    },
  });

  // Group by category and date
  const categoryMap = new Map<string, Map<string, number>>();

  expenses.forEach((expense) => {
    const dateKey = expense.timestamp.toISOString().split("T")[0];
    
    if (!categoryMap.has(expense.category)) {
      categoryMap.set(expense.category, new Map());
    }
    
    const dateMap = categoryMap.get(expense.category)!;
    const currentTotal = dateMap.get(dateKey) || 0;
    dateMap.set(dateKey, currentTotal + expense.amount);
  });

  // Convert to array format
  const result: Array<{
    expenseByCategorySummaryId: string;
    expenseSummaryId: string;
    category: string;
    amount: string;
    date: Date;
    createdAt: Date;
    updatedAt: Date;
  }> = [];

  categoryMap.forEach((dateMap, category) => {
    dateMap.forEach((amount, dateStr) => {
      const date = new Date(dateStr);
      result.push({
        expenseByCategorySummaryId: `expense-cat-${category}-${dateStr}`,
        expenseSummaryId: `expense-${dateStr}`,
        category,
        amount: Math.round(amount).toString(), // Amount in dollars as string
        date,
        createdAt: date,
        updatedAt: date,
      });
    });
  });

  // Sort by date descending and return top 20
  return result
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 20);
};

