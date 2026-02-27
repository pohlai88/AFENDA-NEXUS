// ─── Kernel Event Type Registry ───────────────────────────────────────────────
// Separate from FinanceEventType. All kernel-level domain events.

export const KernelEventType = {
  // Org-scoped
  ORG_PROFILE_UPDATED: 'ORG_PROFILE_UPDATED',
  ORG_SETTINGS_UPDATED: 'ORG_SETTINGS_UPDATED',
  MEMBER_INVITED: 'MEMBER_INVITED',
  MEMBER_ROLE_CHANGED: 'MEMBER_ROLE_CHANGED',
  MEMBER_REMOVED: 'MEMBER_REMOVED',
  INVITE_REVOKED: 'INVITE_REVOKED',
  INVITE_RESENT: 'INVITE_RESENT',
  // User-scoped
  USER_PREFERENCES_UPDATED: 'USER_PREFERENCES_UPDATED',
  // Platform-scoped (double-logged to admin_action_log)
  TENANT_SUSPENDED: 'TENANT_SUSPENDED',
  TENANT_REACTIVATED: 'TENANT_REACTIVATED',
  SYSTEM_CONFIG_UPDATED: 'SYSTEM_CONFIG_UPDATED',
} as const;

export type KernelEventType = (typeof KernelEventType)[keyof typeof KernelEventType];
