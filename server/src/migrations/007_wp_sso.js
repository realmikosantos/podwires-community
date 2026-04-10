/**
 * Migration: WordPress SSO support
 * - Allow passwordless users (SSO-only accounts)
 * - Add last_sso_at timestamp
 * - Add UNIQUE constraint on wp_user_id (index exists but not unique constraint)
 */

const up = `
  -- Allow NULL password for SSO-only users
  ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

  -- Track last SSO login
  ALTER TABLE users ADD COLUMN IF NOT EXISTS last_sso_at TIMESTAMPTZ;

  -- Ensure wp_user_id is unique (drop old non-unique index, add unique)
  DROP INDEX IF EXISTS idx_users_wp_user_id;
  CREATE UNIQUE INDEX idx_users_wp_user_id ON users(wp_user_id);
`;

const down = `
  ALTER TABLE users ALTER COLUMN password_hash SET NOT NULL;
  ALTER TABLE users DROP COLUMN IF EXISTS last_sso_at;
  DROP INDEX IF EXISTS idx_users_wp_user_id;
  CREATE INDEX idx_users_wp_user_id ON users(wp_user_id);
`;

module.exports = { up, down };
