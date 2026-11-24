-- =============================================================================
-- Migration V3: Add assigned_team and kyc_biometric_verified to identity.users
-- =============================================================================

ALTER TABLE identity.users ADD COLUMN IF NOT EXISTS assigned_team VARCHAR(100);
ALTER TABLE identity.users ADD COLUMN IF NOT EXISTS kyc_biometric_verified BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE identity.users ALTER COLUMN customer_tier DROP NOT NULL;

