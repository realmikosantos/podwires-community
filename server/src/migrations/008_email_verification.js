const up = `
  -- Email verification codes on users table
  ALTER TABLE users
    ADD COLUMN IF NOT EXISTS email_verification_code_hash VARCHAR(255),
    ADD COLUMN IF NOT EXISTS email_verification_expires_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS profile_setup_completed BOOLEAN NOT NULL DEFAULT FALSE;

  -- Additional social links on producer_profiles
  ALTER TABLE producer_profiles
    ADD COLUMN IF NOT EXISTS facebook_url TEXT,
    ADD COLUMN IF NOT EXISTS instagram_url TEXT,
    ADD COLUMN IF NOT EXISTS youtube_url TEXT,
    ADD COLUMN IF NOT EXISTS podcast_url TEXT;

  -- Additional social links + fields on client_profiles
  ALTER TABLE client_profiles
    ADD COLUMN IF NOT EXISTS facebook_url TEXT,
    ADD COLUMN IF NOT EXISTS instagram_url TEXT,
    ADD COLUMN IF NOT EXISTS youtube_url TEXT,
    ADD COLUMN IF NOT EXISTS podcast_url TEXT,
    ADD COLUMN IF NOT EXISTS website_url TEXT,
    ADD COLUMN IF NOT EXISTS twitter_handle VARCHAR(50),
    ADD COLUMN IF NOT EXISTS headline VARCHAR(200);
`;

const down = `
  ALTER TABLE users
    DROP COLUMN IF EXISTS email_verification_code_hash,
    DROP COLUMN IF EXISTS email_verification_expires_at,
    DROP COLUMN IF EXISTS profile_setup_completed;
  ALTER TABLE producer_profiles
    DROP COLUMN IF EXISTS facebook_url,
    DROP COLUMN IF EXISTS instagram_url,
    DROP COLUMN IF EXISTS youtube_url,
    DROP COLUMN IF EXISTS podcast_url;
  ALTER TABLE client_profiles
    DROP COLUMN IF EXISTS facebook_url,
    DROP COLUMN IF EXISTS instagram_url,
    DROP COLUMN IF EXISTS youtube_url,
    DROP COLUMN IF EXISTS podcast_url,
    DROP COLUMN IF EXISTS website_url,
    DROP COLUMN IF EXISTS twitter_handle,
    DROP COLUMN IF EXISTS headline;
`;

module.exports = { up, down };
