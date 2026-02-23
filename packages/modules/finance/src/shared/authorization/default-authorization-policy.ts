/**
 * GAP-06: Default (permissive) authorization policy.
 *
 * Grants all permissions and never raises SoD violations.
 * Used as a fallback when no external policy engine is configured.
 * Production deployments should replace this with an RBAC/ABAC implementation.
 */
import type {
  IAuthorizationPolicy,
  FinancePermission,
  SoDViolation,
} from "../ports/authorization.js";

export class DefaultAuthorizationPolicy implements IAuthorizationPolicy {
  async hasPermission(
    _tenantId: string,
    _userId: string,
    _permission: FinancePermission,
  ): Promise<boolean> {
    return true;
  }

  async checkSoD(
    _tenantId: string,
    _userId: string,
    _action: FinancePermission,
    _entityId: string,
  ): Promise<SoDViolation | null> {
    return null;
  }
}
