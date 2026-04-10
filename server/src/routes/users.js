const { Router } = require('express');
const { authenticate, requireRole } = require('../middleware/auth');
const { query } = require('../config/database');

const router = Router();

/**
 * GET /api/users/producers — Browse producer profiles (public)
 */
router.get('/producers', async (req, res, next) => {
  try {
    const { specialisation, niche, availability, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const params = [];
    const conditions = ["u.role = 'producer'", "u.account_status = 'active'"];

    if (specialisation) {
      params.push(specialisation);
      conditions.push(`$${params.length} = ANY(pp.specialisation)`);
    }

    if (niche) {
      params.push(niche);
      conditions.push(`$${params.length} = ANY(pp.niches)`);
    }

    if (availability) {
      params.push(availability);
      conditions.push(`pp.availability = $${params.length}`);
    }

    params.push(parseInt(limit, 10), offset);

    const result = await query(
      `SELECT u.id, u.display_name, u.avatar_url, u.subscription_tier,
              pp.headline, pp.specialisation, pp.niches, pp.availability,
              pp.hourly_rate_min, pp.hourly_rate_max, pp.currency,
              pp.years_experience, pp.location, pp.average_rating,
              pp.total_reviews, pp.featured
       FROM users u
       JOIN producer_profiles pp ON pp.user_id = u.id
       WHERE ${conditions.join(' AND ')}
       ORDER BY pp.featured DESC, pp.average_rating DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({ producers: result.rows, page: parseInt(page, 10) });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/users/:id — Get user profile
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const userResult = await query(
      `SELECT id, role, display_name, avatar_url, subscription_tier, created_at
       FROM users WHERE id = $1 AND account_status = 'active'`,
      [id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];
    let profile = null;

    if (user.role === 'producer') {
      const profileResult = await query(
        'SELECT * FROM producer_profiles WHERE user_id = $1',
        [id]
      );
      profile = profileResult.rows[0] || null;
    } else if (user.role === 'client') {
      const profileResult = await query(
        'SELECT * FROM client_profiles WHERE user_id = $1',
        [id]
      );
      profile = profileResult.rows[0] || null;
    }

    res.json({ user, profile });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/users/profile — Update own profile
 */
router.put('/profile', authenticate, async (req, res, next) => {
  try {
    const { role, id } = req.user;

    if (role === 'producer') {
      const {
        headline, bio, specialisation, niches, hourlyRateMin, hourlyRateMax,
        projectRateMin, projectRateMax, currency, portfolioLinks, availability,
        yearsExperience, languages, location, timezone, websiteUrl,
        linkedinUrl, twitterHandle, equipment, software,
      } = req.body;

      await query(
        `UPDATE producer_profiles SET
          headline = COALESCE($2, headline),
          bio = COALESCE($3, bio),
          specialisation = COALESCE($4, specialisation),
          niches = COALESCE($5, niches),
          hourly_rate_min = COALESCE($6, hourly_rate_min),
          hourly_rate_max = COALESCE($7, hourly_rate_max),
          project_rate_min = COALESCE($8, project_rate_min),
          project_rate_max = COALESCE($9, project_rate_max),
          currency = COALESCE($10, currency),
          portfolio_links = COALESCE($11, portfolio_links),
          availability = COALESCE($12, availability),
          years_experience = COALESCE($13, years_experience),
          languages = COALESCE($14, languages),
          location = COALESCE($15, location),
          timezone = COALESCE($16, timezone),
          website_url = COALESCE($17, website_url),
          linkedin_url = COALESCE($18, linkedin_url),
          twitter_handle = COALESCE($19, twitter_handle),
          equipment = COALESCE($20, equipment),
          software = COALESCE($21, software)
        WHERE user_id = $1`,
        [
          id, headline, bio, specialisation, niches, hourlyRateMin, hourlyRateMax,
          projectRateMin, projectRateMax, currency,
          portfolioLinks ? JSON.stringify(portfolioLinks) : null,
          availability, yearsExperience, languages, location, timezone,
          websiteUrl, linkedinUrl, twitterHandle, equipment, software,
        ]
      );
    } else if (role === 'client') {
      const {
        companyName, companyWebsite, industry, companySize, bio,
        podcastGoals, budgetRange, location, timezone, linkedinUrl,
      } = req.body;

      await query(
        `UPDATE client_profiles SET
          company_name = COALESCE($2, company_name),
          company_website = COALESCE($3, company_website),
          industry = COALESCE($4, industry),
          company_size = COALESCE($5, company_size),
          bio = COALESCE($6, bio),
          podcast_goals = COALESCE($7, podcast_goals),
          budget_range = COALESCE($8, budget_range),
          location = COALESCE($9, location),
          timezone = COALESCE($10, timezone),
          linkedin_url = COALESCE($11, linkedin_url)
        WHERE user_id = $1`,
        [
          id, companyName, companyWebsite, industry, companySize,
          bio, podcastGoals, budgetRange, location, timezone, linkedinUrl,
        ]
      );
    }

    // Update display name / avatar on users table
    const { displayName, avatarUrl } = req.body;
    if (displayName || avatarUrl) {
      await query(
        `UPDATE users SET
          display_name = COALESCE($2, display_name),
          avatar_url = COALESCE($3, avatar_url)
        WHERE id = $1`,
        [id, displayName, avatarUrl]
      );
    }

    res.json({ message: 'Profile updated' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
