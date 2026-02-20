"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Header from "@/app/(components)/Header";
import toast from "react-hot-toast";

const categorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface Category {
  categoryId: string;
  name: string;
  description?: string;
}

type CategoryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CategoryFormData) => Promise<void>;
  category?: Category | null;
};

const CategoryModal = ({ isOpen, onClose, onSubmit, category }: CategoryModalProps) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  useEffect(() => {
    if (category) {
      reset({
        name: category.name,
        description: category.description || "",
      });
    } else {
      reset({
        name: "",
        description: "",
      });
    }
  }, [category, reset]);

  if (!isOpen) return null;

  const labelCssStyles = "block text-sm font-medium text-gray-700";
  const inputCssStyles =
    "block w-full mb-2 p-2 border-gray-300 border-2 rounded-md focus:ring-blue-500 focus:border-blue-500";

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-20">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
        <Header name={category ? "Edit Category" : "Create New Category"} />
        <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4">
          <div>
            <label htmlFor="name" className={labelCssStyles}>
              Category Name *
            </label>
            <input
              {...register("name")}
              type="text"
              placeholder="Category name"
              className={inputCssStyles}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className={labelCssStyles}>
              Description
            </label>
            <textarea
              {...register("description")}
              placeholder="Category description"
              className={inputCssStyles}
              rows={3}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Saving..." : category ? "Update" : "Create"}
            </button>
            <button
              onClick={onClose}
              type="button"
              className="flex-1 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-700"
              disabled={isSubmitting}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryModal;

