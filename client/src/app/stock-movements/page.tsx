"use client";

import { useState } from "react";
import { useGetStockMovementsQuery, useGetUsersQuery, useGetProductsQuery } from "@/state/api";
import Header from "@/app/(components)/Header";
import SearchBar from "@/components/SearchBar";
import Pagination from "@/components/Pagination";
import { StockMovement } from "@/state/api";

const movementTypeColors: Record<string, string> = {
  SALE: "bg-red-100 text-red-800",
  PURCHASE: "bg-green-100 text-green-800",
  ADJUSTMENT: "bg-blue-100 text-blue-800",
  RETURN: "bg-purple-100 text-purple-800",
};

const StockMovements = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedMovementType, setSelectedMovementType] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);

  const {
    data: stockMovementsResponse,
    isLoading,
    isError,
  } = useGetStockMovementsQuery({
    productId: selectedProductId || undefined,
    userId: selectedUserId || undefined,
    movementType: selectedMovementType || undefined,
    limit,
    offset: (page - 1) * limit,
  });

  const { data: usersResponse } = useGetUsersQuery({ limit: 1000 });
  const { data: productsResponse } = useGetProductsQuery({ limit: 1000 });

  const stockMovements = stockMovementsResponse?.data?.movements || [];
  const total = stockMovementsResponse?.data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  const hasActiveFilters =
    selectedProductId || selectedUserId || selectedMovementType || startDate || endDate;

  const clearFilters = () => {
    setSelectedProductId("");
    setSelectedUserId("");
    setSelectedMovementType("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const month = months[date.getMonth()];
      const day = date.getDate().toString().padStart(2, "0");
      const year = date.getFullYear();
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      const seconds = date.getSeconds().toString().padStart(2, "0");
      return `${month} ${day}, ${year} ${hours}:${minutes}:${seconds}`;
    } catch {
      return dateString;
    }
  };

  const getMovementTypeBadgeClass = (type: string) => {
    return movementTypeColors[type] || "bg-gray-100 text-gray-800";
  };

  const getQuantityDisplay = (movement: StockMovement) => {
    const isNegative = movement.quantity < 0 || movement.movementType === "SALE";
    const absQuantity = Math.abs(movement.quantity);
    return (
      <span className={isNegative ? "text-red-600 font-semibold" : "text-green-600 font-semibold"}>
        {isNegative ? "-" : "+"}{absQuantity}
      </span>
    );
  };

  // Filter by date range client-side (since backend doesn't support it yet)
  const filteredMovements = stockMovements.filter((movement: StockMovement) => {
    if (startDate || endDate) {
      const movementDate = new Date(movement.createdAt);
      if (startDate && movementDate < new Date(startDate)) return false;
      if (endDate && movementDate > new Date(endDate)) return false;
    }
    return true;
  });

  if (isLoading) {
    return (
      <div className="p-8">
        <Header name="Stock Movements" />
        <div className="mt-8 flex justify-center">
          <div className="text-gray-500">Loading stock movements...</div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8">
        <Header name="Stock Movements" />
        <div className="mt-8 text-center text-red-500">
          Failed to load stock movements. Please try again.
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-5">
        <Header name="Stock Movements" />
        <p className="text-sm text-gray-500">
          Track all inventory stock movements including sales, purchases, adjustments, and returns.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {/* Product Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => {
                setSelectedProductId(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="">All Products</option>
              {productsResponse?.data?.map((product) => (
                <option key={product.productId} value={product.productId}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>

          {/* User Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              User
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => {
                setSelectedUserId(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="">All Users</option>
              {usersResponse?.data?.map((user) => (
                <option key={user.userId} value={user.userId}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
          </div>

          {/* Movement Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Movement Type
            </label>
            <select
              value={selectedMovementType}
              onChange={(e) => {
                setSelectedMovementType(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="">All Types</option>
              <option value="SALE">Sale</option>
              <option value="PURCHASE">Purchase</option>
              <option value="ADJUSTMENT">Adjustment</option>
              <option value="RETURN">Return</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4 text-sm text-gray-600">
        Showing {filteredMovements.length} of {total} stock movements
      </div>

      {/* Stock Movements Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Previous Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  New Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    No stock movements found
                  </td>
                </tr>
              ) : (
                filteredMovements.map((movement: StockMovement) => (
                  <tr key={movement.movementId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {movement.product?.name || "Unknown Product"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getMovementTypeBadgeClass(
                          movement.movementType
                        )}`}
                      >
                        {movement.movementType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {getQuantityDisplay(movement)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {movement.previousStock}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                      {movement.newStock}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                      <div className="truncate" title={movement.reason}>
                        {movement.reason || "—"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {movement.user ? (
                          <>
                            <div>{movement.user.name}</div>
                            <div className="text-xs text-gray-500">{movement.user.email}</div>
                          </>
                        ) : (
                          <span className="text-gray-400">System</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(movement.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          limit={limit}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
          }}
        />
      )}
    </div>
  );
};

export default StockMovements;

