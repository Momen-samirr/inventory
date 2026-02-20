"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Navbar from "@/app/(components)/Navbar";
import Sidebar from "@/app/(components)/Sidebar";
import StoreProvider, { useAppSelector } from "./redux";
import { useAuth } from "@/hooks/useAuth";
import LoadingSpinner from "@/components/LoadingSpinner";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuth();
  const isSidebarCollapsed = useAppSelector(
    (state) => state.global.isSidebarCollapsed
  );
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.add("light");
    }
  });

  // Redirect to login if not authenticated (except on auth pages)
  useEffect(() => {
    // Check both Redux state and localStorage token
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const shouldRedirect = !isAuthenticated && !token && !pathname.startsWith("/auth");
    
    if (shouldRedirect) {
      const redirectUrl = `/auth/login?redirect=${encodeURIComponent(pathname)}`;
      router.push(redirectUrl);
    }
  }, [isAuthenticated, pathname, router]);

  // Show loading while checking auth (give it a moment to initialize)
  const [isCheckingAuth, setIsCheckingAuth] = React.useState(true);
  
  React.useEffect(() => {
    // Check if token exists in localStorage
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    // Small delay to allow Redux to rehydrate
    setTimeout(() => setIsCheckingAuth(false), 100);
  }, []);

  if (isCheckingAuth && !pathname.startsWith("/auth")) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  // Don't show sidebar/navbar on auth pages
  if (pathname.startsWith("/auth")) {
    return <>{children}</>;
  }

  return (
    <div
      className={`${
        isDarkMode ? "dark" : "light"
      } flex bg-gray-50 text-gray-900 w-full min-h-screen`}
    >
      <Sidebar />
      <main
        className={`flex flex-col w-full h-full py-7 px-9 bg-gray-50 ${
          isSidebarCollapsed ? "md:pl-24" : "md:pl-72"
        }`}
      >
        <Navbar />
        {children}
      </main>
    </div>
  );
};

const DashboardWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <StoreProvider>
      <DashboardLayout>{children}</DashboardLayout>
    </StoreProvider>
  );
};

export default DashboardWrapper;
