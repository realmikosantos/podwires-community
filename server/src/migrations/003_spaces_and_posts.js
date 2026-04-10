/**
 * Migration: Spaces & Posts
 * Community spaces with access control and post content
 */

const up = `
  -- Enum for space visibility
  CREATE TYPE space_visibility AS ENUM ('public', 'private', 'secret');

  -- Enum for post types
  CREATE TYPE post_type AS ENUM ('discussion', 'question', 'announcement', 'showcase', 'resource');

  -- Spaces (Talent Hub, Client Lounge, Open Community, VIP)
  CREATE TABLE spaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(7),
    visibility space_visibility NOT NULL DEFAULT 'public',
    required_tier subscription_tier NOT NULL DEFAULT 'free',
    allowed_roles user_role[] DEFAULT '{producer,client,admin}',
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    post_count INTEGER NOT NULL DEFAULT 0,
    member_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  -- Space memberships
  CREATE TABLE space_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    space_id UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'member',
    notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, space_id)
  );

  -- Posts
  CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    space_id UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(300),
    body TEXT NOT NULL,
    post_type post_type NOT NULL DEFAULT 'discussion',
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    like_count INTEGER NOT NULL DEFAULT 0,
    comment_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  -- Comments on posts
  CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    like_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  -- Post likes
  CREATE TABLE post_likes (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, post_id)
  );

  -- Indexes
  CREATE INDEX idx_spaces_slug ON spaces(slug);
  CREATE INDEX idx_spaces_visibility ON spaces(visibility);
  CREATE INDEX idx_space_memberships_user ON space_memberships(user_id);
  CREATE INDEX idx_space_memberships_space ON space_memberships(space_id);
  CREATE INDEX idx_posts_space ON posts(space_id);
  CREATE INDEX idx_posts_author ON posts(author_id);
  CREATE INDEX idx_posts_created ON posts(created_at DESC);
  CREATE INDEX idx_posts_pinned ON posts(is_pinned) WHERE is_pinned = TRUE;
  CREATE INDEX idx_comments_post ON comments(post_id);
  CREATE INDEX idx_comments_parent ON comments(parent_id);

  -- Triggers
  CREATE TRIGGER update_spaces_updated_at
    BEFORE UPDATE ON spaces
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

  CREATE TRIGGER update_posts_updated_at
    BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

  CREATE TRIGGER update_comments_updated_at
    BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`;

const down = `
  DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
  DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;
  DROP TRIGGER IF EXISTS update_spaces_updated_at ON spaces;
  DROP TABLE IF EXISTS post_likes;
  DROP TABLE IF EXISTS comments;
  DROP TABLE IF EXISTS posts;
  DROP TABLE IF EXISTS space_memberships;
  DROP TABLE IF EXISTS spaces;
  DROP TYPE IF EXISTS post_type;
  DROP TYPE IF EXISTS space_visibility;
`;

module.exports = { up, down };
