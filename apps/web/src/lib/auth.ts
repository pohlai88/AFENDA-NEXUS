/**
 * Neon Auth — Server-side auth instance + helpers for the web app.
 *
 * Uses @neondatabase/auth which wraps Better Auth as a managed service.
 * Auth data lives in the neon_auth schema, managed by Neon.
 */
import { redirect } from 'next/navigation';
import { createNeonAuth } from '@neondatabase/auth/next/server';

// ─── Auth Instance ──────────────────────────────────────────────────────────
// Root .env is loaded by next.config.ts before module evaluation,
// so process.env is populated by the time this runs.

const baseUrl = process.env.NEON_AUTH_BASE_URL;
const cookieSecret = process.env.NEON_AUTH_COOKIE_SECRET;

if (!baseUrl) {
  throw new Error(
    'Missing env NEON_AUTH_BASE_URL. Copy .env.example → .env and fill in the Neon Auth values.',
  );
}
if (!cookieSecret) {
  throw new Error(
    'Missing env NEON_AUTH_COOKIE_SECRET. Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))"',
  );
}

export const auth = createNeonAuth({
  baseUrl,
  cookies: { secret: cookieSecret },
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

/**
 * I-KRN-08: Get the user's lastActiveOrgId from preferences.
 * Returns null if preferences are unavailable or lastActiveOrgId is not set.
 * Used by onboarding to auto-restore the last active org.
 */
export async function getLastActiveOrgId(session: NeonSession): Promise<string | null> {
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL;
  if (!apiBase) return null;

  try {
    const resp = await fetch(`${apiBase}/me/preferences`, {
      headers: {
        authorization: `Bearer ${session.session.token}`,
        'content-type': 'application/json',
      },
      cache: 'no-store',
    });
    if (!resp.ok) return null;
    const prefs = await resp.json();
    return prefs?.lastActiveOrgId ?? null;
  } catch {
    return null;
  }
}
