'use server';

import { revalidatePath } from 'next/cache';
import { requireAuth } from './auth';
import { routes } from './constants';
import { organization } from './auth-client';

/**
 * I-KRN-01/02/03: Resolve org members from Neon Auth API.
 * Used to enforce ownership invariants server-side.
 */
async function resolveOrgMembers(
  token: string,
  orgId: string
): Promise<Array<{ userId: string; role: string }>> {
  const neonAuthBaseUrl = process.env.NEON_AUTH_BASE_URL;
  if (!neonAuthBaseUrl) return [];

  try {
    const resp = await fetch(`${neonAuthBaseUrl}/api/auth/get-full-organization`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: `neonauth.session_token=${token}`,
      },
      body: JSON.stringify({ organizationId: orgId }),
    });
    if (!resp.ok) return [];
    const data = (await resp.json()) as { members?: Array<{ userId: string; role: string }> };
    return data.members ?? [];
  } catch {
    return [];
  }
}

/**
 * Invite a member to the active organization.
 * Guard: caller must be owner/admin (enforced at page level via requireOrgRole).
 */
export async function inviteMemberAction(data: {
  email: string;
  role: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const session = await requireAuth();
    const orgId = session.session.activeOrganizationId;
    if (!orgId) return { ok: false, error: 'No active organization' };

    const { error } = await organization.inviteMember({
      organizationId: orgId,
      email: data.email,
      role: data.role as 'admin' | 'member',
    });

    if (error) {
      return { ok: false, error: (error as { message?: string }).message ?? 'Failed to send invitation' };
    }

    revalidatePath(routes.settingsMembers, 'page');
    return { ok: true };
  } catch {
    return { ok: false, error: 'Failed to send invitation' };
  }
}

/**
 * Update a member's role.
 * I-KRN-01: Cannot demote the last owner.
 * I-KRN-02: Only owner can transfer ownership (Neon Auth enforces this).
 * I-KRN-03: Admin cannot demote self if it orphans admin controls.
 */
export async function updateMemberRoleAction(data: {
  memberId: string;
  role: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const session = await requireAuth();
    const orgId = session.session.activeOrganizationId;
    if (!orgId) return { ok: false, error: 'No active organization' };

    // I-KRN-01: Prevent demoting the last owner
    const members = await resolveOrgMembers(session.session.token, orgId);
    const targetMember = members.find((m) => m.userId === data.memberId);
    if (targetMember?.role === 'owner' && data.role !== 'owner') {
      const ownerCount = members.filter((m) => m.role === 'owner').length;
      if (ownerCount <= 1) {
        return { ok: false, error: 'Cannot demote the last owner. Transfer ownership first.' };
      }
    }

    // I-KRN-03: Prevent admin self-demotion if it orphans admin controls
    if (data.memberId === session.user.id && targetMember?.role === 'admin' && data.role !== 'admin' && data.role !== 'owner') {
      const adminCount = members.filter((m) => m.role === 'admin' || m.role === 'owner').length;
      if (adminCount <= 1) {
        return { ok: false, error: 'Cannot demote yourself — no other admin/owner exists.' };
      }
    }

    const { error } = await organization.updateMemberRole({
      organizationId: orgId,
      memberId: data.memberId,
      role: data.role as 'admin' | 'member',
    });

    if (error) {
      return { ok: false, error: (error as { message?: string }).message ?? 'Failed to update role' };
    }

    revalidatePath(routes.settingsMembers, 'page');
    return { ok: true };
  } catch {
    return { ok: false, error: 'Failed to update role' };
  }
}

/**
 * Remove a member from the organization.
 * I-KRN-01: Cannot remove the last owner.
 * I-KRN-02: Only owner can remove other owners (Neon Auth enforces this).
 */
export async function removeMemberAction(data: {
  memberId: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const session = await requireAuth();
    const orgId = session.session.activeOrganizationId;
    if (!orgId) return { ok: false, error: 'No active organization' };

    // I-KRN-01: Prevent removing the last owner
    const members = await resolveOrgMembers(session.session.token, orgId);
    const targetMember = members.find((m) => m.userId === data.memberId);
    if (targetMember?.role === 'owner') {
      const ownerCount = members.filter((m) => m.role === 'owner').length;
      if (ownerCount <= 1) {
        return { ok: false, error: 'Cannot remove the last owner. Transfer ownership first.' };
      }
    }

    const { error } = await organization.removeMember({
      organizationId: orgId,
      memberIdOrEmail: data.memberId,
    });

    if (error) {
      return { ok: false, error: (error as { message?: string }).message ?? 'Failed to remove member' };
    }

    revalidatePath(routes.settingsMembers, 'page');
    return { ok: true };
  } catch {
    return { ok: false, error: 'Failed to remove member' };
  }
}

/**
 * Revoke a pending invitation.
 */
export async function revokeInvitationAction(data: {
  invitationId: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const session = await requireAuth();
    const orgId = session.session.activeOrganizationId;
    if (!orgId) return { ok: false, error: 'No active organization' };

    const { error } = await organization.cancelInvitation({
      invitationId: data.invitationId,
    });

    if (error) {
      return { ok: false, error: (error as { message?: string }).message ?? 'Failed to revoke invitation' };
    }

    revalidatePath(routes.settingsMembers, 'page');
    return { ok: true };
  } catch {
    return { ok: false, error: 'Failed to revoke invitation' };
  }
}
