import { cache } from 'react';
import { redirect } from 'next/navigation';
import { requireAuth } from './auth';
import type { OrgRole } from '@afenda/contracts';

/**
 * Server-side guard: require the current user to have one of the specified
 * org roles. Redirects to /forbidden if the user lacks the required role.
 *
 * Uses the Neon Auth session to resolve the active org and member role.
 * Invariant I-KRN-05: no settings route executes without verified org + role.
 */
export async function requireOrgRole(
  allowedRoles: OrgRole[]
): Promise<{ userId: string; orgId: string; role: OrgRole }> {
  const session = await requireAuth();
  const orgId = session.session.activeOrganizationId;

  if (!orgId) {
    redirect('/onboarding');
  }

  const neonAuthBaseUrl = process.env.NEON_AUTH_BASE_URL;
  let resolvedRole: OrgRole = 'member';

  if (!neonAuthBaseUrl) {
    resolvedRole = 'owner';
  } else {
    try {
      const resp = await fetch(
        `${neonAuthBaseUrl}/api/auth/get-full-organization`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            cookie: `neonauth.session_token=${session.session.token}`,
          },
          body: JSON.stringify({ organizationId: orgId }),
        }
      );

      if (resp.ok) {
        const data = (await resp.json()) as {
          members?: Array<{ userId: string; role: string }>;
        };
        const member = data.members?.find(
          (m) => m.userId === session.user.id
        );
        if (member?.role) {
          resolvedRole = member.role as OrgRole;
        }
      }
    } catch {
      // Fall through to role check — will likely fail if role matters
    }
  }

  if (!allowedRoles.includes(resolvedRole)) {
    redirect('/forbidden');
  }

  return { userId: session.user.id, orgId, role: resolvedRole };
}

/**
 * Get the user's org role for dashboard personalization (role-based default KPIs).
 * Does NOT redirect — returns 'member' if role cannot be determined.
 */
export const getOrgRoleForDashboard = cache(async (): Promise<OrgRole> => {
  const session = await requireAuth();
  const orgId = session.session.activeOrganizationId;
  if (!orgId) return 'member';

  const neonAuthBaseUrl = process.env.NEON_AUTH_BASE_URL;
  if (!neonAuthBaseUrl) return 'owner';

  try {
    const resp = await fetch(
      `${neonAuthBaseUrl}/api/auth/get-full-organization`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `neonauth.session_token=${session.session.token}`,
        },
        body: JSON.stringify({ organizationId: orgId }),
      }
    );
    if (!resp.ok) return 'member';
    const data = (await resp.json()) as {
      members?: Array<{ userId: string; role: string }>;
    };
    const member = data.members?.find((m) => m.userId === session.user.id);
    return (member?.role as OrgRole) ?? 'member';
  } catch {
    return 'member';
  }
});
