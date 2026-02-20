"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLoginMutation } from "@/state/api";
import { useAppDispatch } from "@/app/redux";
import { setCredentials } from "@/state/authSlice";
import toast from "react-hot-toast";
import { LogIn } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [login, { isLoading }] = useLoginMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const getRoleBasedRedirect = (role: string): string => {
    switch (role) {
      case "ADMIN":
        return "/dashboard";
      case "MANAGER":
        return "/dashboard";
      case "EMPLOYEE":
        return "/dashboard";
      default:
        return "/dashboard";
    }
  };

  const onSubmit = async (data: LoginFormData) => {
    try {
      const response = await login(data).unwrap();
      
      // Response should already be transformed by RTK Query transformResponse
      // Expected structure: { token: string, user: User }
      if (!response || !response.token || !response.user) {
        throw new Error("Invalid response format from server");
      }
      
      // Ensure user has a role (required for authSlice)
      if (!response.user.role) {
        throw new Error("User role is missing from server response");
      }
      
      // Dispatch credentials to Redux store
      dispatch(setCredentials({
        token: response.token,
        user: {
          ...response.user,
          role: response.user.role, // TypeScript now knows role is defined
        },
      }));
      
      toast.success("Login successful!");
      
      // Get redirect URL from query params or use role-based redirect
      const searchParams = new URLSearchParams(window.location.search);
      const redirectTo = searchParams.get("redirect") || getRoleBasedRedirect(response.user.role);
      
      // Use window.location for a hard redirect to ensure state is properly updated
      window.location.href = redirectTo;
    } catch (error: any) {
      const errorMessage = 
        error?.data?.error?.message || 
        error?.data?.message || 
        error?.message || 
        "Login failed. Please check your credentials.";
      toast.error(errorMessage);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <div className="bg-blue-500 p-3 rounded-full">
              <LogIn className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                {...register("email")}
                type="email"
                autoComplete="email"
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                {...register("password")}
                type="password"
                autoComplete="current-password"
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

