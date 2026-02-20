import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    // Connection pooling is handled via DATABASE_URL parameters
    // Neon connection strings include pooling parameters automatically
  });

// Handle graceful shutdown in production
if (process.env.NODE_ENV === "production") {
  process.on("beforeExit", async () => {
    await prisma.$disconnect();
  });
}

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

