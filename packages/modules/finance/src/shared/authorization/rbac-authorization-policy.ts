/**
 * GAP-A1: Real RBAC + SoD authorization policy.
 *
 * - hasPermission: maps FinancePermission → @afenda/authz resource×action,
 *   resolves roles via IRoleResolver, evaluates via can().
 * - checkSoD: queries ISoDActionLogRepo for prior conflicting actions
 *   by the same actor on the same entity, using FINANCE_SOD_RULES.
 *
 * Request-local role cache prevents repeated DB hits when multiple
 * guards fire on the same request.
 *
 * No dev bypass. No fallback. Unknown roles → deny.
 */
import { can, type RoleDefinition } from '@afenda/authz';
import type {
  IAuthorizationPolicy,
  FinancePermission,
  SoDViolation,
} from '../ports/authorization.js';
import type { IRoleResolver } from '../ports/role-resolver.js';
import type { ISoDActionLogRepo } from '../ports/sod-action-log-repo.js';
import { PERMISSION_MAP } from './permission-map.js';
import { FINANCE_SOD_RULES } from './sod-rules.js';

export class RbacAuthorizationPolicy implements IAuthorizationPolicy {
  private readonly roleCache = new Map<string, readonly RoleDefinition[]>();

  constructor(
    private readonly roleResolver: IRoleResolver,
    private readonly sodActionLogRepo: ISoDActionLogRepo
  ) {}

  async hasPermission(
    tenantId: string,
    userId: string,
    permission: FinancePermission
  ): Promise<boolean> {
    // admin:all is a super-permission — check if any role has wildcard resource
    // OR fall through to the permission map (maps to settings:update, only owner/admin have this)
    if (permission === 'admin:all') {
      const roles = await this.resolveRolesCached(tenantId, userId);
      if (roles.some((role) => role.permissions.some((p) => p.resource === '*'))) {
        return true;
      }
      // Fall through: check via PERMISSION_MAP (settings:update)
    }

    const mapping = PERMISSION_MAP[permission];
    if (!mapping) return false;

    const roles = await this.resolveRolesCached(tenantId, userId);
    if (roles.length === 0) return false;

    const ctx = {
      tenantId,
      userId,
      roles,
    };

    return can(ctx, mapping.resource, mapping.action);
  }

  async checkSoD(
    tenantId: string,
    userId: string,
    action: FinancePermission,
    entityType: string,
    entityId: string
  ): Promise<SoDViolation | null> {
    // Find SoD rules where the current action is a conflict target
    const applicableRules = FINANCE_SOD_RULES.filter(
      (rule) =>
        rule.entityType === entityType && (rule.conflictsWith === action || rule.action === action)
    );

    if (applicableRules.length === 0) return null;

    const priorActions = await this.sodActionLogRepo.findByEntity(tenantId, entityType, entityId);

    for (const rule of applicableRules) {
      // Determine which action is the "prior" and which is the "current"
      const conflictingAction = rule.action === action ? rule.conflictsWith : rule.action;
      const priorConflictAction = rule.action === action ? rule.action : rule.conflictsWith;

      // Current action matches conflictsWith → look for prior rule.action by same actor
      // Current action matches rule.action → look for prior rule.conflictsWith by same actor
      const conflictEntry = priorActions.find(
        (log) =>
          log.actorId === userId &&
          (log.action === conflictingAction || log.action === priorConflictAction) &&
          log.action !== action
      );

      if (conflictEntry) {
        return {
          userId,
          action,
          conflictingAction: conflictEntry.action,
          entityType,
          entityId,
          reason: `SoD violation: user ${userId} performed ${conflictEntry.action} and is attempting ${action} on ${entityType} ${entityId} — ${rule.description}`,
        };
      }
    }

    return null;
  }

  /**
   * Clears the request-local role cache.
   * Call at request boundary if reusing the policy instance across requests.
   */
  clearCache(): void {
    this.roleCache.clear();
  }

  private async resolveRolesCached(
    tenantId: string,
    userId: string
  ): Promise<readonly RoleDefinition[]> {
    const cacheKey = `${tenantId}:${userId}`;
    const cached = this.roleCache.get(cacheKey);
    if (cached) return cached;

    const roles = await this.roleResolver.resolveRoles(tenantId, userId);
    this.roleCache.set(cacheKey, roles);
    return roles;
  }
}
