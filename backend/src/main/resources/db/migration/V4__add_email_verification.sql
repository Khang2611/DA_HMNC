-- =============================================================================
-- Migration V4: Add Email Verification and OTP Tokens for VinaTrust Bank
-- =============================================================================

-- 1. Alter identity.users table
ALTER TABLE identity.users 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE;

-- Ensure constraint for status includes 'PENDING_VERIFICATION'
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_users_status') THEN
        ALTER TABLE identity.users DROP CONSTRAINT chk_users_status;
    END IF;
END $$;

ALTER TABLE identity.users 
ADD CONSTRAINT chk_users_status 
CHECK (status IN ('PENDING_VERIFICATION', 'ACTIVE', 'LOCKED', 'SUSPENDED'));

-- Mark existing ADMIN accounts as email_verified = true
UPDATE identity.users 
SET email_verified = TRUE 
WHERE role = 'ADMIN';

-- 2. Create identity.email_verification_tokens table
CREATE TABLE IF NOT EXISTS identity.email_verification_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES identity.users(id) ON DELETE CASCADE,
    otp_hash VARCHAR(64) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    attempt_count INT NOT NULL DEFAULT 0,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast query and cleanup
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_lookup 
    ON identity.email_verification_tokens(user_id, used, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_expires 
    ON identity.email_verification_tokens(expires_at);

