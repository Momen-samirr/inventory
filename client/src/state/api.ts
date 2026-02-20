import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAuthHeaders } from "@/lib/auth";
import { RootState } from "@/app/redux";

export interface Category {
  categoryId: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    products: number;
  };
}

export interface Product {
  productId: string;
  name: string;
  description?: string;
  price: number;
  rating?: number;
  stockQuantity: number;
  imageUrl?: string;
  categoryId?: string;
  category?: Category;
  createdAt?: string;
  updatedAt?: string;
}

export interface NewProduct {
  name: string;
  description?: string;
  price: number;
  rating?: number;
  stockQuantity: number;
  categoryId?: string;
  imageUrl?: string;
}

export interface SalesSummary {
  salesSummaryId: string;
  totalValue: number;
  changePercentage?: number;
  date: string;
}

export interface PurchaseSummary {
  purchaseSummaryId: string;
  totalPurchased: number;
  changePercentage?: number;
  date: string;
}

export interface ExpenseSummary {
  expenseSummarId: string;
  totalExpenses: number;
  date: string;
}

export interface ExpenseByCategorySummary {
  expenseByCategorySummaryId: string;
  category: string;
  amount: string;
  date: string;
}

export interface DashboardMetrics {
  popularProducts: Product[];
  salesSummary: SalesSummary[];
  purchaseSummary: PurchaseSummary[];
  expenseSummary: ExpenseSummary[];
  expenseByCategorySummary: ExpenseByCategorySummary[];
}

export interface User {
  userId: string;
  name: string;
  email: string;
  role?: "ADMIN" | "MANAGER" | "EMPLOYEE";
  isActive?: boolean;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: "ADMIN" | "MANAGER" | "EMPLOYEE";
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface StockMovement {
  movementId: string;
  productId: string;
  userId: string;
  movementType: "SALE" | "PURCHASE" | "ADJUSTMENT" | "RETURN";
  quantity: number;
  previousStock: number;
  newStock: number;
  reason?: string;
  createdAt: string;
  product?: {
    productId: string;
    name: string;
  };
  user?: {
    userId: string;
    name: string;
    email: string;
  };
}

export interface AuditLog {
  auditLogId: string;
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  user?: {
    userId: string;
    name: string;
    email: string;
  };
}

// Validate API base URL
const getApiBaseUrl = (): string => {
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  
  // In production, require the API URL to be set
  if (process.env.NODE_ENV === "production" && !apiUrl) {
    console.error(
      "NEXT_PUBLIC_API_BASE_URL is required in production. Please set it in your environment variables."
    );
    throw new Error("API base URL is not configured");
  }
  
  // Development fallback
  return apiUrl || "http://localhost:8000/api";
};

const baseUrl = getApiBaseUrl();

export const api = createApi({
  baseQuery: fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers, { getState, endpoint }) => {
      const state = getState() as RootState;
      const token = state.auth.token || getAuthHeaders().Authorization?.replace("Bearer ", "");
      
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }
      
      // Don't set Content-Type for FormData - let browser set it with boundary
      // RTK Query will handle this automatically, but we ensure it's not overridden
      return headers;
    },
  }),
  reducerPath: "api",
  tagTypes: ["DashboardMetrics", "Products", "Users", "Expenses", "Inventory", "AuditLogs", "Categories", "Auth"],
  endpoints: (build) => ({
    // Auth endpoints
    login: build.mutation<AuthResponse, LoginCredentials>({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
      transformResponse: (response: any): AuthResponse => {
        // Handle backend response structure: { success: true, data: { token, user } }
        console.log("Raw login response:", response); // Debug log
        if (response && response.success && response.data) {
          return response.data;
        }
        // Fallback: if response is already in the correct format
        if (response && response.token && response.user) {
          return response;
        }
        throw new Error("Invalid response format from server");
      },
    }),
    register: build.mutation<AuthResponse, RegisterData>({
      query: (data) => ({
        url: "/auth/register",
        method: "POST",
        body: data,
      }),
    }),
    getMe: build.query<User, void>({
      query: () => "/auth/me",
      providesTags: ["Users"],
      transformResponse: (response: { success: boolean; data: User }): User => {
        if (response.success && response.data) {
          return response.data;
        }
        return response as any;
      },
    }),
    
    // Dashboard
    getDashboardMetrics: build.query<{ data: DashboardMetrics }, void>({
      query: () => "/dashboard",
      providesTags: ["DashboardMetrics"],
    }),
    
    // Products
    getProducts: build.query<
      { data: Product[]; pagination?: { page: number; limit: number; total: number; totalPages: number } },
      {
        search?: string;
        categoryId?: string;
        stockStatus?: "inStock" | "lowStock" | "outOfStock";
        minPrice?: number;
        maxPrice?: number;
        sortBy?: "name" | "price" | "stock" | "createdAt";
        sortOrder?: "asc" | "desc";
        page?: number;
        limit?: number;
      } | void
    >({
      query: (params) => ({
        url: "/products",
        params: params || {},
      }),
      providesTags: ["Products"],
      transformResponse: (response: {
        success: boolean;
        data: Product[];
        pagination?: { page: number; limit: number; total: number; totalPages: number };
      }): { data: Product[]; pagination?: { page: number; limit: number; total: number; totalPages: number } } => {
        if (response.success && response.data) {
          return {
            data: response.data,
            pagination: response.pagination,
          };
        }
        return response as any;
      },
    }),
    getProduct: build.query<{ data: Product }, string>({
      query: (id) => `/products/${id}`,
      providesTags: ["Products"],
    }),
    createProduct: build.mutation<{ data: Product }, NewProduct>({
      query: (newProduct) => ({
        url: "/products",
        method: "POST",
        body: newProduct,
      }),
      invalidatesTags: ["Products"],
    }),
    updateProduct: build.mutation<{ data: Product }, { id: string; data: Partial<NewProduct> }>({
      query: ({ id, data }) => ({
        url: `/products/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Products"],
    }),
    deleteProduct: build.mutation<void, string>({
      query: (id) => ({
        url: `/products/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Products"],
    }),
    uploadProductImage: build.mutation<{ data: Product }, { id: string; file: File }>({
      query: ({ id, file }) => {
        const formData = new FormData();
        formData.append("image", file);
        return {
          url: `/products/${id}/image`,
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: ["Products"],
    }),
    
    // Users
    getUsers: build.query<
      { data: User[]; pagination?: { page: number; limit: number; total: number; totalPages: number } },
      {
        search?: string;
        role?: "ADMIN" | "MANAGER" | "EMPLOYEE";
        isActive?: boolean;
        sortBy?: "name" | "email" | "createdAt";
        sortOrder?: "asc" | "desc";
        page?: number;
        limit?: number;
      } | void
    >({
      query: (params) => ({
        url: "/users",
        params: params
          ? {
              ...params,
              isActive: params.isActive !== undefined ? String(params.isActive) : undefined,
            }
          : {},
      }),
      providesTags: ["Users"],
      transformResponse: (response: {
        success: boolean;
        data: User[];
        pagination?: { page: number; limit: number; total: number; totalPages: number };
      }): { data: User[]; pagination?: { page: number; limit: number; total: number; totalPages: number } } => {
        if (response.success && response.data) {
          return {
            data: response.data,
            pagination: response.pagination,
          };
        }
        return response as any;
      },
    }),
    getUser: build.query<{ data: User }, string>({
      query: (id) => `/users/${id}`,
      providesTags: ["Users"],
    }),
    updateUser: build.mutation<{ data: User }, { id: string; data: Partial<User> }>({
      query: ({ id, data }) => ({
        url: `/users/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Users"],
    }),
    deleteUser: build.mutation<void, string>({
      query: (id) => ({
        url: `/users/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Users"],
    }),
    createUser: build.mutation<User, { name: string; email: string; password: string; role?: "ADMIN" | "MANAGER" | "EMPLOYEE"; isActive?: boolean }>({
      query: (userData) => ({
        url: "/users",
        method: "POST",
        body: userData,
      }),
      invalidatesTags: ["Users"],
      transformResponse: (response: { success: boolean; data: User }): User => {
        if (response.success && response.data) {
          return response.data;
        }
        return response as any;
      },
    }),
    uploadUserImage: build.mutation<{ data: User }, { id: string; file: File }>({
      query: ({ id, file }) => {
        const formData = new FormData();
        formData.append("image", file);
        return {
          url: `/users/${id}/image`,
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: ["Users"],
      transformResponse: (response: { success: boolean; data: User }): { data: User } => {
        if (response.success && response.data) {
          return { data: response.data };
        }
        return response as any;
      },
    }),
    
    // Categories
    getCategories: build.query<Category[], void>({
      query: () => "/categories",
      providesTags: ["Categories"],
      transformResponse: (response: { success: boolean; data: Category[] }): Category[] => {
        if (response.success && response.data) {
          return response.data;
        }
        return response as any;
      },
    }),
    getCategory: build.query<Category, string>({
      query: (id) => `/categories/${id}`,
      providesTags: ["Categories"],
      transformResponse: (response: { success: boolean; data: Category }): Category => {
        if (response.success && response.data) {
          return response.data;
        }
        return response as any;
      },
    }),
    createCategory: build.mutation<Category, { name: string; description?: string }>({
      query: (categoryData) => ({
        url: "/categories",
        method: "POST",
        body: categoryData,
      }),
      invalidatesTags: ["Categories"],
      transformResponse: (response: { success: boolean; data: Category }): Category => {
        if (response.success && response.data) {
          return response.data;
        }
        return response as any;
      },
    }),
    updateCategory: build.mutation<Category, { id: string; data: { name?: string; description?: string } }>({
      query: ({ id, data }) => ({
        url: `/categories/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Categories"],
      transformResponse: (response: { success: boolean; data: Category }): Category => {
        if (response.success && response.data) {
          return response.data;
        }
        return response as any;
      },
    }),
    deleteCategory: build.mutation<void, string>({
      query: (id) => ({
        url: `/categories/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Categories"],
    }),
    
    // Expenses
    getExpensesByCategory: build.query<{ data: ExpenseByCategorySummary[] }, void>({
      query: () => "/expenses",
      providesTags: ["Expenses"],
    }),
    
    // Inventory
    getStockMovements: build.query<
      { data: { movements: StockMovement[]; total: number } },
      { productId?: string; userId?: string; movementType?: string; limit?: number; offset?: number }
    >({
      query: (params) => ({
        url: "/inventory/movements",
        params,
      }),
      providesTags: ["Inventory"],
    }),
    adjustStock: build.mutation<
      { data: { product: Product; movement: StockMovement } },
      { productId: string; quantity: number; movementType: "ADJUSTMENT" | "RETURN"; reason?: string }
    >({
      query: (data) => ({
        url: "/inventory/adjust",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Inventory", "Products"],
    }),
    getLowStock: build.query<{ data: Product[] }, { threshold?: number } | void>({
      query: (params) => ({
        url: "/inventory/low-stock",
        params: params || {},
      }),
      providesTags: ["Inventory"],
    }),
    
    // Audit Logs
    getAuditLogs: build.query<
      { data: { logs: AuditLog[]; total: number; limit: number; offset: number } },
      { userId?: string; action?: string; entityType?: string; search?: string; startDate?: string; endDate?: string; limit?: number; offset?: number }
    >({
      query: (params) => ({
        url: "/audit-logs",
        params: {
          ...params,
          // Remove undefined values
          ...(params.userId && { userId: params.userId }),
          ...(params.action && { action: params.action }),
          ...(params.entityType && { entityType: params.entityType }),
          ...(params.search && { search: params.search }),
          ...(params.startDate && { startDate: params.startDate }),
          ...(params.endDate && { endDate: params.endDate }),
          limit: params.limit || 50,
          offset: params.offset || 0,
        },
      }),
      providesTags: ["AuditLogs"],
    }),
    // Logout
    logout: build.mutation<{ success: boolean; message: string }, void>({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetMeQuery,
  useGetDashboardMetricsQuery,
  useGetProductsQuery,
  useGetProductQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useUploadProductImageMutation,
  useGetUsersQuery,
  useGetUserQuery,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useCreateUserMutation,
  useUploadUserImageMutation,
  useGetCategoriesQuery,
  useGetCategoryQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useGetExpensesByCategoryQuery,
  useGetStockMovementsQuery,
  useAdjustStockMutation,
  useGetLowStockQuery,
  useGetAuditLogsQuery,
  useLogoutMutation,
} = api;

