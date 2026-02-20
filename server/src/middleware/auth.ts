import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import { AuthenticationError } from "../utils/errors";

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AuthenticationError("No token provided");
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      next(error);
    } else {
      next(new AuthenticationError("Invalid or expired token"));
    }
  }
};

// Optional authentication - tries to authenticate but doesn't fail if token is missing/invalid
export const optionalAuthenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      try {
        const decoded = verifyToken(token);
        req.user = {
          userId: decoded.userId,
          email: decoded.email,
          role: decoded.role,
        };
      } catch (error) {
        // Token is invalid/expired, but we continue without setting req.user
        // This allows logout to work even with expired tokens
      }
    }
    next();
  } catch (error) {
    // Always continue, even if there's an error
    next();
  }
};

