"use client";

import { useAppSelector, useAppDispatch } from "@/app/redux";
import { logout, setCredentials } from "@/state/authSlice";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
import { getToken } from "@/lib/auth";
import { useGetMeQuery, useLogoutMutation } from "@/state/api";

export function useAuth() {
  const { user, isAuthenticated, token } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [isInitialized, setIsInitialized] = useState(false);
  const isLoggingOut = useRef(false);
  
  // Get token from localStorage
  const localStorageToken = getToken();
  
  // Fetch user data - always refetch when tags are invalidated
  const { data: userData, error: userError, refetch: refetchUser } = useGetMeQuery(undefined, {
    skip: !localStorageToken || !isInitialized,
  });

  const [logoutMutation] = useLogoutMutation();
  const handleLogoutRef = useRef<(() => Promise<void>) | null>(null);

  // Memoize handleLogout to prevent recreation on every render
  const handleLogout = useCallback(async () => {
    // Prevent multiple simultaneous logout calls
    if (isLoggingOut.current) {
      console.log("Logout already in progress, skipping...");
      return;
    }
    
    isLoggingOut.current = true;
    console.log("Starting logout process...");
    
    try {
      // Call logout endpoint to log the action
      const token = getToken();
      if (token) {
        await logoutMutation().unwrap();
      }
    } catch (error) {
      // Ignore errors - logout should always succeed
      console.error("Logout error:", error);
    } finally {
      // Clear state first
      dispatch(logout());
      // Reset flag after a short delay to ensure state is cleared
      setTimeout(() => {
        isLoggingOut.current = false;
      }, 1000);
      router.push("/auth/login");
      router.refresh();
    }
  }, [logoutMutation, dispatch, router]);

  // Store latest handleLogout in ref for use in useEffect
  useEffect(() => {
    handleLogoutRef.current = handleLogout;
  }, [handleLogout]);

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined" && !isInitialized) {
      const storedToken = getToken();
      if (storedToken && !isAuthenticated) {
        // Token exists but user not in state - fetch user data
        setIsInitialized(true);
      } else {
        setIsInitialized(true);
      }
    }
  }, [isAuthenticated, isInitialized]);

  // Update user data when fetched or when userData changes
  useEffect(() => {
    if (userData && userData.role) {
      // Always update if userData is available (handles updates after image upload)
      // Ensure role is defined before setting credentials
      dispatch(setCredentials({ 
        user: {
          ...userData,
          role: userData.role, // TypeScript now knows role is defined
        }, 
        token: localStorageToken || "" 
      }));
    }
  }, [userData, localStorageToken, dispatch]);

  // Handle auth errors - only logout if we have a token but got an error
  useEffect(() => {
    if (userError && localStorageToken && !isLoggingOut.current && handleLogoutRef.current) {
      // Token is invalid, logout
      console.error("Auth error:", userError);
      handleLogoutRef.current();
    }
  }, [userError, localStorageToken]);

  return {
    user,
    isAuthenticated: isAuthenticated || !!localStorageToken,
    token: token || localStorageToken,
    logout: handleLogout,
    isAdmin: user?.role === "ADMIN",
    isManager: user?.role === "MANAGER" || user?.role === "ADMIN",
    isEmployee: user?.role === "EMPLOYEE",
    isLoading: !isInitialized,
  };
}

