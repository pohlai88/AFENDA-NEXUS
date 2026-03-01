/**
 * Server-only admin visibility check.
 *
 * NeonSession.user has [key: string]: unknown — role is not yet formally surfaced.
 * This helper is the single update point when role is properly exposed.
 * Returns false if role is absent → Admin module excluded from rail (safe default).
 */
interface SessionLike {
  user: {
    id: string;
    [key: string]: unknown;
  };
}

export function isAdmin(session: SessionLike): boolean {
  const {role} = (session.user as Record<string, unknown>);
  return role === 'admin';
}
