"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Header from "@/app/(components)/Header";
import toast from "react-hot-toast";
import LoadingSpinner from "@/components/LoadingSpinner";

const userSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["ADMIN", "MANAGER", "EMPLOYEE"]).default("EMPLOYEE"),
  isActive: z.boolean().default(true),
});

type UserFormData = z.infer<typeof userSchema>;

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UserFormData) => Promise<void>;
  isLoading?: boolean;
}

const CreateUserModal = ({ isOpen, onClose, onSubmit, isLoading }: CreateUserModalProps) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      role: "EMPLOYEE",
      isActive: true,
    },
  });

  useEffect(() => {
    if (!isOpen) {
      reset({
        name: "",
        email: "",
        password: "",
        role: "EMPLOYEE",
        isActive: true,
      });
    }
  }, [isOpen, reset]);

  if (!isOpen) return null;

  const labelCssStyles = "block text-sm font-medium text-gray-700";
  const inputCssStyles =
    "block w-full mb-2 p-2 border-gray-300 border-2 rounded-md focus:ring-blue-500 focus:border-blue-500";

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-20">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
        <Header name="Create New User" />
        <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4">
          <div>
            <label htmlFor="name" className={labelCssStyles}>
              Name *
            </label>
            <input
              {...register("name")}
              type="text"
              placeholder="Full name"
              className={inputCssStyles}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className={labelCssStyles}>
              Email *
            </label>
            <input
              {...register("email")}
              type="email"
              placeholder="email@example.com"
              className={inputCssStyles}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className={labelCssStyles}>
              Password *
            </label>
            <input
              {...register("password")}
              type="password"
              placeholder="Minimum 6 characters"
              className={inputCssStyles}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="role" className={labelCssStyles}>
              Role *
            </label>
            <select
              {...register("role")}
              className={inputCssStyles}
            >
              <option value="EMPLOYEE">Employee</option>
              <option value="MANAGER">Manager</option>
              <option value="ADMIN">Admin</option>
            </select>
            {errors.role && (
              <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
            )}
          </div>

          <div className="flex items-center">
            <input
              {...register("isActive")}
              type="checkbox"
              id="isActive"
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="isActive" className="ml-2 text-sm font-medium text-gray-700">
              Active
            </label>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? <LoadingSpinner size="sm" /> : "Create User"}
            </button>
            <button
              onClick={onClose}
              type="button"
              className="flex-1 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-700"
              disabled={isLoading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUserModal;

