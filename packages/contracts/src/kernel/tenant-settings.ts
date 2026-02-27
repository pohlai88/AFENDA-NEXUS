import { z } from 'zod';

// ─── Tenant Settings (business behavior) ─────────────────────────────────────
// Org-scoped, auditable. Changes require owner/admin role.
// Versioned for JSONB migration safety (I-KRN-04, I-KRN-06).

export const TenantSettingsSchema = z.object({
  settingsVersion: z.number().int().min(1).default(1),
  fiscalYearStart: z
    .object({
      month: z.number().min(1).max(12),
      day: z.number().min(1).max(31),
    })
    .default({ month: 1, day: 1 }),
  defaultCurrency: z.string().min(3).max(8).default('USD'),
  locale: z.string().default('en-MY'),
  timezone: z.string().default('Asia/Kuala_Lumpur'),
  dateFormat: z.enum(['YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY']).default('YYYY-MM-DD'),
  numberFormat: z
    .object({
      decimal: z.enum(['.', ',']).default('.'),
      thousands: z.enum([',', '.', ' ']).default(','),
    })
    .default({ decimal: '.', thousands: ',' }),
  approvalThresholds: z
    .object({
      apInvoice: z.number().nonnegative().default(0),
      journal: z.number().nonnegative().default(0),
    })
    .default({ apInvoice: 0, journal: 0 }),
});
export type TenantSettings = z.infer<typeof TenantSettingsSchema>;

export const UpdateTenantSettingsSchema = TenantSettingsSchema.partial().omit({
  settingsVersion: true,
});
export type UpdateTenantSettings = z.infer<typeof UpdateTenantSettingsSchema>;
