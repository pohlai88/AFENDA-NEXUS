'use server';

import { revalidatePath } from 'next/cache';
import { requireAuth, getRequestContext } from './auth';
import { createApiClient } from './api-client';

/**
 * Server action: called after client-side org.setActive() to refresh
 * the server-side context. Verifies the session has the new activeOrgId
 * and revalidates the shell layout so KernelContext rebuilds.
 *
 * Golden rule (I-KRN-05): server is authoritative for org identity.
 * I-KRN-08: persists lastActiveOrgId to user preferences for session restore.
 */
export async function switchOrganizationAction(): Promise<{
  ok: boolean;
  activeOrgId?: string;
  error?: string;
}> {
  try {
    const session = await requireAuth();
    const activeOrgId = session.session.activeOrganizationId;

    if (!activeOrgId) {
      return { ok: false, error: 'No active organization after switch' };
    }

    // I-KRN-08: persist lastActiveOrgId to user preferences (fire-and-forget)
    const ctx = await getRequestContext(session);
    const api = createApiClient(ctx);
    api.patch('/me/preferences', { lastActiveOrgId: activeOrgId }).catch(() => {
      // Non-blocking — preference save failure should not block org switch
    });

    revalidatePath('/(shell)', 'layout');

    return { ok: true, activeOrgId };
  } catch {
    return { ok: false, error: 'Failed to verify organization switch' };
  }
}
