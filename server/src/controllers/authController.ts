import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth";
import { login, register, getCurrentUser } from "../services/authService";
import { validate, loginSchema, registerSchema } from "../utils/validation";
import { createAuditLog } from "../services/auditService";
import { AuditAction } from "@prisma/client";

export const loginController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const credentials = validate(loginSchema, req.body);
    const result = await login(credentials);

    // Create audit log with metadata
    await createAuditLog({
      userId: result.user.userId,
      action: AuditAction.LOGIN,
      entityType: "User",
      entityId: result.user.userId,
      details: `User logged in: ${result.user.email}`,
      metadata: {
        email: result.user.email,
        role: result.user.role,
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const registerController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = validate(registerSchema, req.body);
    const result = await register(data);

    // Create audit log with metadata
    await createAuditLog({
      userId: req.user?.userId,
      action: AuditAction.CREATE,
      entityType: "User",
      entityId: result.user.userId,
      details: `User registered: ${result.user.email} with role ${result.user.role}`,
      metadata: {
        userName: result.user.name,
        email: result.user.email,
        role: result.user.role,
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getMeController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new Error("User not authenticated");
    }

    const user = await getCurrentUser(req.user.userId);

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const logoutController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.json({
        success: true,
        message: "Logged out successfully",
      });
      return;
    }

    // Create audit log for logout
    await createAuditLog({
      userId: req.user.userId,
      action: AuditAction.LOGOUT,
      entityType: "User",
      entityId: req.user.userId,
      details: `User logged out: ${req.user.email}`,
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    // Don't fail logout if audit logging fails
    res.json({
      success: true,
      message: "Logged out successfully",
    });
  }
};

