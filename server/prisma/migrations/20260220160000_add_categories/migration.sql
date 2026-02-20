-- CreateCategoriesTable
CREATE TABLE IF NOT EXISTS "Categories" (
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Categories_pkey" PRIMARY KEY ("categoryId")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Categories_name_key" ON "Categories"("name");
CREATE INDEX IF NOT EXISTS "Categories_name_idx" ON "Categories"("name");

-- Migrate existing category strings to Categories table
-- First, insert unique categories from Products table
INSERT INTO "Categories" ("categoryId", "name", "description", "createdAt", "updatedAt")
SELECT DISTINCT ON (category)
    gen_random_uuid()::text as "categoryId",
    category as "name",
    NULL as "description",
    CURRENT_TIMESTAMP as "createdAt",
    CURRENT_TIMESTAMP as "updatedAt"
FROM "Products"
WHERE category IS NOT NULL AND category != ''
ON CONFLICT ("name") DO NOTHING;

-- Add categoryId column to Products table
ALTER TABLE "Products" ADD COLUMN IF NOT EXISTS "categoryId" TEXT;

-- Update Products.categoryId based on category string
UPDATE "Products" p
SET "categoryId" = c."categoryId"
FROM "Categories" c
WHERE p.category = c.name AND p.category IS NOT NULL;

-- Drop old category index
DROP INDEX IF EXISTS "Products_category_idx";

-- Add foreign key constraint
ALTER TABLE "Products" ADD CONSTRAINT "Products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Categories"("categoryId") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create new index on categoryId
CREATE INDEX IF NOT EXISTS "Products_categoryId_idx" ON "Products"("categoryId");

-- Drop old category column (optional - we'll keep it for now to avoid breaking existing code)
-- ALTER TABLE "Products" DROP COLUMN IF EXISTS "category";

