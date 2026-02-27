import type { DbClient } from '@afenda/db';
import { tenants } from '@afenda/db';
import { eq, sql } from 'drizzle-orm';
import {
  TenantSettingsSchema,
  UpdateTenantSettingsSchema,
  type TenantSettings,
  type UpdateTenantSettings,
} from '@afenda/contracts';
import { migrateSettings } from './migrate-settings.js';

/**
 * Read org settings for a tenant. Validates + migrates version on read.
 * If migrated, does a lazy write-back (I-KRN-06).
 */
export async function getOrgSettings(
  db: DbClient,
  tenantId: string
): Promise<TenantSettings> {
  const [row] = await db
    .select({ settings: tenants.settings, settingsVersion: tenants.settingsVersion })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  if (!row) {
    return TenantSettingsSchema.parse({});
  }

  const { settings, migrated } = migrateSettings(row.settings);

  if (migrated) {
    await db
      .update(tenants)
      .set({
        settings: settings as unknown as Record<string, unknown>,
        settingsVersion: settings.settingsVersion,
        updatedAt: sql`now()`,
      })
      .where(eq(tenants.id, tenantId));
  }

  return settings;
}

/**
 * Update org settings. Validates patch, increments version, records actor + timestamp.
 * Returns { before, after } for audit diff (I-KRN-04).
 */
export async function updateOrgSettings(
  db: DbClient,
  tenantId: string,
  patch: UpdateTenantSettings,
  actorUserId: string
): Promise<{ before: TenantSettings; after: TenantSettings }> {
  const validatedPatch = UpdateTenantSettingsSchema.parse(patch);
  const before = await getOrgSettings(db, tenantId);

  const after: TenantSettings = {
    ...before,
    ...validatedPatch,
    settingsVersion: before.settingsVersion + 1,
  };

  // Final validation of merged result
  TenantSettingsSchema.parse(after);

  await db
    .update(tenants)
    .set({
      settings: after as unknown as Record<string, unknown>,
      settingsVersion: after.settingsVersion,
      settingsUpdatedBy: actorUserId,
      settingsUpdatedAt: sql`now()`,
      updatedAt: sql`now()`,
    })
    .where(eq(tenants.id, tenantId));

  return { before, after };
}
