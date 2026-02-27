import { z } from 'zod';

// ─── User Preferences (UX only) ──────────────────────────────────────────────
// User-scoped, non-audited. Pure UX: theme, density, sidebar state, etc.

export const UserPreferencesSchema = z.object({
  theme: z.enum(['system', 'light', 'dark']).default('system'),
  density: z.enum(['default', 'compact', 'ultra']).default('default'),
  sidebarCollapsed: z.boolean().default(false),
  lastActiveOrgId: z.string().uuid().optional(),
  tablePresets: z.record(z.string(), z.any()).default({}),
});
export type UserPreferences = z.infer<typeof UserPreferencesSchema>;

export const UpdateUserPreferencesSchema = UserPreferencesSchema.partial();
export type UpdateUserPreferences = z.infer<typeof UpdateUserPreferencesSchema>;
