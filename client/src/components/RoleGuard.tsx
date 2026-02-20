"use client";

import { ReactNode } from "react";
import { useAppSelector } from "@/app/redux";

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: ("ADMIN" | "MANAGER" | "EMPLOYEE")[];
  fallback?: ReactNode;
}

export default function RoleGuard({ children, allowedRoles, fallback = null }: RoleGuardProps) {
  const { user } = useAppSelector((state) => state.auth);

  if (!user || !allowedRoles.includes(user.role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

