import { z } from 'zod';

// ─── Admin Schemas (platform control plane) ───────────────────────────────────
// Super-admin only. All actions double-logged (I-KRN-07).

export const AdminActionSchema = z.object({
  action: z.enum(['suspend', 'reactivate', 'set_plan_tier']),
  reason: z.string().min(1).optional(),
  planTier: z.enum(['free', 'pro', 'enterprise']).optional(),
});
export type AdminAction = z.infer<typeof AdminActionSchema>;

export const TenantListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'DEACTIVATED']).optional(),
  search: z.string().optional(),
});
export type TenantListQuery = z.infer<typeof TenantListQuerySchema>;
