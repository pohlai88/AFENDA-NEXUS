'use server';

import { revalidatePath } from 'next/cache';
import { getRequestContext } from '@/lib/auth';
import { createApiClient } from '@/lib/api-client';

export async function adminTenantAction(
  tenantId: string,
  action: 'suspend' | 'reactivate'
): Promise<{ ok: boolean; error?: string }> {
  try {
    const ctx = await getRequestContext();
    const api = createApiClient(ctx);
    const result = await api.post<{ ok: boolean }>(`/admin/tenants/${tenantId}/${action}`, {});

    if (!result.ok) {
      return { ok: false, error: result.error.message };
    }

    revalidatePath('/(shell)/admin/tenants', 'page');
    return { ok: true };
  } catch {
    return { ok: false, error: `Failed to ${action} tenant` };
  }
}
