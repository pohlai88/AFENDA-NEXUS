/**
 * @afenda/authz — Authorization (pure RBAC).
 *
 * - Permissions: ERP access control roles (see ./permissions.ts)
 * - Authz: Pure policy evaluation (can / assertCan)
 *
 * Authentication is handled by Neon Auth (@neondatabase/auth).
 */
import type { TenantId, UserId } from '@afenda/core';
import type { Action, RoleDefinition as Role } from './permissions.js';

// ─── Permissions (ERP RBAC) ─────────────────────────────────────────────────

export {
  roles,
  owner,
  admin,
  accountant,
  clerk,
  viewer,
  member,
  erpStatements,
  type RoleName,
  type Action,
  type Permission,
  type RoleDefinition,
} from './permissions.js';

// ─── Role (re-export for backward compat) ───────────────────────────────────

export type { RoleDefinition as Role } from './permissions.js';
export type Resource = string;

// Re-export branded ID types for consumers
export type { TenantId, UserId };

// ─── Policy ─────────────────────────────────────────────────────────────────

export interface PolicyContext {
  readonly tenantId: string;
  readonly userId: string;
  readonly roles: readonly Role[];
}

export function can(
  ctx: PolicyContext,
  resource: Resource,
  action: Action
): boolean {
  return ctx.roles.some((role) =>
    role.permissions.some((p) => p.resource === resource && p.action === action)
  );
}

export function assertCan(
  ctx: PolicyContext,
  resource: Resource,
  action: Action
): void {
  if (!can(ctx, resource, action)) {
    throw new Error(`Forbidden: ${action} on ${resource}`);
  }
}
