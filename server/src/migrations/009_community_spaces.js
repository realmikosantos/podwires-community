/**
 * Migration: Podwires Community — 12-space producer-first architecture
 *
 * Adds group_name column, soft-deletes legacy spaces, and seeds the
 * recommended 12-space structure organized into four groups:
 *   Get Started · Get Clients · Get Better · Stay Active
 */

const up = `
  -- Add group_name column (idempotent)
  ALTER TABLE spaces ADD COLUMN IF NOT EXISTS group_name VARCHAR(100);

  -- Soft-delete old default spaces
  UPDATE spaces SET is_active = FALSE
  WHERE slug IN ('open-community', 'talent-hub', 'client-lounge', 'vip-room');

  -- ── Get Started ──────────────────────────────────────────────────────────────
  INSERT INTO spaces (slug, name, description, icon, color, visibility, required_tier, allowed_roles, sort_order, group_name)
  VALUES
    (
      'start-here',
      'Start Here',
      'Welcome to the community for podcast producers who want stronger positioning, better systems, and more client opportunities. Start here first so you know exactly where to post, how to get visible, and how to make this community useful from day one.',
      'home', '#1e3a8a', 'public', 'free', '{producer,client,admin}', 10, 'Get Started'
    ),
    (
      'community-guidelines',
      'Community Guidelines',
      'This is a professional space for podcast producers. Keep posts useful, specific, and respectful — no spam, no low-effort promotion, no cold pitching members without context.',
      'shield', '#1e3a8a', 'public', 'free', '{producer,client,admin}', 20, 'Get Started'
    ),
    (
      'introduce-yourself',
      'Introduce Yourself',
      'Say hello and let people know what you do, who you serve, and what kind of projects you want more of. The more specific your intro, the easier it is for people to refer you or collaborate with you.',
      'user-plus', '#059669', 'public', 'free', '{producer,client,admin}', 30, 'Get Started'
    ),
    (
      'how-to-get-clients',
      'How to Get Clients Here',
      'This space explains how to use the community to build trust, improve your positioning, and increase your chances of getting hired. Read this before treating the community like a passive job board.',
      'target', '#0891b2', 'public', 'free', '{producer,client,admin}', 40, 'Get Started'
    ),

  -- ── Get Clients ──────────────────────────────────────────────────────────────
    (
      'producer-directory',
      'Producer Directory',
      'The producer network inside the community. Use it to make yourself easier to discover for referrals, collaborations, subcontracting opportunities, and future client matching.',
      'users', '#7c3aed', 'public', 'free', '{producer,client,admin}', 50, 'Get Clients'
    ),
    (
      'client-leads',
      'Client Leads',
      'Where paid members access curated leads, project opportunities, subcontracting requests, and referral-style job posts. Every lead should be clear, relevant, and actionable.',
      'briefcase', '#d97706', 'private', 'pro', '{producer,client,admin}', 60, 'Get Clients'
    ),
    (
      'pitch-reviews',
      'Pitch & Proposal Reviews',
      'Before you send the outreach email, proposal, DM, pricing deck, or intro message, post it here for feedback. This space exists to help you improve the words that win work.',
      'edit-3', '#d97706', 'private', 'pro', '{producer,client,admin}', 70, 'Get Clients'
    ),

  -- ── Get Better ───────────────────────────────────────────────────────────────
    (
      'production-qa',
      'Production Q&A',
      'Ask practical questions about editing, systems, delivery, publishing, client workflow, and the day-to-day realities of podcast production. Keep questions specific so the answers help more than one person.',
      'help-circle', '#059669', 'public', 'free', '{producer,client,admin}', 80, 'Get Better'
    ),
    (
      'tools-templates',
      'Tools, Templates & SOPs',
      'The resource library for podcast producers: templates, checklists, workflows, client onboarding forms, production SOPs, and reusable assets that save time and improve consistency.',
      'folder', '#0891b2', 'public', 'free', '{producer,client,admin}', 90, 'Get Better'
    ),

  -- ── Stay Active ──────────────────────────────────────────────────────────────
    (
      'events-office-hours',
      'Events & Office Hours',
      'Join live sessions for Q&A, networking, hot seats, pitch reviews, and practical workshops. Events are one of the fastest ways to build trust and momentum inside the community.',
      'calendar', '#dc2626', 'public', 'free', '{producer,client,admin}', 100, 'Stay Active'
    ),
    (
      'weekly-accountability',
      'Weekly Accountability',
      'Set a small business goal for the week and report back. This space is for pipeline habits: outreach, follow-ups, proposals, networking, and package refinement. Small consistent actions compound.',
      'check-square', '#db2777', 'private', 'pro', '{producer,client,admin}', 110, 'Stay Active'
    ),
    (
      'wins',
      'Wins',
      'Share progress, new clients, strong conversations, referrals, launches, milestones. Wins help members see momentum and make the community feel active, credible, and useful.',
      'award', '#059669', 'public', 'free', '{producer,client,admin}', 120, 'Stay Active'
    )
  ON CONFLICT (slug) DO UPDATE SET
    is_active    = TRUE,
    group_name   = EXCLUDED.group_name,
    description  = EXCLUDED.description,
    color        = EXCLUDED.color,
    required_tier = EXCLUDED.required_tier,
    sort_order   = EXCLUDED.sort_order;
`;

const down = `
  -- Soft-delete the new spaces
  UPDATE spaces SET is_active = FALSE
  WHERE slug IN (
    'start-here', 'community-guidelines', 'introduce-yourself', 'how-to-get-clients',
    'producer-directory', 'client-leads', 'pitch-reviews',
    'production-qa', 'tools-templates',
    'events-office-hours', 'weekly-accountability', 'wins'
  );

  -- Restore old default spaces
  UPDATE spaces SET is_active = TRUE
  WHERE slug IN ('open-community', 'talent-hub', 'client-lounge', 'vip-room');

  -- Drop column
  ALTER TABLE spaces DROP COLUMN IF EXISTS group_name;
`;

module.exports = { up, down };
