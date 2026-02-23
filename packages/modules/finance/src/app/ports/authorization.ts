/**
 * GAP-06: Authorization & Segregation of Duties (SoD) policy port.
 *
 * Defines the contract for authorization checks in the finance module.
 * Implementations can be RBAC, ABAC, or policy-engine backed.
 *
 * SoD rules enforce that certain action pairs cannot be performed by the
 * same user (e.g. the user who creates a journal cannot also post it).
 */

export type FinancePermission =
  | "journal:create"
  | "journal:post"
  | "journal:reverse"
  | "journal:void"
  | "period:close"
  | "period:lock"
  | "period:reopen"
  | "year:close"
  | "ic:create"
  | "ic:settle"
  | "revenue:create"
  | "revenue:recognize"
  | "budget:write"
  | "report:read"
  | "fx:manage"
  | "admin:all";

export interface SoDViolation {
  readonly userId: string;
  readonly action: FinancePermission;
  readonly conflictingAction: FinancePermission;
  readonly entityId: string;
  readonly reason: string;
}

export interface IAuthorizationPolicy {
  /**
   * Returns true if the user has the given permission for the tenant.
   * Implementations should check role assignments, group memberships, etc.
   */
  hasPermission(
    tenantId: string,
    userId: string,
    permission: FinancePermission,
  ): Promise<boolean>;

  /**
   * Checks SoD constraints for a specific entity.
   * Returns a violation if the user performed a conflicting prior action
   * on the same entity (e.g. created AND is trying to post the same journal).
   */
  checkSoD(
    tenantId: string,
    userId: string,
    action: FinancePermission,
    entityId: string,
  ): Promise<SoDViolation | null>;
}
