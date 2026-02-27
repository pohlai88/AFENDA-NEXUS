import { z } from 'zod';

// ─── System Config (admin-controlled) ─────────────────────────────────────────
// Platform-scoped. Changes require super-admin and are double-logged.

export const SystemConfigValueSchema = z.union([
  z.boolean(),
  z.number(),
  z.string(),
  z.record(z.string(), z.any()),
  z.array(z.any()),
]);
export type SystemConfigValue = z.infer<typeof SystemConfigValueSchema>;

export const SystemConfigEntrySchema = z.object({
  key: z.string().min(2).max(120),
  value: SystemConfigValueSchema,
});
export type SystemConfigEntry = z.infer<typeof SystemConfigEntrySchema>;
