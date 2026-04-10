/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: require('path').join(__dirname, '../../'),
  // Required for Railway — sets the port Next.js listens on
  // Railway sets PORT env var automatically
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'podwires.com',
      },
      {
        protocol: 'https',
        hostname: '*.gravatar.com',
      },
      {
        // Allow Railway-hosted image URLs
        protocol: 'https',
        hostname: '*.railway.app',
      },
    ],
  },
  async rewrites() {
    // In development, proxy all /api/ calls through Next.js to avoid CORS.
    // In production on Railway, browser JS calls NEXT_PUBLIC_API_URL directly.
    // SSO routes are handled by Next.js API routes (src/app/api/auth/sso/route.ts)
    // which proxy to the Express backend — no rewrite needed here.
    if (process.env.NODE_ENV === 'production') return [];
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
