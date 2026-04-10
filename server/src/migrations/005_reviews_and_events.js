/**
 * Migration: Reviews & Events
 */

const up = `
  -- Reviews (client reviews producer after project completion)
  CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID UNIQUE NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reviewee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(200),
    body TEXT,
    communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
    quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
    timeliness_rating INTEGER CHECK (timeliness_rating >= 1 AND timeliness_rating <= 5),
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  -- Community events
  CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    space_id UUID REFERENCES spaces(id) ON DELETE SET NULL,
    host_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(300) NOT NULL,
    description TEXT,
    event_type VARCHAR(50) NOT NULL DEFAULT 'meetup',
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
    location_type VARCHAR(20) NOT NULL DEFAULT 'online',
    location_url TEXT,
    location_address TEXT,
    max_attendees INTEGER,
    required_tier subscription_tier NOT NULL DEFAULT 'free',
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  -- Event RSVPs
  CREATE TABLE event_rsvps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'going',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(event_id, user_id)
  );

  -- Notifications
  CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(300) NOT NULL,
    body TEXT,
    data JSONB DEFAULT '{}',
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  -- Indexes
  CREATE INDEX idx_reviews_reviewer ON reviews(reviewer_id);
  CREATE INDEX idx_reviews_reviewee ON reviews(reviewee_id);
  CREATE INDEX idx_reviews_rating ON reviews(rating);
  CREATE INDEX idx_events_space ON events(space_id);
  CREATE INDEX idx_events_start ON events(start_time);
  CREATE INDEX idx_events_published ON events(is_published) WHERE is_published = TRUE;
  CREATE INDEX idx_event_rsvps_event ON event_rsvps(event_id);
  CREATE INDEX idx_event_rsvps_user ON event_rsvps(user_id);
  CREATE INDEX idx_notifications_user ON notifications(user_id);
  CREATE INDEX idx_notifications_unread ON notifications(user_id, read_at) WHERE read_at IS NULL;

  -- Triggers
  CREATE TRIGGER update_reviews_updated_at
    BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

  CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`;

const down = `
  DROP TRIGGER IF EXISTS update_events_updated_at ON events;
  DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews;
  DROP TABLE IF EXISTS notifications;
  DROP TABLE IF EXISTS event_rsvps;
  DROP TABLE IF EXISTS events;
  DROP TABLE IF EXISTS reviews;
`;

module.exports = { up, down };
