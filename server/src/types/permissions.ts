import { UserRole } from "@prisma/client";

export type Permission = 
  | "users:read"
  | "users:write"
  | "users:delete"
  | "products:read"
  | "products:write"
  | "products:delete"
  | "inventory:read"
  | "inventory:write"
  | "expenses:read"
  | "expenses:write"
  | "audit:read"
  | "settings:read"
  | "settings:write";

export const rolePermissions: Record<UserRole, Permission[]> = {
  ADMIN: [
    "users:read",
    "users:write",
    "users:delete",
    "products:read",
    "products:write",
    "products:delete",
    "inventory:read",
    "inventory:write",
    "expenses:read",
    "expenses:write",
    "audit:read",
    "settings:read",
    "settings:write",
  ],
  MANAGER: [
    "products:read",
    "products:write",
    "inventory:read",
    "inventory:write",
    "expenses:read",
    "expenses:write",
    "settings:read",
  ],
  EMPLOYEE: [
    "products:read",
    "inventory:read",
    "expenses:read",
  ],
};

export const hasPermission = (role: UserRole, permission: Permission): boolean => {
  return rolePermissions[role]?.includes(permission) ?? false;
};

