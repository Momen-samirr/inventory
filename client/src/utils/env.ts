/**
 * Environment variable validation and utilities
 */

/**
 * Validates that required environment variables are set
 * Throws an error if any required variables are missing in production
 */
export const validateEnvVars = (): void => {
  if (typeof window === "undefined") {
    // Server-side validation
    const requiredVars = ["NEXT_PUBLIC_API_BASE_URL"];
    const missingVars = requiredVars.filter((varName) => !process.env[varName]);
    
    if (process.env.NODE_ENV === "production" && missingVars.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missingVars.join(", ")}`
      );
    }
  }
};

/**
 * Get API base URL with validation
 */
export const getApiBaseUrl = (): string => {
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  
  if (process.env.NODE_ENV === "production" && !apiUrl) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is required in production");
  }
  
  return apiUrl || "http://localhost:8000/api";
};

