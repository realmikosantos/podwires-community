const { Router } = require('express');
const { optionalAuth } = require('../middleware/auth');

const router = Router();

const WP_API_URL = process.env.WP_API_URL || 'https://podwires.com/wp-json/wp/v2';

// Simple in-memory cache (5 min TTL)
let cache = { data: null, ts: 0 };
const CACHE_TTL = 5 * 60 * 1000;

/**
 * GET /api/events — Proxy WordPress podcast_event post type
 */
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { per_page = 20, page = 1 } = req.query;

    // Serve from cache if fresh
    const cacheKey = `${per_page}-${page}`;
    if (cache.key === cacheKey && Date.now() - cache.ts < CACHE_TTL && cache.data) {
      return res.json(cache.data);
    }

    const params = new URLSearchParams({
      per_page: String(per_page),
      page:     String(page),
      _embed:   '1',
      orderby:  'date',
      order:    'desc',
      status:   'publish',
    });

    const response = await fetch(
      `${WP_API_URL}/podcast_event?${params}`,
      { headers: { 'User-Agent': 'PodwiresCommunity/1.0' } }
    );

    if (!response.ok) {
      // Fall through — return empty so the client degrades gracefully
      return res.json({ events: [], total: 0, totalPages: 1, page: 1 });
    }

    const raw = await response.json();
    const totalPages = parseInt(response.headers.get('x-wp-totalpages') || '1', 10);
    const total      = parseInt(response.headers.get('x-wp-total') || '0', 10);

    const events = raw.map(post => {
      const media = post._embedded?.['wp:featuredmedia']?.[0];
      // Strip HTML from content for description
      const rawDesc = post.excerpt?.rendered || post.content?.rendered || '';
      const description = rawDesc.replace(/<[^>]*>/g, '').trim().slice(0, 300);

      return {
        id:          post.id,
        title:       post.title?.rendered || 'Untitled Event',
        description,
        date:        post.date,
        link:        post.link,
        slug:        post.slug,
        coverImage:  media?.source_url || null,
        coverAlt:    media?.alt_text   || '',
        // Custom meta fields — present if ACF / custom fields are enabled
        eventDate:   post.meta?.event_date   || post.meta?.['_event_date']   || null,
        eventTime:   post.meta?.event_time   || post.meta?.['_event_time']   || null,
        eventType:   post.meta?.event_type   || post.meta?.['_event_type']   || 'event',
        location:    post.meta?.location     || post.meta?.['_location']     || null,
        ticketUrl:   post.meta?.ticket_url   || post.meta?.['_ticket_url']   || post.link,
      };
    });

    const payload = { events, total, totalPages, page: parseInt(page, 10) };

    // Cache it
    cache = { key: cacheKey, data: payload, ts: Date.now() };

    res.json(payload);
  } catch (err) {
    // Never crash the community if WP is down — return empty
    console.error('[events proxy]', err.message);
    res.json({ events: [], total: 0, totalPages: 1, page: 1 });
  }
});

module.exports = router;
