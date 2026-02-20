import * as jwt from "jsonwebtoken";

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  
  if (!secret) {
    throw new Error("JWT_SECRET must be set in environment variables");
  }
  
  // Check for default/placeholder secrets
  const defaultSecrets = [
    "your-secret-key-change-in-production",
    "your-super-secret-jwt-key-change-in-production",
    "secret",
    "change-me",
  ];
  
  if (defaultSecrets.includes(secret.toLowerCase())) {
    throw new Error("JWT_SECRET must be changed from default value");
  }
  
  // Enforce minimum length for production (32 characters recommended)
  if (process.env.NODE_ENV === "production" && secret.length < 32) {
    throw new Error(
      "JWT_SECRET must be at least 32 characters long in production. Generate a strong secret using: openssl rand -base64 32"
    );
  }
  
  // Warn in development if secret is too short
  if (process.env.NODE_ENV !== "production" && secret.length < 16) {
    console.warn(
      "Warning: JWT_SECRET is shorter than recommended (16+ characters). Use a stronger secret in production."
    );
  }
  
  return secret;
};

const getJwtExpiresIn = (): string => {
  return process.env.JWT_EXPIRES_IN || "7d";
};

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export const generateToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: getJwtExpiresIn(),
  } as jwt.SignOptions);
};

export const verifyToken = (token: string): JWTPayload => {
  try {
    return jwt.verify(token, getJwtSecret()) as JWTPayload;
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
};

export const decodeToken = (token: string): JWTPayload | null => {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch {
    return null;
  }
};

