// ─── Kernel Contracts ─────────────────────────────────────────────────────────
// Re-exports all kernel-layer Zod schemas, types, and events.

export {
  TenantSettingsSchema,
  UpdateTenantSettingsSchema,
  type TenantSettings,
  type UpdateTenantSettings,
} from './tenant-settings.js';

export {
  DashboardPrefsSchema,
  TimeRangeSchema,
  type DashboardPrefs,
  type TimeRange,
  type WidgetLayoutItem,
  UserPreferencesSchema,
  UpdateUserPreferencesSchema,
  type UserPreferences,
  type UpdateUserPreferences,
} from './user-preferences.js';

export {
  SystemConfigValueSchema,
  SystemConfigEntrySchema,
  type SystemConfigValue,
  type SystemConfigEntry,
} from './system-config.js';

export {
  AdminActionSchema,
  TenantListQuerySchema,
  type AdminAction,
  type TenantListQuery,
} from './admin.js';

export {
  OrgRoleSchema,
  InviteMemberSchema,
  UpdateMemberRoleSchema,
  type OrgRole,
  type InviteMember,
  type UpdateMemberRole,
} from './members.js';

export { KernelEventType } from './events.js';
