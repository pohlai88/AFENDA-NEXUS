/**
 * GAP-06: Permissive authorization policy — **TEST MOCKS ONLY**.
 *
 * Grants all permissions and never raises SoD violations.
 * NOT used in runtime — RbacAuthorizationPolicy is the sole production policy.
 * Kept only for unit tests that need an IAuthorizationPolicy stub.
 */
import type {
  IAuthorizationPolicy,
  FinancePermission,
  SoDViolation,
} from '../ports/authorization.js';

export class DefaultAuthorizationPolicy implements IAuthorizationPolicy {
  async hasPermission(
    _tenantId: string,
    _userId: string,
    _permission: FinancePermission
  ): Promise<boolean> {
    return true;
  }

  async checkSoD(
    _tenantId: string,
    _userId: string,
    _action: FinancePermission,
    _entityType: string,
    _entityId: string
  ): Promise<SoDViolation | null> {
    return null;
  }
}
