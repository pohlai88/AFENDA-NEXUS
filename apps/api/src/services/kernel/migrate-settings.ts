import { TenantSettingsSchema, type TenantSettings } from '@afenda/contracts';

const CURRENT_VERSION = 1;

/**
 * Pure function: migrate tenant settings JSONB from an older version to current.
 * Returns { settings, migrated } — caller does lazy write-back if migrated=true.
 *
 * Invariant I-KRN-06: settings are always validated through Zod on read.
 */
export function migrateSettings(raw: unknown): {
  settings: TenantSettings;
  migrated: boolean;
} {
  // Parse with defaults — fills in any missing fields
  const parsed = TenantSettingsSchema.safeParse(raw ?? {});

  if (!parsed.success) {
    // Invalid JSONB — return full defaults
    return {
      settings: TenantSettingsSchema.parse({}),
      migrated: true,
    };
  }

  const settings = parsed.data;
  let migrated = false;

  // Future version migrations go here:
  // if (settings.settingsVersion < 2) { ... settings.settingsVersion = 2; migrated = true; }

  if (settings.settingsVersion < CURRENT_VERSION) {
    settings.settingsVersion = CURRENT_VERSION;
    migrated = true;
  }

  return { settings, migrated };
}
