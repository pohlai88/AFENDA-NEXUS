'use server';

import { revalidatePath } from 'next/cache';
import { getRequestContext } from '@/lib/auth';
import { createApiClient } from '@/lib/api-client';

export async function saveConfigAction(
  key: string,
  value: Record<string, unknown>
): Promise<{ ok: boolean; error?: string }> {
  try {
    const ctx = await getRequestContext();
    const api = createApiClient(ctx);
    const result = await api.put<{ ok: boolean }>(`/admin/config/${encodeURIComponent(key)}`, value);

    if (!result.ok) {
      return { ok: false, error: result.error.message };
    }

    revalidatePath('/(shell)/admin/config', 'page');
    return { ok: true };
  } catch {
    return { ok: false, error: 'Failed to save config' };
  }
}
