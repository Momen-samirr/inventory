"use client";

import { useState } from "react";
import { useGetAuditLogsQuery, useGetUsersQuery } from "@/state/api";
import Header from "@/app/(components)/Header";
import SearchBar from "@/components/SearchBar";
import Pagination from "@/components/Pagination";
import { AuditLog } from "@/state/api";

const actionColors: Record<string, string> = {
  CREATE: "bg-green-100 text-green-800",
  UPDATE: "bg-blue-100 text-blue-800",
  DELETE: "bg-red-100 text-red-800",
  LOGIN: "bg-purple-100 text-purple-800",
  LOGOUT: "bg-gray-100 text-gray-800",
  STOCK_ADJUSTMENT: "bg-orange-100 text-orange-800",
};

const AuditLogs = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedAction, setSelectedAction] = useState<string>("");
  const [selectedEntityType, setSelectedEntityType] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);

  const {
    data: auditLogsResponse,
    isLoading,
    isError,
    refetch,
  } = useGetAuditLogsQuery({
    search: searchTerm || undefined,
    userId: selectedUserId || undefined,
    action: selectedAction || undefined,
    entityType: selectedEntityType || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    limit,
    offset: (page - 1) * limit,
  });

  const { data: usersResponse } = useGetUsersQuery({ limit: 1000 });

  const auditLogs = auditLogsResponse?.data?.logs || [];
  const total = auditLogsResponse?.data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  const hasActiveFilters =
    selectedUserId || selectedAction || selectedEntityType || startDate || endDate;

  const clearFilters = () => {
    setSelectedUserId("");
    setSelectedAction("");
    setSelectedEntityType("");
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

  const getActionBadgeClass = (action: string) => {
    return actionColors[action] || "bg-gray-100 text-gray-800";
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <Header name="Audit Logs" />
        <div className="mt-8 flex justify-center">
          <div className="text-gray-500">Loading audit logs...</div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8">
        <Header name="Audit Logs" />
        <div className="mt-8 text-center text-red-500">
          Failed to load audit logs. Please try again.
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-5">
        <Header name="Audit Logs" />
        <p className="text-sm text-gray-500">
          Track and monitor all system activities and user actions.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {/* Search */}
          <div className="lg:col-span-3">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search by user, action, entity type, or details..."
            />
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

          {/* Action Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Action
            </label>
            <select
              value={selectedAction}
              onChange={(e) => {
                setSelectedAction(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="">All Actions</option>
              <option value="CREATE">Create</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
              <option value="LOGIN">Login</option>
              <option value="LOGOUT">Logout</option>
              <option value="STOCK_ADJUSTMENT">Stock Adjustment</option>
            </select>
          </div>

          {/* Entity Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Entity Type
            </label>
            <select
              value={selectedEntityType}
              onChange={(e) => {
                setSelectedEntityType(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="">All Types</option>
              <option value="User">User</option>
              <option value="Product">Product</option>
              <option value="Category">Category</option>
              <option value="Inventory">Inventory</option>
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
        Showing {auditLogs.length} of {total} audit logs
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Entity Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IP Address
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No audit logs found
                  </td>
                </tr>
              ) : (
                auditLogs.map((log: AuditLog) => (
                  <tr key={log.auditLogId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {log.user ? (
                          <>
                            <div>{log.user.name}</div>
                            <div className="text-xs text-gray-500">{log.user.email}</div>
                          </>
                        ) : (
                          <span className="text-gray-400">System</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActionBadgeClass(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.entityType}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-md">
                      <div className="truncate" title={log.details}>
                        {log.details || "—"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.ipAddress || "—"}
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

export default AuditLogs;

