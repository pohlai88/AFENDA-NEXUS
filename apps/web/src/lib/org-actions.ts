'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAuth } from './auth';
import { organization } from './auth-client';

/**
 * Update org profile (name, slug). Owner/admin only.
 * Calls Neon Auth to update the org, then revalidates.
 */
export async function updateOrgProfileAction(data: {
  name?: string;
  slug?: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const session = await requireAuth();
    const orgId = session.session.activeOrganizationId;
    if (!orgId) return { ok: false, error: 'No active organization' };

    if (data.name) {
      const { error } = await organization.update({
        organizationId: orgId,
        data: { name: data.name, slug: data.slug },
      });
      if (error) {
        return { ok: false, error: (error as { message?: string }).message ?? 'Failed to update organization' };
      }
    }

    revalidatePath('/(shell)', 'layout');
    return { ok: true };
  } catch {
    return { ok: false, error: 'Failed to update organization' };
  }
}

/**
 * Delete org. Owner only. Danger zone.
 */
export async function deleteOrgAction(): Promise<{ ok: boolean; error?: string }> {
  try {
    const session = await requireAuth();
    const orgId = session.session.activeOrganizationId;
    if (!orgId) return { ok: false, error: 'No active organization' };

    const { error } = await organization.delete({ organizationId: orgId });
    if (error) {
      return { ok: false, error: (error as { message?: string }).message ?? 'Failed to delete organization' };
    }

    redirect('/onboarding');
  } catch (e) {
    // redirect() throws — rethrow it
    if (e && typeof e === 'object' && 'digest' in e) throw e;
    return { ok: false, error: 'Failed to delete organization' };
  }
}
