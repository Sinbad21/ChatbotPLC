-- Migration: Add missing columns to bots table
-- Run this on Neon database console

-- Add model column if missing
ALTER TABLE bots ADD COLUMN IF NOT EXISTS model text NOT NULL DEFAULT 'gpt-5-mini';

-- Add logoUrl column if missing
ALTER TABLE bots ADD COLUMN IF NOT EXISTS "logoUrl" text;

-- Add theme column if missing (JSON type)
ALTER TABLE bots ADD COLUMN IF NOT EXISTS theme jsonb;

-- Verify columns were added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'bots'
AND column_name IN ('model', 'logoUrl', 'theme');
