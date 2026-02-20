-- Add imageUrl to Users table
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;

-- Add sku to Products table
ALTER TABLE "Products" ADD COLUMN IF NOT EXISTS "sku" TEXT;

-- Create unique index on sku
CREATE UNIQUE INDEX IF NOT EXISTS "Products_sku_key" ON "Products"("sku");

-- Create index on sku for faster lookups
CREATE INDEX IF NOT EXISTS "Products_sku_idx" ON "Products"("sku");

