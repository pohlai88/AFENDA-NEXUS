'use server';

import { revalidatePath } from 'next/cache';
import { getRequestContext } from '@/lib/auth';
import { createApiClient } from '@/lib/api-client';
import type { TenantSettings } from '@afenda/contracts';

export async function saveOrgSettingsAction(
  patch: Partial<TenantSettings>
): Promise<{ ok: boolean; error?: string }> {
  try {
    const ctx = await getRequestContext();
    const api = createApiClient(ctx);
    const result = await api.patch<{ before: TenantSettings; after: TenantSettings }>(
      '/settings/org',
      patch
    );

    if (!result.ok) {
      return { ok: false, error: result.error.message };
    }

    revalidatePath('/(shell)/settings/organization/config', 'page');
    return { ok: true };
  } catch {
    return { ok: false, error: 'Failed to save settings' };
  }
}
