/**
 * Migration: Seed default spaces
 */

const up = `
  INSERT INTO spaces (slug, name, description, icon, color, visibility, required_tier, allowed_roles, sort_order) VALUES
  (
    'open-community',
    'Open Community',
    'Welcome to the Podwires Community! Introduce yourself, share ideas, and connect with fellow podcast enthusiasts.',
    'globe',
    '#3B82F6',
    'public',
    'free',
    '{producer,client,admin}',
    1
  ),
  (
    'talent-hub',
    'Talent Hub',
    'Exclusive space for podcast producers. Share your work, get feedback, collaborate on projects, and grow your skills.',
    'mic',
    '#8B5CF6',
    'private',
    'pro',
    '{producer,admin}',
    2
  ),
  (
    'client-lounge',
    'Client Lounge',
    'A space for brands and businesses looking for podcast talent. Post briefs, discuss strategies, and find your perfect producer.',
    'briefcase',
    '#F59E0B',
    'private',
    'pro',
    '{client,admin}',
    3
  ),
  (
    'vip-room',
    'VIP Room',
    'Premium access for top-tier members. Exclusive masterclasses, direct introductions, early access to opportunities, and VIP networking.',
    'crown',
    '#EF4444',
    'secret',
    'vip',
    '{producer,client,admin}',
    4
  );
`;

const down = `
  DELETE FROM spaces WHERE slug IN ('open-community', 'talent-hub', 'client-lounge', 'vip-room');
`;

module.exports = { up, down };
