const { Router } = require('express');
const { optionalAuth } = require('../middleware/auth');

const router = Router();

const WP_API_URL = process.env.WP_API_URL || 'https://podwires.com/wp-json/wp/v2';

/**
 * GET /api/jobs — Fetch job listings from Podwires.com WordPress REST API
 */
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { page = 1, per_page = 20, search, category } = req.query;

    const params = new URLSearchParams({
      page: String(page),
      per_page: String(per_page),
      _embed: '1',
    });

    if (search) params.append('search', search);
    if (category) params.append('categories', category);

    const response = await fetch(`${WP_API_URL}/posts?${params}`, {
      headers: {
        'User-Agent': 'PodwiresCommunity/1.0',
      },
    });

    if (!response.ok) {
      return res.status(502).json({ error: 'Failed to fetch jobs from Podwires.com' });
    }

    const posts = await response.json();
    const totalPages = parseInt(response.headers.get('x-wp-totalpages') || '1', 10);
    const total = parseInt(response.headers.get('x-wp-total') || '0', 10);

    const jobs = posts.map((post) => ({
      id: post.id,
      title: post.title?.rendered,
      excerpt: post.excerpt?.rendered,
      content: post.content?.rendered,
      link: post.link,
      date: post.date,
      featuredImage: post._embedded?.['wp:featuredmedia']?.[0]?.source_url,
      categories: post._embedded?.['wp:term']?.[0]?.map((t) => t.name),
    }));

    res.json({ jobs, total, totalPages, page: parseInt(page, 10) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
