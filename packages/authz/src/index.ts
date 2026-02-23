/**
 * @afenda/authz — Policies, roles, permission evaluation.
 *
 * Pure authorization logic. No DB — infra adapters load policies.
 */
import type { TenantId, UserId } from "@afenda/core";

// ─── Permission Types ───────────────────────────────────────────────────────

export type Action = "create" | "read" | "update" | "delete" | "post" | "void" | "reverse";
export type Resource = string;

export interface Permission {
  readonly resource: Resource;
  readonly action: Action;
}

// ─── Role ───────────────────────────────────────────────────────────────────

export interface Role {
  readonly name: string;
  readonly permissions: readonly Permission[];
}

// ─── Policy ─────────────────────────────────────────────────────────────────

export interface PolicyContext {
  readonly tenantId: TenantId;
  readonly userId: UserId;
  readonly roles: readonly Role[];
}

export function can(
  ctx: PolicyContext,
  resource: Resource,
  action: Action,
): boolean {
  return ctx.roles.some((role) =>
    role.permissions.some(
      (p) => p.resource === resource && p.action === action,
    ),
  );
}

export function assertCan(
  ctx: PolicyContext,
  resource: Resource,
  action: Action,
): void {
  if (!can(ctx, resource, action)) {
    throw new Error(`Forbidden: ${action} on ${resource}`);
  }
}
