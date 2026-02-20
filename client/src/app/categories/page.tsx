"use client";

import { useState } from "react";
import { useGetCategoriesQuery, useCreateCategoryMutation, useUpdateCategoryMutation, useDeleteCategoryMutation } from "@/state/api";
import Header from "@/app/(components)/Header";
import { DataGrid, GridColDef, GridActionsCellItem } from "@mui/x-data-grid";
import { PlusCircleIcon, PencilIcon, TrashIcon } from "lucide-react";
import CategoryModal from "./CategoryModal";
import toast from "react-hot-toast";
import LoadingSpinner from "@/components/LoadingSpinner";
import RoleGuard from "@/components/RoleGuard";
import { useAuth } from "@/hooks/useAuth";

interface Category {
  categoryId: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    products: number;
  };
}

const columns: GridColDef[] = [
  { field: "name", headerName: "Name", width: 200, flex: 1 },
  { field: "description", headerName: "Description", width: 300, flex: 1 },
  {
    field: "productCount",
    headerName: "Products",
    width: 120,
    valueGetter: (value, row: Category) => row._count?.products || 0,
  },
  {
    field: "createdAt",
    headerName: "Created",
    width: 150,
    valueGetter: (value, row: Category) => new Date(row.createdAt).toLocaleDateString(),
  },
];

const Categories = () => {
  const { isManager } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const { data: categories, isLoading, isError, refetch } = useGetCategoriesQuery();
  const [createCategory] = useCreateCategoryMutation();
  const [updateCategory] = useUpdateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();

  const handleCreate = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleDelete = async (categoryId: string, categoryName: string) => {
    if (!confirm(`Are you sure you want to delete "${categoryName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteCategory(categoryId).unwrap();
      toast.success("Category deleted successfully");
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.error?.message || "Failed to delete category");
    }
  };

  const handleSubmit = async (data: { name: string; description?: string }) => {
    try {
      if (editingCategory) {
        await updateCategory({ id: editingCategory.categoryId, data }).unwrap();
        toast.success("Category updated successfully");
      } else {
        await createCategory(data).unwrap();
        toast.success("Category created successfully");
      }
      setIsModalOpen(false);
      setEditingCategory(null);
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.error?.message || `Failed to ${editingCategory ? "update" : "create"} category`);
    }
  };

  if (isLoading) {
    return (
      <div className="py-4 flex justify-center">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (isError || !categories) {
    return (
      <div className="text-center text-red-500 py-4">
        Failed to fetch categories
      </div>
    );
  }

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
          onClick={() => handleDelete(params.row.categoryId, params.row.name)}
          showInMenu={false}
        />,
      ],
    },
  ];

  return (
    <RoleGuard allowedRoles={["ADMIN", "MANAGER"]}>
      <div className="flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <Header name="Categories" />
          <button
            className="flex items-center bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            onClick={handleCreate}
          >
            <PlusCircleIcon className="w-5 h-5 mr-2" /> Create Category
          </button>
        </div>
        <DataGrid
          rows={categories}
          columns={actionColumns}
          getRowId={(row) => row.categoryId}
          checkboxSelection={false}
          className="bg-white shadow rounded-lg border border-gray-200 !text-gray-700"
          autoHeight
        />
        <CategoryModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingCategory(null);
          }}
          onSubmit={handleSubmit}
          category={editingCategory}
        />
      </div>
    </RoleGuard>
  );
};

export default Categories;

