"use client";

import {
  CheckCircle,
  Package,
  Tag,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import CardExpenseSummary from "./CardExpenseSummary";
import CardPopularProducts from "./CardPopularProducts";
import CardPurchaseSummary from "./CardPurchaseSummary";
import CardSalesSummary from "./CardSalesSummary";
import StatCard from "./StatCard";
import { useGetDashboardMetricsQuery } from "@/state/api";
import LoadingSpinner from "@/components/LoadingSpinner";

const Dashboard = () => {
  const { data: response, isLoading } = useGetDashboardMetricsQuery();
  const statistics = response?.data?.statistics;

  // Calculate date range for display (last 30 days)
  const getDateRange = () => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    return `${startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${endDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
  };

  if (isLoading) {
    return (
      <div className="py-4 flex justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 xl:overflow-auto gap-10 pb-4 custom-grid-rows">
      <CardPopularProducts />
      <CardSalesSummary />
      <CardPurchaseSummary />
      <CardExpenseSummary />
      {statistics && (
        <>
          <StatCard
            title="Customer & Expenses"
            primaryIcon={<Package className="text-blue-600 w-6 h-6" />}
            dateRange={getDateRange()}
            details={[
              {
                title: "Customer Growth",
                amount: statistics.customerGrowth.current.toString(),
                changePercentage: Math.round(statistics.customerGrowth.changePercentage),
                IconComponent: statistics.customerGrowth.changePercentage >= 0 ? TrendingUp : TrendingDown,
              },
              {
                title: "Expenses",
                amount: `$${statistics.expensesStats.total.toFixed(2)}`,
                changePercentage: Math.round(statistics.expensesStats.changePercentage),
                IconComponent: statistics.expensesStats.changePercentage >= 0 ? TrendingUp : TrendingDown,
              },
            ]}
          />
          <StatCard
            title="Inventory & Stock"
            primaryIcon={<CheckCircle className="text-blue-600 w-6 h-6" />}
            dateRange={getDateRange()}
            details={[
              {
                title: "Total Products",
                amount: statistics.totalProducts.toString(),
                changePercentage: 0,
                IconComponent: TrendingUp,
              },
              {
                title: "Low Stock Items",
                amount: statistics.lowStockProducts.toString(),
                changePercentage: 0,
                IconComponent: statistics.lowStockProducts > 0 ? TrendingDown : TrendingUp,
              },
            ]}
          />
          <StatCard
            title="Sales & Revenue"
            primaryIcon={<Tag className="text-blue-600 w-6 h-6" />}
            dateRange={getDateRange()}
            details={[
              {
                title: "Sales",
                amount: `$${statistics.salesStats.total.toFixed(2)}`,
                changePercentage: Math.round(statistics.salesStats.changePercentage),
                IconComponent: statistics.salesStats.changePercentage >= 0 ? TrendingUp : TrendingDown,
              },
              {
                title: "Inventory Value",
                amount: `$${statistics.totalInventoryValue.toFixed(2)}`,
                changePercentage: 0,
                IconComponent: TrendingUp,
              },
            ]}
          />
        </>
      )}
    </div>
  );
};

export default Dashboard;
