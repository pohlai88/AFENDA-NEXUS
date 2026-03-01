'use server';

import { revalidatePath } from 'next/cache';
import { getRequestContext } from '@/lib/auth';
import { createApiClient } from '@/lib/api-client';
import type { UserPreferences, DashboardPrefs } from '@afenda/contracts';

export type SaveDashboardPrefsResult = { ok: true } | { ok: false; error: string };

/**
 * Save dashboard preferences for a specific domain.
 * Deep-merges the domain key into the existing `dashboards` map,
 * then patches the full `dashboards` object to the API.
 */
export async function saveDashboardPrefs(
  domainId: string,
  prefs: DashboardPrefs,
): Promise<SaveDashboardPrefsResult> {
  try {
    const ctx = await getRequestContext();
    const api = createApiClient(ctx);

    // 1. Read current preferences (to get existing dashboards map)
    const current = await api.get<UserPreferences>('/me/preferences');
    const currentDashboards = current.ok ? (current.value.dashboards ?? {}) : {};

    // 2. Deep-merge the domain key
    const merged = {
      ...currentDashboards,
      [domainId]: {
        ...(currentDashboards[domainId] ?? {}),
        ...prefs,
      },
    };

    // 3. Patch back
    await api.patch('/me/preferences', { dashboards: merged });

    // 4. Revalidate finance dashboard so comparison mode / role defaults update
    revalidatePath('/finance');
    return { ok: true };
  } catch (err) {
    console.error('[DashboardPrefs] Failed to save:', domainId, err);
    const message = err instanceof Error ? err.message : 'Failed to save preferences';
    return { ok: false, error: message };
  }
}
