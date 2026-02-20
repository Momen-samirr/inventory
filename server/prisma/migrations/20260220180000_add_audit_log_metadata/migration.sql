-- Add metadata JSON field to AuditLog table
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "metadata" JSONB;

