import { z } from 'zod';

// ─── Member & Invitation Schemas ──────────────────────────────────────────────
// Org-scoped. Only owner/admin can invoke member mutations (I-KRN-01, I-KRN-02).

export const OrgRoleSchema = z.enum([
  'owner',
  'admin',
  'accountant',
  'clerk',
  'viewer',
  'member',
]);
export type OrgRole = z.infer<typeof OrgRoleSchema>;

export const InviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'accountant', 'clerk', 'viewer', 'member']),
});
export type InviteMember = z.infer<typeof InviteMemberSchema>;

export const UpdateMemberRoleSchema = z.object({
  memberId: z.string(),
  role: z.enum(['admin', 'accountant', 'clerk', 'viewer', 'member']),
});
export type UpdateMemberRole = z.infer<typeof UpdateMemberRoleSchema>;
