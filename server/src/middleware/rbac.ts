import { Response, NextFunction } from "express";
import { UserRole } from "@prisma/client";
import { AuthRequest } from "./auth";
import { AuthorizationError } from "../utils/errors";
import { Permission, hasPermission } from "../types/permissions";

export const requireRole = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AuthorizationError("Authentication required");
    }

    const userRole = req.user.role as UserRole;
    if (!roles.includes(userRole)) {
      throw new AuthorizationError("Insufficient permissions");
    }

    next();
  };
};

export const requirePermission = (permission: Permission) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AuthorizationError("Authentication required");
    }

    const userRole = req.user.role as UserRole;
    if (!hasPermission(userRole, permission)) {
      throw new AuthorizationError(`Permission required: ${permission}`);
    }

    next();
  };
};

