import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors";
import { Prisma } from "@prisma/client";

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log error
  console.error("Error:", err);

  // Handle known AppError
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        name: err.name,
      },
    });
    return;
  }

  // Handle Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      res.status(409).json({
        success: false,
        error: {
          message: "A record with this value already exists",
          name: "ConflictError",
        },
      });
      return;
    }
    if (err.code === "P2025") {
      res.status(404).json({
        success: false,
        error: {
          message: "Record not found",
          name: "NotFoundError",
        },
      });
      return;
    }
  }

  // Handle validation errors
  if (err.name === "ValidationError" || err.name === "ZodError") {
    res.status(400).json({
      success: false,
      error: {
        message: err.message,
        name: "ValidationError",
      },
    });
    return;
  }

  // Handle JWT errors
  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    res.status(401).json({
      success: false,
      error: {
        message: "Invalid or expired token",
        name: "AuthenticationError",
      },
    });
    return;
  }

  // Default error
  res.status(500).json({
    success: false,
    error: {
      message: process.env.NODE_ENV === "production" 
        ? "Internal server error" 
        : err.message,
      name: "InternalServerError",
    },
  });
};

