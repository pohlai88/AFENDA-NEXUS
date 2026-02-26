/**
 * Neon Auth — Server-side auth instance + helpers for the web app.
 *
 * Uses @neondatabase/auth which wraps Better Auth as a managed service.
 * Auth data lives in the neon_auth schema, managed by Neon.
 */
import { redirect } from 'next/navigation';
import { createNeonAuth } from '@neondatabase/auth/next/server';

// ─── Auth Instance ──────────────────────────────────────────────────────────

export const auth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL!,
  cookies: {
    secret: process.env.NEON_AUTH_COOKIE_SECRET!,
  },
});

// ─── Types ──────────────────────────────────────────────────────────────────

/** Unwrapped session shape from Neon Auth getSession() */
interface NeonSession {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
    [key: string]: unknown;
  };
  session: {
    token: string;
    activeOrganizationId?: string;
    [key: string]: unknown;
  };
}

// ─── Server-Side Helpers ────────────────────────────────────────────────────

/**
 * Get the current session from request headers (server component / action).
 * Returns `null` if not authenticated.
 *
 * Neon Auth's getSession() returns `{ data }` — we unwrap it here.
 */
export async function getServerSession(): Promise<NeonSession | null> {
  const result = await auth.getSession();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Neon Auth Data wrapper
  const data = (result as any)?.data ?? result;
  if (!data?.user) return null;
  return data as NeonSession;
}

/**
 * Require authentication. Redirects to /login if no valid session.
 */
export async function requireAuth(): Promise<NeonSession> {
  const session = await getServerSession();

  if (!session) {
    redirect('/login');
  }

  return session;
}

/**
 * Get the session token string from the current session.
 * Useful for passing as Bearer token to the API server.
 */
export async function getSessionToken(): Promise<string | undefined> {
  const session = await getServerSession();
  return session?.session?.token;
}

/**
 * Get the active organization (tenant) ID from the session.
 */
export async function getActiveOrganizationId(): Promise<string | undefined> {
  const session = await getServerSession();
  return session?.session?.activeOrganizationId ?? undefined;
}

/**
 * Build a request context for API calls.
 * Combines session + active organization.
 * Accepts an optional pre-fetched session to avoid redundant getSession() calls.
 */
export async function getRequestContext(existing?: NeonSession) {
  const session = existing ?? (await requireAuth());
  const tenantId = session.session.activeOrganizationId;
  if (!tenantId) {
    redirect('/onboarding');
  }
  return {
    userId: session.user.id,
    tenantId,
    token: session.session.token,
  };
}
