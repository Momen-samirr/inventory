"use client";

import { useGetProductsQuery, useGetCategoriesQuery } from "@/state/api";
import { PlusCircleIcon, Filter, X } from "lucide-react";
import { useState } from "react";
import Header from "@/app/(components)/Header";
import Rating from "@/app/(components)/Rating";
import CreateProductModal from "./CreateProductModal";
import Image from "next/image";
import { getProductImageUrl } from "@/utils/images";
import LoadingSpinner from "@/components/LoadingSpinner";
import RoleGuard from "@/components/RoleGuard";
import { useAppSelector } from "@/app/redux";
import SearchBar from "@/components/SearchBar";
import Pagination from "@/components/Pagination";

const Products = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [stockStatus, setStockStatus] = useState<"inStock" | "lowStock" | "outOfStock" | "">("");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [sortBy, setSortBy] = useState<"name" | "price" | "stock" | "createdAt">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [showFilters, setShowFilters] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useAppSelector((state) => state.auth);

  const { data: categoriesResponse } = useGetCategoriesQuery();
  const categories = categoriesResponse || [];

  const {
    data: response,
    isLoading,
    isError,
  } = useGetProductsQuery({
    search: searchTerm || undefined,
    categoryId: categoryId || undefined,
    stockStatus: stockStatus || undefined,
    minPrice: minPrice ? parseFloat(minPrice) : undefined,
    maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
    sortBy,
    sortOrder,
    page,
    limit,
  });

  const products = response?.data || [];
  const pagination = response?.pagination;

  const hasActiveFilters =
    categoryId || stockStatus || minPrice || maxPrice || sortBy !== "createdAt" || sortOrder !== "desc";

  const clearFilters = () => {
    setCategoryId("");
    setStockStatus("");
    setMinPrice("");
    setMaxPrice("");
    setSortBy("createdAt");
    setSortOrder("desc");
    setPage(1);
  };

  if (isLoading) {
    return (
      <div className="py-4">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center text-red-500 py-4">
        Failed to fetch products
      </div>
    );
  }

  return (
    <div className="mx-auto pb-5 w-full">
      {/* HEADER BAR */}
      <div className="flex justify-between items-center mb-6">
        <Header name="Products" />
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
          <RoleGuard allowedRoles={["ADMIN", "MANAGER"]}>
            <button
              className="flex items-center bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              onClick={() => setIsModalOpen(true)}
            >
              <PlusCircleIcon className="w-5 h-5 mr-2" /> Create Product
            </button>
          </RoleGuard>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="mb-6">
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search products by name, description, or SKU..."
        />
      </div>

      {/* FILTER PANEL */}
      {showFilters && (
        <div className="mb-6 bg-white border border-gray-200 rounded-lg p-4">
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
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.categoryId} value={category.categoryId}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Stock Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock Status
              </label>
              <select
                value={stockStatus}
                onChange={(e) => {
                  setStockStatus(e.target.value as any);
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="">All</option>
                <option value="inStock">In Stock</option>
                <option value="lowStock">Low Stock</option>
                <option value="outOfStock">Out of Stock</option>
              </select>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Price
              </label>
              <input
                type="number"
                value={minPrice}
                onChange={(e) => {
                  setMinPrice(e.target.value);
                  setPage(1);
                }}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Price
              </label>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => {
                  setMaxPrice(e.target.value);
                  setPage(1);
                }}
                placeholder="9999.99"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
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
                <option value="price">Price</option>
                <option value="stock">Stock Quantity</option>
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
          Showing {products.length} of {pagination.total} products
        </div>
      )}

      {/* BODY PRODUCTS LIST */}
      {products.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No products found
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div
                key={product.productId}
                className="border shadow rounded-md p-4 hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-col items-center">
                  <Image
                    src={product.imageUrl || getProductImageUrl(product.productId)}
                    alt={product.name}
                    width={150}
                    height={150}
                    className="mb-3 rounded-2xl w-36 h-36 object-cover"
                  />
                  <h3 className="text-lg text-gray-900 font-semibold">
                    {product.name}
                  </h3>
                  {product.description && (
                    <p className="text-sm text-gray-600 mt-1 text-center">
                      {product.description}
                    </p>
                  )}
                  <p className="text-gray-800 font-bold mt-2">
                    ${product.price.toFixed(2)}
                  </p>
                  <div className="text-sm text-gray-600 mt-1">
                    Stock: {product.stockQuantity}
                  </div>
                  {product.category && (
                    <div className="text-xs text-blue-600 mt-1">
                      {product.category.name}
                    </div>
                  )}
                  {product.rating && (
                    <div className="flex items-center mt-2">
                      <Rating rating={product.rating} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* PAGINATION */}
          {pagination && pagination.totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={pagination.totalPages}
              onPageChange={setPage}
              limit={limit}
              onLimitChange={(newLimit) => {
                setLimit(newLimit);
                setPage(1);
              }}
            />
          )}
        </>
      )}

      {/* MODAL */}
      <RoleGuard allowedRoles={["ADMIN", "MANAGER"]}>
        <CreateProductModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </RoleGuard>
    </div>
  );
};

export default Products;
