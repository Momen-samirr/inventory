-- Create enums first
DO $$ BEGIN
 CREATE TYPE "UserRole" AS ENUM('ADMIN', 'MANAGER', 'EMPLOYEE');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "StockMovementType" AS ENUM('SALE', 'PURCHASE', 'ADJUSTMENT', 'RETURN');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "AuditAction" AS ENUM('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'STOCK_ADJUSTMENT');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- AlterTable: Add updatedAt columns with defaults for existing rows
ALTER TABLE "ExpenseByCategory" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "ExpenseByCategory" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "ExpenseSummary" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "ExpenseSummary" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Expenses" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Expenses" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Products" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Products" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Products" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "Products" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
ALTER TABLE "Products" ADD COLUMN IF NOT EXISTS "category" TEXT;
ALTER TABLE "PurchaseSummary" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "PurchaseSummary" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "SalesSummary" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "SalesSummary" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Add userId columns to Sales and Purchases (nullable for existing rows)
ALTER TABLE "Sales" ADD COLUMN IF NOT EXISTS "userId" TEXT;
ALTER TABLE "Purchases" ADD COLUMN IF NOT EXISTS "userId" TEXT;

-- AlterTable: Add auth fields to Users
-- Add password as nullable first
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "password" TEXT;
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "role" "UserRole" DEFAULT 'EMPLOYEE';
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true;
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Update existing users with default values
-- Set a temporary password hash (bcrypt hash of 'changeme123')
-- Users should reset their passwords after first login
UPDATE "Users" SET "password" = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy' WHERE "password" IS NULL;
UPDATE "Users" SET "role" = 'EMPLOYEE'::"UserRole" WHERE "role" IS NULL;
UPDATE "Users" SET "isActive" = true WHERE "isActive" IS NULL;

-- Now make password required
ALTER TABLE "Users" ALTER COLUMN "password" SET NOT NULL;

-- Add unique constraint on email (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Users_email_key'
    ) THEN
        ALTER TABLE "Users" ADD CONSTRAINT "Users_email_key" UNIQUE ("email");
    END IF;
END $$;

-- Create new tables
CREATE TABLE IF NOT EXISTS "StockMovement" (
    "movementId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "movementType" "StockMovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "previousStock" INTEGER NOT NULL,
    "newStock" INTEGER NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("movementId")
);

CREATE TABLE IF NOT EXISTS "AuditLog" (
    "auditLogId" TEXT NOT NULL,
    "userId" TEXT,
    "action" "AuditAction" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "details" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("auditLogId")
);

-- Add foreign keys for Sales and Purchases userId
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Sales_userId_fkey'
    ) THEN
        ALTER TABLE "Sales" ADD CONSTRAINT "Sales_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("userId") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Purchases_userId_fkey'
    ) THEN
        ALTER TABLE "Purchases" ADD CONSTRAINT "Purchases_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("userId") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- Add foreign keys (with IF NOT EXISTS check)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'StockMovement_productId_fkey'
    ) THEN
        ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Products"("productId") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'StockMovement_userId_fkey'
    ) THEN
        ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'AuditLog_userId_fkey'
    ) THEN
        ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("userId") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- Add indexes (using CREATE INDEX IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS "Users_email_idx" ON "Users"("email");
CREATE INDEX IF NOT EXISTS "Users_role_idx" ON "Users"("role");
CREATE INDEX IF NOT EXISTS "Products_name_idx" ON "Products"("name");
CREATE INDEX IF NOT EXISTS "Products_category_idx" ON "Products"("category");
CREATE INDEX IF NOT EXISTS "Products_stockQuantity_idx" ON "Products"("stockQuantity");
CREATE INDEX IF NOT EXISTS "Sales_productId_idx" ON "Sales"("productId");
CREATE INDEX IF NOT EXISTS "Sales_timestamp_idx" ON "Sales"("timestamp");
CREATE INDEX IF NOT EXISTS "Sales_userId_idx" ON "Sales"("userId");
CREATE INDEX IF NOT EXISTS "Purchases_productId_idx" ON "Purchases"("productId");
CREATE INDEX IF NOT EXISTS "Purchases_timestamp_idx" ON "Purchases"("timestamp");
CREATE INDEX IF NOT EXISTS "Purchases_userId_idx" ON "Purchases"("userId");
CREATE INDEX IF NOT EXISTS "Expenses_category_idx" ON "Expenses"("category");
CREATE INDEX IF NOT EXISTS "Expenses_timestamp_idx" ON "Expenses"("timestamp");
CREATE INDEX IF NOT EXISTS "SalesSummary_date_idx" ON "SalesSummary"("date");
CREATE INDEX IF NOT EXISTS "PurchaseSummary_date_idx" ON "PurchaseSummary"("date");
CREATE INDEX IF NOT EXISTS "ExpenseSummary_date_idx" ON "ExpenseSummary"("date");
CREATE INDEX IF NOT EXISTS "ExpenseByCategory_expenseSummaryId_idx" ON "ExpenseByCategory"("expenseSummaryId");
CREATE INDEX IF NOT EXISTS "ExpenseByCategory_category_idx" ON "ExpenseByCategory"("category");
CREATE INDEX IF NOT EXISTS "ExpenseByCategory_date_idx" ON "ExpenseByCategory"("date");
CREATE INDEX IF NOT EXISTS "StockMovement_productId_idx" ON "StockMovement"("productId");
CREATE INDEX IF NOT EXISTS "StockMovement_userId_idx" ON "StockMovement"("userId");
CREATE INDEX IF NOT EXISTS "StockMovement_movementType_idx" ON "StockMovement"("movementType");
CREATE INDEX IF NOT EXISTS "StockMovement_createdAt_idx" ON "StockMovement"("createdAt");
CREATE INDEX IF NOT EXISTS "AuditLog_userId_idx" ON "AuditLog"("userId");
CREATE INDEX IF NOT EXISTS "AuditLog_action_idx" ON "AuditLog"("action");
CREATE INDEX IF NOT EXISTS "AuditLog_entityType_idx" ON "AuditLog"("entityType");
CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

