'use server';

import { revalidatePath } from 'next/cache';
import { getRequestContext } from '@/lib/auth';
import { createApiClient } from '@/lib/api-client';
import type { UserPreferences } from '@afenda/contracts';

export async function savePreferencesAction(
  patch: Partial<UserPreferences>
): Promise<{ ok: boolean; error?: string }> {
  try {
    const ctx = await getRequestContext();
    const api = createApiClient(ctx);
    const result = await api.patch<UserPreferences>('/me/preferences', patch);

    if (!result.ok) {
      return { ok: false, error: result.error.message };
    }

    revalidatePath('/(shell)/settings/preferences', 'page');
    return { ok: true };
  } catch {
    return { ok: false, error: 'Failed to save preferences' };
  }
}
