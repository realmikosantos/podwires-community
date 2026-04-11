const { Router } = require('express');
const { optionalAuth } = require('../middleware/auth');

const router = Router();

const WP_API_URL = process.env.WP_API_URL || 'https://podwires.com/wp-json/wp/v2';

// Simple in-memory cache (10 min TTL)
let cache = { data: null, ts: 0 };
const CACHE_TTL = 10 * 60 * 1000;

/**
 * GET /api/blog — Proxy WordPress blog posts (for Trending Posts widget)
 */
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { per_page = 5 } = req.query;

    if (cache.data && Date.now() - cache.ts < CACHE_TTL) {
      return res.json(cache.data);
    }

    const params = new URLSearchParams({
      per_page: String(per_page),
      _embed:   '1',
      orderby:  'date',
      order:    'desc',
      status:   'publish',
    });

    const response = await fetch(
      `${WP_API_URL}/posts?${params}`,
      { headers: { 'User-Agent': 'PodwiresCommunity/1.0' } }
    );

    if (!response.ok) {
      return res.json({ posts: [] });
    }

    const raw = await response.json();

    const posts = raw.map(post => {
      const media  = post._embedded?.['wp:featuredmedia']?.[0];
      const author = post._embedded?.author?.[0];
      const rawExcerpt = post.excerpt?.rendered || '';
      const excerpt = rawExcerpt.replace(/<[^>]*>/g, '').trim().slice(0, 160);

      return {
        id:          post.id,
        title:       post.title?.rendered || 'Untitled',
        excerpt,
        link:        post.link,
        date:        post.date,
        slug:        post.slug,
        coverImage:  media?.source_url || null,
        authorName:  author?.name || 'Podwires',
        authorAvatar: author?.avatar_urls?.['48'] || null,
      };
    });

    const payload = { posts };
    cache = { data: payload, ts: Date.now() };

    res.json(payload);
  } catch (err) {
    console.error('[blog proxy]', err.message);
    res.json({ posts: [] });
  }
});

module.exports = router;
