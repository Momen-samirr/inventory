-- Add title, description, and userId fields to Expenses table
ALTER TABLE "Expenses" ADD COLUMN IF NOT EXISTS "title" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Expenses" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "Expenses" ADD COLUMN IF NOT EXISTS "userId" TEXT;

-- Create index on userId
CREATE INDEX IF NOT EXISTS "Expenses_userId_idx" ON "Expenses"("userId");

-- Add foreign key constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Expenses_userId_fkey'
  ) THEN
    ALTER TABLE "Expenses" ADD CONSTRAINT "Expenses_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "Users"("userId") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Update existing expenses to have a default title (use category as title)
UPDATE "Expenses" SET "title" = "category" WHERE "title" = '';

