"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Header from "@/app/(components)/Header";
import ImageUpload from "@/components/ImageUpload";
import { useCreateProductMutation, useUploadProductImageMutation, useGetCategoriesQuery } from "@/state/api";
import toast from "react-hot-toast";
import LoadingSpinner from "@/components/LoadingSpinner";

const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  price: z.number().positive("Price must be positive"),
  rating: z.number().min(0).max(5).optional(),
  stockQuantity: z.number().int().min(0, "Stock quantity cannot be negative"),
  categoryId: z.string().uuid("Invalid category").optional().or(z.literal("")),
});

type ProductFormData = z.infer<typeof productSchema>;

type CreateProductModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const CreateProductModal = ({ isOpen, onClose }: CreateProductModalProps) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();
  const [uploadImage] = useUploadProductImageMutation();
  const { data: categories, isLoading: isLoadingCategories } = useGetCategoriesQuery();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      price: 0,
      stockQuantity: 0,
      rating: 0,
    },
  });

  const onSubmit = async (data: ProductFormData) => {
    try {
      // Prepare product data, converting empty string to undefined for categoryId
      const productData = {
        ...data,
        categoryId: data.categoryId === "" ? undefined : data.categoryId,
      };
      
      // Create product
      const result = await createProduct(productData).unwrap();

      // Upload image if provided
      if (imageFile && result.data.productId) {
        await uploadImage({
          id: result.data.productId,
          file: imageFile,
        }).unwrap();
      }

      toast.success("Product created successfully!");
      reset();
      setImageFile(null);
      onClose();
    } catch (error: any) {
      toast.error(error?.data?.error?.message || "Failed to create product");
    }
  };

  if (!isOpen) return null;

  const labelCssStyles = "block text-sm font-medium text-gray-700";
  const inputCssStyles =
    "block w-full mb-2 p-2 border-gray-300 border-2 rounded-md focus:ring-blue-500 focus:border-blue-500";

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-20">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <Header name="Create New Product" />
        <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4">
          {/* PRODUCT NAME */}
          <div>
            <label htmlFor="name" className={labelCssStyles}>
              Product Name *
            </label>
            <input
              {...register("name")}
              type="text"
              placeholder="Product name"
              className={inputCssStyles}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* DESCRIPTION */}
          <div>
            <label htmlFor="description" className={labelCssStyles}>
              Description
            </label>
            <textarea
              {...register("description")}
              placeholder="Product description"
              className={inputCssStyles}
              rows={3}
            />
          </div>

          {/* PRICE */}
          <div>
            <label htmlFor="price" className={labelCssStyles}>
              Price *
            </label>
            <input
              {...register("price", { valueAsNumber: true })}
              type="number"
              step="0.01"
              placeholder="0.00"
              className={inputCssStyles}
            />
            {errors.price && (
              <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
            )}
          </div>

          {/* STOCK QUANTITY */}
          <div>
            <label htmlFor="stockQuantity" className={labelCssStyles}>
              Stock Quantity *
            </label>
            <input
              {...register("stockQuantity", { valueAsNumber: true })}
              type="number"
              placeholder="0"
              className={inputCssStyles}
            />
            {errors.stockQuantity && (
              <p className="mt-1 text-sm text-red-600">{errors.stockQuantity.message}</p>
            )}
          </div>

          {/* CATEGORY */}
          <div>
            <label htmlFor="categoryId" className={labelCssStyles}>
              Category
            </label>
            {isLoadingCategories ? (
              <div className="p-2">
                <LoadingSpinner size="sm" />
              </div>
            ) : (
              <select
                {...register("categoryId")}
                className={inputCssStyles}
              >
                <option value="">No Category</option>
                {categories?.map((category) => (
                  <option key={category.categoryId} value={category.categoryId}>
                    {category.name}
                  </option>
                ))}
              </select>
            )}
            {errors.categoryId && (
              <p className="mt-1 text-sm text-red-600">{errors.categoryId.message}</p>
            )}
          </div>

          {/* RATING */}
          <div>
            <label htmlFor="rating" className={labelCssStyles}>
              Rating (0-5)
            </label>
            <input
              {...register("rating", { valueAsNumber: true })}
              type="number"
              min="0"
              max="5"
              step="0.1"
              placeholder="0"
              className={inputCssStyles}
            />
            {errors.rating && (
              <p className="mt-1 text-sm text-red-600">{errors.rating.message}</p>
            )}
          </div>

          {/* IMAGE UPLOAD */}
          <ImageUpload
            currentImageUrl={undefined}
            onImageSelect={setImageFile}
            label="Product Image"
          />

          {/* ACTIONS */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={isCreating}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? "Creating..." : "Create Product"}
            </button>
            <button
              onClick={onClose}
              type="button"
              className="flex-1 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProductModal;
