"use client";

import { useState } from "react";
import { useGetUsersQuery, useCreateUserMutation, useUpdateUserMutation, useDeleteUserMutation } from "@/state/api";
import Header from "@/app/(components)/Header";
import { DataGrid, GridColDef, GridActionsCellItem } from "@mui/x-data-grid";
import { PlusCircleIcon, PencilIcon, TrashIcon, Filter, X } from "lucide-react";
import CreateUserModal from "./CreateUserModal";
import EditUserModal from "./EditUserModal";
import toast from "react-hot-toast";
import LoadingSpinner from "@/components/LoadingSpinner";
import RoleGuard from "@/components/RoleGuard";
import { useAuth } from "@/hooks/useAuth";
import SearchBar from "@/components/SearchBar";

interface User {
  userId: string;
  name: string;
  email: string;
  role: "ADMIN" | "MANAGER" | "EMPLOYEE";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const Users = () => {
  const { isAdmin } = useAuth();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [role, setRole] = useState<"ADMIN" | "MANAGER" | "EMPLOYEE" | "">("");
  const [isActive, setIsActive] = useState<boolean | undefined>(undefined);
  const [sortBy, setSortBy] = useState<"name" | "email" | "createdAt">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [showFilters, setShowFilters] = useState(false);

  const {
    data: usersResponse,
    isError,
    isLoading,
    refetch,
  } = useGetUsersQuery({
    search: searchTerm || undefined,
    role: role || undefined,
    isActive,
    sortBy,
    sortOrder,
    page,
    limit,
  });

  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();

  const users = usersResponse?.data || [];
  const pagination = usersResponse?.pagination;

  const hasActiveFilters = role || isActive !== undefined || sortBy !== "createdAt" || sortOrder !== "desc";

  const clearFilters = () => {
    setRole("");
    setIsActive(undefined);
    setSortBy("createdAt");
    setSortOrder("desc");
    setPage(1);
  };

  const handleCreate = () => {
    setIsCreateModalOpen(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteUser(userId).unwrap();
      toast.success("User deleted successfully");
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.error?.message || "Failed to delete user");
    }
  };

  const handleCreateSubmit = async (data: {
    name: string;
    email: string;
    password: string;
    role: "ADMIN" | "MANAGER" | "EMPLOYEE";
    isActive: boolean;
  }) => {
    try {
      await createUser(data).unwrap();
      toast.success("User created successfully");
      setIsCreateModalOpen(false);
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.error?.message || "Failed to create user");
      throw error;
    }
  };

  const handleEditSubmit = async (data: {
    name: string;
    email: string;
    password?: string;
    role: "ADMIN" | "MANAGER" | "EMPLOYEE";
    isActive: boolean;
  }) => {
    if (!editingUser) return;

    try {
      const updateData: any = {
        name: data.name,
        email: data.email,
        role: data.role,
        isActive: data.isActive,
      };

      if (data.password && data.password.trim() !== "") {
        updateData.password = data.password;
      }

      await updateUser({ id: editingUser.userId, data: updateData }).unwrap();
      toast.success("User updated successfully");
      setIsEditModalOpen(false);
      setEditingUser(null);
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.error?.message || "Failed to update user");
      throw error;
    }
  };

  const columns: GridColDef[] = [
    { field: "name", headerName: "Name", width: 200, flex: 1 },
    { field: "email", headerName: "Email", width: 250, flex: 1 },
    {
      field: "role",
      headerName: "Role",
      width: 120,
      valueGetter: (value, row: User) => row.role,
    },
    {
      field: "isActive",
      headerName: "Status",
      width: 100,
      valueGetter: (value, row: User) => (row.isActive ? "Active" : "Inactive"),
      cellClassName: (params) => (params.value === "Active" ? "text-green-600" : "text-red-600"),
    },
    {
      field: "createdAt",
      headerName: "Created",
      width: 150,
      valueGetter: (value, row: User) => new Date(row.createdAt).toLocaleDateString(),
    },
  ];

  const actionColumns: GridColDef[] = [
    ...columns,
    {
      field: "actions",
      type: "actions",
      headerName: "Actions",
      width: 100,
      getActions: (params) => [
        <GridActionsCellItem
          key="edit"
          icon={<PencilIcon className="w-4 h-4" />}
          label="Edit"
          onClick={() => handleEdit(params.row)}
          showInMenu={false}
        />,
        <GridActionsCellItem
          key="delete"
          icon={<TrashIcon className="w-4 h-4" />}
          label="Delete"
          onClick={() => handleDelete(params.row.userId, params.row.name)}
          showInMenu={false}
        />,
      ],
    },
  ];

  if (isLoading) {
    return (
      <div className="py-4 flex justify-center">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center text-red-500 py-4">Failed to fetch users</div>
    );
  }

  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <div className="flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <Header name="Users" />
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center px-4 py-2 border rounded-lg ${
                showFilters || hasActiveFilters
                  ? "bg-blue-500 text-white border-blue-500"
                  : "bg-white text-gray-700 border-gray-300"
              }`}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {hasActiveFilters && (
                <span className="ml-2 bg-white text-blue-500 rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  !
                </span>
              )}
            </button>
            <button
              className="flex items-center bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              onClick={handleCreate}
            >
              <PlusCircleIcon className="w-5 h-5 mr-2" /> Create User
            </button>
          </div>
        </div>

        {/* SEARCH BAR */}
        <div className="mb-4">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search users by name or email..."
          />
        </div>

        {/* FILTER PANEL */}
        {showFilters && (
          <div className="mb-4 bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-700">Filters</h3>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-500 hover:text-blue-700 flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  Clear All
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Role Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={role}
                  onChange={(e) => {
                    setRole(e.target.value as any);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="">All Roles</option>
                  <option value="ADMIN">Admin</option>
                  <option value="MANAGER">Manager</option>
                  <option value="EMPLOYEE">Employee</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={isActive === undefined ? "" : isActive ? "true" : "false"}
                  onChange={(e) => {
                    const value = e.target.value;
                    setIsActive(value === "" ? undefined : value === "true");
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="">All</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value as any);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="createdAt">Date Created</option>
                  <option value="name">Name</option>
                  <option value="email">Email</option>
                </select>
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Order
                </label>
                <select
                  value={sortOrder}
                  onChange={(e) => {
                    setSortOrder(e.target.value as any);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* RESULTS COUNT */}
        {pagination && (
          <div className="mb-4 text-sm text-gray-600">
            Showing {users.length} of {pagination.total} users
          </div>
        )}

        <DataGrid
          rows={users}
          columns={actionColumns}
          getRowId={(row) => row.userId}
          checkboxSelection={false}
          className="bg-white shadow rounded-lg border border-gray-200 !text-gray-700"
          autoHeight
          paginationMode="server"
          rowCount={pagination?.total || users.length}
          paginationModel={{
            page: page - 1,
            pageSize: limit,
          }}
          onPaginationModelChange={(model) => {
            setPage(model.page + 1);
            setLimit(model.pageSize);
          }}
          pageSizeOptions={[10, 20, 50, 100]}
        />
        <CreateUserModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateSubmit}
          isLoading={isCreating}
        />
        <EditUserModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingUser(null);
          }}
          onSubmit={handleEditSubmit}
          user={editingUser}
          isLoading={isUpdating}
        />
      </div>
    </RoleGuard>
  );
};

export default Users;
