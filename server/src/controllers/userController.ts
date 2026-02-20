import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth";
import { prisma } from "../config/database";
import { validate, updateUserSchema, createUserSchema } from "../utils/validation";
import { NotFoundError, ConflictError, AuthorizationError } from "../utils/errors";
import { createAuditLog } from "../services/auditService";
import { AuditAction } from "@prisma/client";
import bcrypt from "bcrypt";
import { uploadImage, deleteImage } from "../services/cloudinaryService";

export const createUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = validate(createUserSchema, req.body);

    // Check if user with email already exists
    const existingUser = await prisma.users.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictError("User with this email already exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create user
    const user = await prisma.users.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role || "EMPLOYEE",
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
      select: {
        userId: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        imageUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Create audit log with metadata
    await createAuditLog({
      userId: req.user?.userId,
      action: AuditAction.CREATE,
      entityType: "User",
      entityId: user.userId,
      details: `User created: ${user.email} with role ${user.role}`,
      metadata: {
        userName: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.status(201).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const getUsers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const search = req.query.search?.toString();
    const role = req.query.role?.toString();
    const isActive = req.query.isActive !== undefined ? req.query.isActive === "true" : undefined;
    const sortBy = req.query.sortBy?.toString() || "createdAt";
    const sortOrder = req.query.sortOrder?.toString() || "desc";
    const page = req.query.page ? parseInt(req.query.page.toString()) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit.toString()) : 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Search by name or email
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    // Filter by role
    if (role) {
      where.role = role;
    }

    // Filter by active status
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // Build orderBy
    const orderBy: any = {};
    if (sortBy === "name") {
      orderBy.name = sortOrder;
    } else if (sortBy === "email") {
      orderBy.email = sortOrder;
    } else {
      orderBy.createdAt = sortOrder;
    }

    // Get total count for pagination
    const total = await prisma.users.count({ where });

    // Get users with pagination
    const users = await prisma.users.findMany({
      where,
      select: {
        userId: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        imageUrl: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy,
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await prisma.users.findUnique({
      where: { userId: id },
      select: {
        userId: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        imageUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundError("User");
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const data = validate(updateUserSchema, req.body);

    const existingUser = await prisma.users.findUnique({
      where: { userId: id },
    });

    if (!existingUser) {
      throw new NotFoundError("User");
    }

    // Check if email is being updated and if it conflicts with another user
    if (data.email && data.email !== existingUser.email) {
      const emailConflict = await prisma.users.findUnique({
        where: { email: data.email },
      });

      if (emailConflict) {
        throw new ConflictError("User with this email already exists");
      }
    }

    // Prepare update data and track changes for metadata
    const updateData: any = {};
    const changes: Record<string, { old: any; new: any }> = {};
    
    if (data.name !== undefined && data.name !== existingUser.name) {
      updateData.name = data.name;
      changes.name = { old: existingUser.name, new: data.name };
    }
    if (data.email !== undefined && data.email !== existingUser.email) {
      updateData.email = data.email;
      changes.email = { old: existingUser.email, new: data.email };
    }
    if (data.role !== undefined && data.role !== existingUser.role) {
      updateData.role = data.role;
      changes.role = { old: existingUser.role, new: data.role };
    }
    if (data.isActive !== undefined && data.isActive !== existingUser.isActive) {
      updateData.isActive = data.isActive;
      changes.isActive = { old: existingUser.isActive, new: data.isActive };
    }

    // Hash password if provided and not empty
    if (data.password && data.password.trim() !== "") {
      updateData.password = await bcrypt.hash(data.password, 10);
      changes.password = { old: "[REDACTED]", new: "[REDACTED]" };
    }

    const user = await prisma.users.update({
      where: { userId: id },
      data: updateData,
      select: {
        userId: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        imageUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Create audit log with metadata
    const detailsParts = [`User updated: ${user.email}`];
    if (Object.keys(changes).length > 0) {
      const changeDescriptions = Object.entries(changes).map(([key, value]) => {
        if (key === "password") return "password changed";
        return `${key}: "${value.old}" → "${value.new}"`;
      });
      detailsParts.push(`Changes: ${changeDescriptions.join(", ")}`);
    }

    await createAuditLog({
      userId: req.user?.userId,
      action: AuditAction.UPDATE,
      entityType: "User",
      entityId: user.userId,
      details: detailsParts.join(". "),
      metadata: Object.keys(changes).length > 0 ? { changes } : undefined,
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    // Prevent self-deletion
    if (req.user?.userId === id) {
      throw new Error("Cannot delete your own account");
    }

    const user = await prisma.users.findUnique({
      where: { userId: id },
    });

    if (!user) {
      throw new NotFoundError("User");
    }

    // Delete user image if exists
    if (user.imageUrl) {
      await deleteImage(user.imageUrl);
    }

    await prisma.users.delete({
      where: { userId: id },
    });

    // Create audit log with metadata
    await createAuditLog({
      userId: req.user?.userId,
      action: AuditAction.DELETE,
      entityType: "User",
      entityId: id,
      details: `User deleted: ${user.email} (Role: ${user.role})`,
      metadata: {
        userName: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const uploadUserImage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const file = req.file;

    if (!file) {
      res.status(400).json({
        success: false,
        error: {
          message: "No file uploaded",
          name: "ValidationError",
        },
      });
      return;
    }

    // Check if user exists
    const user = await prisma.users.findUnique({
      where: { userId: id },
    });

    if (!user) {
      throw new NotFoundError("User");
    }

    // Check authorization: users can upload their own image, admins can upload any
    if (req.user?.userId !== id && req.user?.role !== "ADMIN") {
      throw new AuthorizationError("Unauthorized to upload image for this user");
    }

    // Delete old image if exists
    if (user.imageUrl) {
      await deleteImage(user.imageUrl);
    }

    // Upload new image to profiles folder
    let imageUrl: string;
    try {
      imageUrl = await uploadImage(file, "profiles");
    } catch (uploadError: any) {
      console.error("Cloudinary upload error:", uploadError);
      res.status(500).json({
        success: false,
        error: {
          message: uploadError.message || "Failed to upload image to cloud storage",
          name: "UploadError",
        },
      });
      return;
    }

    // Update user
    const updatedUser = await prisma.users.update({
      where: { userId: id },
      data: { imageUrl },
      select: {
        userId: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        imageUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Create audit log with metadata
    await createAuditLog({
      userId: req.user?.userId,
      action: AuditAction.UPDATE,
      entityType: "User",
      entityId: id,
      details: `User profile image updated: ${user.email}`,
      metadata: {
        imageUrl: imageUrl,
        previousImageUrl: user.imageUrl || null,
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    console.error("Upload user image error:", error);
    next(error);
  }
};
