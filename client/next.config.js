/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: require('path').join(__dirname, '../../'),
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
        protocol: 'https',
        hostname: 'community.podwires.com',
      },
    ],
  },
  async rewrites() {
    // In development, proxy all /api/ calls through Next.js to avoid CORS.
    // In production (Contabo VPS), Nginx routes /api/* to the Express backend
    // on port 5000, so the browser calls the same origin — no rewrite needed.
    // SSO routes are handled by Next.js API routes (src/app/api/auth/sso/route.ts)
    // which proxy to the Express backend.
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
