/**
 * Next.js 16 Proxy — Route protection using Neon Auth middleware.
 *
 * Uses the v16 `proxy()` + `config` convention (replaces middleware.ts).
 * Delegates to `auth.middleware()` for protected routes which handles:
 *   1. OAuth token exchange (session verifier → session cookie)
 *   2. Session validation via signed cookie / upstream API
 *   3. Redirect to /login when unauthenticated
 *
 * Public paths (login, register, etc.) are allowed through without a
 * session check so unauthenticated users can reach auth pages.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { routes } from '@/lib/constants';

const PUBLIC_PATHS = [
  routes.login,
  routes.register,
  routes.resetPassword,
  routes.forgotPassword,
  // '/two-factor', — MFA not yet supported in Neon Auth (on roadmap)
  routes.onboarding,
  routes.verifyEmail,
  routes.acceptInvite,
];

// Neon Auth middleware — handles OAuth callback exchange, session refresh, redirects
const neonAuthProxy = auth.middleware({ loginUrl: routes.login });

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow auth API routes (handled by [...path] route handler)
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // Allow public auth pages (login, register, etc.)
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Allow other API routes (protected at the API layer, not here)
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Delegate to Neon Auth middleware for protected routes:
  // - Exchanges OAuth session verifier → session cookie on callback
  // - Validates existing session cookies (signed JWT cache)
  // - Redirects to /login if unauthenticated
  const response = await neonAuthProxy(request);

  // Add security headers (RSC/server-action requests bypass proxy via matcher)
  if (response) {
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  }

  return response;
}

export const config = {
  matcher: [
    {
      source: '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
      // Bypass proxy for server actions and RSC fetches — they require
      // content-type: text/x-component; proxy/auth can corrupt the response.
      missing: [
        { type: 'header', key: 'next-action' },
        { type: 'header', key: 'rsc' },
      ],
    },
  ],
};
