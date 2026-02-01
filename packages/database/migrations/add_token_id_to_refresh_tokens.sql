-- Migration: Add tokenId to refresh_tokens table
-- This enables proper individual session revocation
-- Date: 2025-11-12

-- Add tokenId column (unique identifier for each refresh token session)
ALTER TABLE refresh_tokens
ADD COLUMN "tokenId" TEXT;

-- Make tokenId unique to prevent duplicate session identifiers
ALTER TABLE refresh_tokens
ADD CONSTRAINT refresh_tokens_tokenId_key UNIQUE ("tokenId");

-- Create index for faster tokenId lookups
CREATE INDEX refresh_tokens_tokenId_idx ON refresh_tokens("tokenId");

-- IMPORTANT: After running this migration, you should:
-- 1. Invalidate all existing refresh tokens (they don't have tokenId set)
-- 2. Ask users to log in again to get new tokens with proper tokenId

-- Optional: Clear existing tokens to force re-authentication
-- TRUNCATE refresh_tokens;
