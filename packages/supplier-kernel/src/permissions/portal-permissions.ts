/**
 * SP-1002: Portal Permissions Model — role-to-permission mapping + SoD rules.
 *
 * Pure data. No I/O, no DB.
 */

import type {
  PortalPermission,
  PortalRequestContext,
  PortalRole,
} from '../context/portal-request-context.js';

// ─── Permission Check ───────────────────────────────────────────────────────

/**
 * Check if a portal user has a specific permission.
 * Pure function — deterministic, no I/O.
 */
export function hasPortalPermission(
  ctx: PortalRequestContext,
  permission: PortalPermission
): boolean {
  return ctx.permissions.includes(permission);
}

/**
 * Assert a portal user has a specific permission.
 * Throws if the user lacks the permission.
 */
export function requirePortalPermission(
  ctx: PortalRequestContext,
  permission: PortalPermission
): void {
  if (!hasPortalPermission(ctx, permission)) {
    throw new PortalPermissionError(ctx.portalRole, permission);
  }
}

// ─── SoD Rules ──────────────────────────────────────────────────────────────

/**
 * Portal Separation of Duties rule.
 * Extends the FINANCE_SOD_RULES pattern for portal-specific workflows.
 */
export interface PortalSoDRule {
  readonly entityType: 'bankAccount' | 'apiKey' | 'case';
  readonly action: string;
  readonly conflictsWith: string;
  readonly description: string;
}

/**
 * Portal SoD policy points — pure data.
 *
 * - Bank account proposer cannot approve (2-person control)
 * - API key creator cannot activate (2-person control)
 * - Case resolver cannot reopen same case
 */
export const PORTAL_SOD_RULES: readonly PortalSoDRule[] = [
  {
    entityType: 'bankAccount',
    action: 'bank_account:propose',
    conflictsWith: 'bank_account:approve',
    description: 'Proposer of bank account change cannot approve it',
  },
  {
    entityType: 'apiKey',
    action: 'api_key:create',
    conflictsWith: 'api_key:activate',
    description: 'API key creator cannot activate it (2-person control)',
  },
  {
    entityType: 'case',
    action: 'case:resolve',
    conflictsWith: 'case:reopen',
    description: 'Resolver cannot reopen same case',
  },
] as const;

/**
 * Check if two actions conflict under SoD rules.
 * Pure function — deterministic, no I/O.
 */
export function checkSoDConflict(
  entityType: PortalSoDRule['entityType'],
  performedAction: string,
  attemptedAction: string
): PortalSoDRule | null {
  return (
    PORTAL_SOD_RULES.find(
      (rule) =>
        rule.entityType === entityType &&
        ((rule.action === performedAction && rule.conflictsWith === attemptedAction) ||
          (rule.action === attemptedAction && rule.conflictsWith === performedAction))
    ) ?? null
  );
}

/**
 * Assert no SoD conflict exists between two actions by the same user.
 * Throws if a conflict is detected.
 */
export function requireNoSoDConflict(
  entityType: PortalSoDRule['entityType'],
  performedAction: string,
  attemptedAction: string,
  actorId: string
): void {
  const conflict = checkSoDConflict(entityType, performedAction, attemptedAction);
  if (conflict) {
    throw new PortalSoDViolationError(actorId, conflict);
  }
}

// ─── Role hierarchy ─────────────────────────────────────────────────────────

const ROLE_HIERARCHY: Record<PortalRole, number> = {
  PORTAL_OWNER: 4,
  PORTAL_FINANCE: 3,
  PORTAL_OPERATIONS: 2,
  PORTAL_READONLY: 1,
};

/**
 * Check if a role has equal or higher rank than another.
 */
export function isRoleAtLeast(role: PortalRole, minimumRole: PortalRole): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[minimumRole];
}

// ─── Errors ─────────────────────────────────────────────────────────────────

export class PortalPermissionError extends Error {
  readonly code = 'PORTAL_PERMISSION_DENIED' as const;

  constructor(
    readonly role: PortalRole,
    readonly requiredPermission: PortalPermission
  ) {
    super(`Role '${role}' lacks permission '${requiredPermission}'`);
    this.name = 'PortalPermissionError';
  }
}

export class PortalSoDViolationError extends Error {
  readonly code = 'PORTAL_SOD_VIOLATION' as const;

  constructor(
    readonly actorId: string,
    readonly rule: PortalSoDRule
  ) {
    super(
      `SoD violation: actor '${actorId}' cannot perform '${rule.conflictsWith}' — conflicts with '${rule.action}' (${rule.description})`
    );
    this.name = 'PortalSoDViolationError';
  }
}
