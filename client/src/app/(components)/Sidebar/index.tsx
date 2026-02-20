"use client";

import { useAppDispatch, useAppSelector } from "@/app/redux";
import { setIsSidebarCollapsed } from "@/state";
import {
  Archive,
  CircleDollarSign,
  Clipboard,
  Layout,
  LucideIcon,
  Menu,
  SlidersHorizontal,
  User,
  LogOut,
  FileText,
  Tags,
  TrendingUp,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useState } from "react";
import { getLogoUrl } from "@/utils/images";
import { useAuth } from "@/hooks/useAuth";
import RoleGuard from "@/components/RoleGuard";

interface SidebarLinkProps {
  href: string;
  icon: LucideIcon;
  label: string;
  isCollapsed: boolean;
}

const SidebarLink = ({
  href,
  icon: Icon,
  label,
  isCollapsed,
}: SidebarLinkProps) => {
  const pathname = usePathname();
  const isActive =
    pathname === href || (pathname === "/" && href === "/dashboard");

  return (
    <Link href={href}>
      <div
        className={`cursor-pointer flex items-center ${
          isCollapsed ? "justify-center py-4" : "justify-start px-8 py-4"
        }
        hover:text-blue-500 hover:bg-blue-100 gap-3 transition-colors ${
          isActive ? "bg-blue-200 text-white" : ""
        }
      }`}
      >
        <Icon className="w-6 h-6 !text-gray-700" />

        <span
          className={`${
            isCollapsed ? "hidden" : "block"
          } font-medium text-gray-700`}
        >
          {label}
        </span>
      </div>
    </Link>
  );
};

const LogoutButton = ({ isCollapsed }: { isCollapsed: boolean }) => {
  const { logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isLoggingOut) {
      return;
    }
    
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      // Reset after a delay to prevent rapid clicks
      setTimeout(() => setIsLoggingOut(false), 2000);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoggingOut}
      className={`w-full cursor-pointer flex items-center ${
        isCollapsed ? "justify-center py-4" : "justify-start px-4 py-4"
      } hover:text-red-500 hover:bg-red-50 gap-3 transition-colors rounded-md disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      <LogOut className="w-6 h-6 text-gray-700" />
      {!isCollapsed && (
        <span className="font-medium text-gray-700">
          {isLoggingOut ? "Logging out..." : "Logout"}
        </span>
      )}
    </button>
  );
};

const Sidebar = () => {
  const dispatch = useAppDispatch();
  const isSidebarCollapsed = useAppSelector(
    (state) => state.global.isSidebarCollapsed
  );

  const toggleSidebar = () => {
    dispatch(setIsSidebarCollapsed(!isSidebarCollapsed));
  };

  const sidebarClassNames = `fixed flex flex-col ${
    isSidebarCollapsed ? "w-0 md:w-16" : "w-72 md:w-64"
  } bg-white transition-all duration-300 overflow-hidden h-full shadow-md z-40`;

  return (
    <div className={sidebarClassNames}>
      {/* TOP LOGO */}
      <div
        className={`flex gap-3 justify-between md:justify-normal items-center pt-8 ${
          isSidebarCollapsed ? "px-5" : "px-8"
        }`}
      >
        <Image
          src={getLogoUrl()}
          alt="inventory-management-system-logo"
          width={35}
          height={35}
          className="rounded w-16"
        />
        <h1
          className={`${
            isSidebarCollapsed ? "hidden" : "block"
          } font-extrabold text-2xl`}
        >
          Inventory
        </h1>

        <button
          className="md:hidden px-3 py-3 bg-gray-100 rounded-full hover:bg-blue-100"
          onClick={toggleSidebar}
        >
          <Menu className="w-4 h-4" />
        </button>
      </div>

      {/* LINKS */}
      <div className="flex-grow mt-8">
        <SidebarLink
          href="/dashboard"
          icon={Layout}
          label="Dashboard"
          isCollapsed={isSidebarCollapsed}
        />
        <SidebarLink
          href="/inventory"
          icon={Archive}
          label="Inventory"
          isCollapsed={isSidebarCollapsed}
        />
        <SidebarLink
          href="/stock-movements"
          icon={TrendingUp}
          label="Stock Movements"
          isCollapsed={isSidebarCollapsed}
        />
        <SidebarLink
          href="/products"
          icon={Clipboard}
          label="Products"
          isCollapsed={isSidebarCollapsed}
        />
        <RoleGuard allowedRoles={["ADMIN", "MANAGER"]}>
          <SidebarLink
            href="/categories"
            icon={Tags}
            label="Categories"
            isCollapsed={isSidebarCollapsed}
          />
        </RoleGuard>
        <RoleGuard allowedRoles={["ADMIN", "MANAGER"]}>
          <SidebarLink
            href="/expenses"
            icon={CircleDollarSign}
            label="Expenses"
            isCollapsed={isSidebarCollapsed}
          />
        </RoleGuard>
        <RoleGuard allowedRoles={["ADMIN"]}>
          <SidebarLink
            href="/users"
            icon={User}
            label="Users"
            isCollapsed={isSidebarCollapsed}
          />
          <SidebarLink
            href="/audit-logs"
            icon={FileText}
            label="Audit Logs"
            isCollapsed={isSidebarCollapsed}
          />
        </RoleGuard>
        <SidebarLink
          href="/settings"
          icon={SlidersHorizontal}
          label="Settings"
          isCollapsed={isSidebarCollapsed}
        />
      </div>

      {/* LOGOUT */}
      <div className={`${isSidebarCollapsed ? "px-5" : "px-8"} mb-4`}>
        <LogoutButton isCollapsed={isSidebarCollapsed} />
      </div>

      {/* FOOTER */}
      <div className={`${isSidebarCollapsed ? "hidden" : "block"} mb-10`}>
        <p className="text-center text-xs text-gray-500">&copy; {new Date().getFullYear()} Inventory Management System</p>
      </div>
    </div>
  );
};

export default Sidebar;
