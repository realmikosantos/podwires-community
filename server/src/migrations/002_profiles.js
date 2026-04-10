/**
 * Migration: Producer & Client Profiles
 * Extended profile data for both user roles
 */

const up = `
  -- Enum for availability status
  CREATE TYPE availability_status AS ENUM ('available', 'busy', 'unavailable', 'on_vacation');

  -- Producer profiles
  CREATE TABLE producer_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    headline VARCHAR(200),
    bio TEXT,
    specialisation VARCHAR(100)[],
    niches VARCHAR(100)[],
    hourly_rate_min DECIMAL(10, 2),
    hourly_rate_max DECIMAL(10, 2),
    project_rate_min DECIMAL(10, 2),
    project_rate_max DECIMAL(10, 2),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    portfolio_links JSONB DEFAULT '[]',
    sample_work_urls TEXT[],
    availability availability_status NOT NULL DEFAULT 'available',
    years_experience INTEGER,
    languages VARCHAR(50)[],
    location VARCHAR(200),
    timezone VARCHAR(50),
    website_url TEXT,
    linkedin_url TEXT,
    twitter_handle VARCHAR(50),
    equipment TEXT[],
    software TEXT[],
    total_projects_completed INTEGER NOT NULL DEFAULT 0,
    average_rating DECIMAL(3, 2) DEFAULT 0,
    total_reviews INTEGER NOT NULL DEFAULT 0,
    featured BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  -- Client profiles (brands/businesses)
  CREATE TABLE client_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_name VARCHAR(200),
    company_website TEXT,
    industry VARCHAR(100),
    company_size VARCHAR(50),
    bio TEXT,
    podcast_goals TEXT,
    budget_range VARCHAR(50),
    location VARCHAR(200),
    timezone VARCHAR(50),
    linkedin_url TEXT,
    total_projects_posted INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  -- Indexes
  CREATE INDEX idx_producer_profiles_user ON producer_profiles(user_id);
  CREATE INDEX idx_producer_profiles_availability ON producer_profiles(availability);
  CREATE INDEX idx_producer_profiles_specialisation ON producer_profiles USING GIN(specialisation);
  CREATE INDEX idx_producer_profiles_niches ON producer_profiles USING GIN(niches);
  CREATE INDEX idx_producer_profiles_rating ON producer_profiles(average_rating DESC);
  CREATE INDEX idx_producer_profiles_featured ON producer_profiles(featured) WHERE featured = TRUE;
  CREATE INDEX idx_client_profiles_user ON client_profiles(user_id);

  -- Triggers
  CREATE TRIGGER update_producer_profiles_updated_at
    BEFORE UPDATE ON producer_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

  CREATE TRIGGER update_client_profiles_updated_at
    BEFORE UPDATE ON client_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`;

const down = `
  DROP TRIGGER IF EXISTS update_client_profiles_updated_at ON client_profiles;
  DROP TRIGGER IF EXISTS update_producer_profiles_updated_at ON producer_profiles;
  DROP TABLE IF EXISTS client_profiles;
  DROP TABLE IF EXISTS producer_profiles;
  DROP TYPE IF EXISTS availability_status;
`;

module.exports = { up, down };
