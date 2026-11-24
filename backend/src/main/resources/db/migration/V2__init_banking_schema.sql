-- =============================================================================
-- Migration V2: Initialize Banking Schema and Tables for VinaTrust Bank
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS banking;

-- 1. Banking Accounts Table
CREATE TABLE IF NOT EXISTS banking.accounts (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL, -- Logical reference to identity.users(id), strictly no cross-schema physical FK
    account_number VARCHAR(20) NOT NULL UNIQUE,
    balance NUMERIC(19, 4) NOT NULL DEFAULT 0.0000,
    daily_limit NUMERIC(19, 4) NOT NULL DEFAULT 50000000.0000,
    currency VARCHAR(10) NOT NULL DEFAULT 'VND',
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_banking_accounts_user_id ON banking.accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_banking_accounts_number ON banking.accounts(account_number);
CREATE INDEX IF NOT EXISTS idx_banking_accounts_status ON banking.accounts(status);

-- 2. Banking Transactions Table
CREATE TABLE IF NOT EXISTS banking.transactions (
    id UUID PRIMARY KEY,
    reference_code VARCHAR(50) NOT NULL UNIQUE,
    from_account_id UUID REFERENCES banking.accounts(id),
    to_account_number VARCHAR(50) NOT NULL,
    to_bank_code VARCHAR(20) NOT NULL,
    amount NUMERIC(19, 4) NOT NULL,
    fee NUMERIC(19, 4) NOT NULL DEFAULT 0.0000,
    transfer_channel VARCHAR(30) NOT NULL,
    auth_method VARCHAR(30) NOT NULL,
    description VARCHAR(255),
    status VARCHAR(30) NOT NULL DEFAULT 'SUCCESS',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_banking_tx_ref ON banking.transactions(reference_code);
CREATE INDEX IF NOT EXISTS idx_banking_tx_from_acc ON banking.transactions(from_account_id);
CREATE INDEX IF NOT EXISTS idx_banking_tx_created_at ON banking.transactions(created_at);

-- 3. Banking Cards Table
CREATE TABLE IF NOT EXISTS banking.cards (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL, -- Logical reference to identity.users(id)
    account_id UUID NOT NULL REFERENCES banking.accounts(id) ON DELETE CASCADE,
    card_number_masked VARCHAR(30) NOT NULL,
    card_last4 VARCHAR(4) NOT NULL,
    card_type VARCHAR(30) NOT NULL,
    is_virtual BOOLEAN NOT NULL DEFAULT FALSE,
    credit_limit NUMERIC(19, 4) DEFAULT 0.0000,
    pin_hash VARCHAR(255),
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    expired_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_banking_cards_user_id ON banking.cards(user_id);
CREATE INDEX IF NOT EXISTS idx_banking_cards_account_id ON banking.cards(account_id);
CREATE INDEX IF NOT EXISTS idx_banking_cards_status ON banking.cards(status);

-- 4. Banking Savings Accounts Table
CREATE TABLE IF NOT EXISTS banking.savings_accounts (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL, -- Logical reference to identity.users(id)
    source_account_id UUID NOT NULL REFERENCES banking.accounts(id),
    principal_amount NUMERIC(19, 4) NOT NULL,
    term_months INT NOT NULL,
    interest_rate NUMERIC(6, 4) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    opened_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    maturity_date TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_banking_savings_user_id ON banking.savings_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_banking_savings_status ON banking.savings_accounts(status);

-- 5. Banking Loans Table
CREATE TABLE IF NOT EXISTS banking.loans (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL, -- Logical reference to identity.users(id)
    loan_type VARCHAR(50) NOT NULL,
    requested_amount NUMERIC(19, 4) NOT NULL,
    term_months INT NOT NULL,
    interest_rate NUMERIC(6, 4) NOT NULL,
    collateral_value NUMERIC(19, 4) DEFAULT 0.0000,
    monthly_income NUMERIC(19, 4) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_banking_loans_user_id ON banking.loans(user_id);
CREATE INDEX IF NOT EXISTS idx_banking_loans_status ON banking.loans(status);

