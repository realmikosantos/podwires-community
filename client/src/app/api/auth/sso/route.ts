import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/auth/sso?token=...
 *
 * Proxy the WordPress SSO token to the Express backend.
 *
 * Why this route exists:
 *   community.podwires.com runs the Next.js client (port 3000) and the Express
 *   backend (port 5000) on the same Contabo VPS behind Nginx. WordPress
 *   redirects to community.podwires.com/api/auth/sso — which Nginx routes to
 *   the Next.js client. This route bridges to the Express backend.
 *
 * Required env var:
 *   BACKEND_URL=http://localhost:5000  (defaults to NEXT_PUBLIC_API_URL)
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  if (!token) {
    return NextResponse.redirect(new URL('/?sso_error=missing_token', request.url));
  }

  try {
    const upstream = new URL(`${backendUrl}/api/auth/sso`);
    upstream.searchParams.set('token', token);

    const res = await fetch(upstream.toString(), {
      method: 'GET',
      redirect: 'manual', // don't follow — we forward the redirect to the browser
    });

    // Express returns 302 → /auth/sso-callback?code=...
    const location = res.headers.get('location');
    if (location) {
      return NextResponse.redirect(location, { status: 302 });
    }

    // Express returned an error response
    return NextResponse.redirect(new URL('/?sso_error=backend_error', request.url));
  } catch {
    return NextResponse.redirect(new URL('/?sso_error=backend_unreachable', request.url));
  }
}
