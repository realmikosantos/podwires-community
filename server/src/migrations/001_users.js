/**
 * Migration: Users & Authentication
 * Core user table with role-based access (producer/client/admin)
 */

const up = `
  -- Enable UUID extension
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

  -- Enum for user roles
  CREATE TYPE user_role AS ENUM ('producer', 'client', 'admin');

  -- Enum for subscription tiers
  CREATE TYPE subscription_tier AS ENUM ('free', 'pro', 'vip');

  -- Enum for account status
  CREATE TYPE account_status AS ENUM ('active', 'suspended', 'deactivated');

  -- Users table
  CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'producer',
    display_name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    subscription_tier subscription_tier NOT NULL DEFAULT 'free',
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    account_status account_status NOT NULL DEFAULT 'active',
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    email_verified_at TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    wp_user_id INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  -- Refresh tokens for JWT rotation
  CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  -- Indexes
  CREATE INDEX idx_users_email ON users(email);
  CREATE INDEX idx_users_role ON users(role);
  CREATE INDEX idx_users_subscription ON users(subscription_tier);
  CREATE INDEX idx_users_wp_user_id ON users(wp_user_id);
  CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
  CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash);

  -- Updated_at trigger function
  CREATE OR REPLACE FUNCTION update_updated_at_column()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`;

const down = `
  DROP TRIGGER IF EXISTS update_users_updated_at ON users;
  DROP FUNCTION IF EXISTS update_updated_at_column();
  DROP TABLE IF EXISTS refresh_tokens;
  DROP TABLE IF EXISTS users;
  DROP TYPE IF EXISTS account_status;
  DROP TYPE IF EXISTS subscription_tier;
  DROP TYPE IF EXISTS user_role;
`;

module.exports = { up, down };
