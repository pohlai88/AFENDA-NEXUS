/**
 * GAP-A1: Unit tests for RbacAuthorizationPolicy.
 *
 * Tests hasPermission and checkSoD with mock IRoleResolver and ISoDActionLogRepo.
 */
import { describe, it, expect } from 'vitest';
import { RbacAuthorizationPolicy } from '../shared/authorization/rbac-authorization-policy.js';
import type { IRoleResolver } from '../shared/ports/role-resolver.js';
import type { ISoDActionLogRepo, SoDLogInput } from '../shared/ports/sod-action-log-repo.js';
import type { SoDActionLog } from '../shared/entities/sod-action-log.js';
import { roles, type RoleDefinition } from '@afenda/authz';

// ─── Mock IRoleResolver ──────────────────────────────────────────────────────

function createMockRoleResolver(
  rolesMap: Record<string, readonly RoleDefinition[]> = {}
): IRoleResolver {
  return {
    async resolveRoles(tenantId: string, userId: string) {
      return rolesMap[`${tenantId}:${userId}`] ?? [];
    },
  };
}

// ─── Mock ISoDActionLogRepo ──────────────────────────────────────────────────

function createMockSoDRepo(entries: SoDActionLog[] = []): ISoDActionLogRepo {
  const logs = [...entries];
  return {
    async logAction(input: SoDLogInput) {
      logs.push({
        id: `log-${logs.length + 1}`,
        tenantId: input.tenantId,
        entityType: input.entityType,
        entityId: input.entityId,
        actorId: input.actorId,
        action: input.action,
        createdAt: new Date(),
      });
    },
    async findByEntity(_tenantId: string, entityType: string, entityId: string) {
      return logs.filter((l) => l.entityType === entityType && l.entityId === entityId);
    },
  };
}

const T = 'tenant-1';
const U = 'user-1';

describe('RbacAuthorizationPolicy', () => {
  describe('hasPermission', () => {
    it('denies when user has no roles', async () => {
      const policy = new RbacAuthorizationPolicy(createMockRoleResolver(), createMockSoDRepo());
      expect(await policy.hasPermission(T, U, 'journal:create')).toBe(false);
    });

    it('grants when user has accountant role (can create journals)', async () => {
      const policy = new RbacAuthorizationPolicy(
        createMockRoleResolver({ [`${T}:${U}`]: [roles.accountant] }),
        createMockSoDRepo()
      );
      expect(await policy.hasPermission(T, U, 'journal:create')).toBe(true);
    });

    it('denies when viewer tries to create journal', async () => {
      const policy = new RbacAuthorizationPolicy(
        createMockRoleResolver({ [`${T}:${U}`]: [roles.viewer] }),
        createMockSoDRepo()
      );
      expect(await policy.hasPermission(T, U, 'journal:create')).toBe(false);
    });

    it('grants report:read to viewer role', async () => {
      const policy = new RbacAuthorizationPolicy(
        createMockRoleResolver({ [`${T}:${U}`]: [roles.viewer] }),
        createMockSoDRepo()
      );
      expect(await policy.hasPermission(T, U, 'report:read')).toBe(true);
    });

    it('grants admin:all to owner role (wildcard resource)', async () => {
      const policy = new RbacAuthorizationPolicy(
        createMockRoleResolver({ [`${T}:${U}`]: [roles.owner] }),
        createMockSoDRepo()
      );
      expect(await policy.hasPermission(T, U, 'admin:all')).toBe(true);
    });

    it('grants accountant journal:post but denies period:close', async () => {
      const policy = new RbacAuthorizationPolicy(
        createMockRoleResolver({ [`${T}:${U}`]: [roles.accountant] }),
        createMockSoDRepo()
      );
      expect(await policy.hasPermission(T, U, 'journal:post')).toBe(true);
      expect(await policy.hasPermission(T, U, 'period:close')).toBe(false);
    });

    it('denies clerk journal:post (can only create, not post)', async () => {
      const policy = new RbacAuthorizationPolicy(
        createMockRoleResolver({ [`${T}:${U}`]: [roles.clerk] }),
        createMockSoDRepo()
      );
      expect(await policy.hasPermission(T, U, 'journal:create')).toBe(true);
      expect(await policy.hasPermission(T, U, 'journal:post')).toBe(false);
    });

    it('denies viewer all write permissions', async () => {
      const policy = new RbacAuthorizationPolicy(
        createMockRoleResolver({ [`${T}:${U}`]: [roles.viewer] }),
        createMockSoDRepo()
      );
      expect(await policy.hasPermission(T, U, 'journal:create')).toBe(false);
      expect(await policy.hasPermission(T, U, 'journal:post')).toBe(false);
      expect(await policy.hasPermission(T, U, 'journal:reverse')).toBe(false);
      expect(await policy.hasPermission(T, U, 'period:close')).toBe(false);
      expect(await policy.hasPermission(T, U, 'admin:all')).toBe(false);
    });

    it('denies admin:all to accountant role', async () => {
      const policy = new RbacAuthorizationPolicy(
        createMockRoleResolver({ [`${T}:${U}`]: [roles.accountant] }),
        createMockSoDRepo()
      );
      expect(await policy.hasPermission(T, U, 'admin:all')).toBe(false);
    });

    it('caches roles per request (same tenant+user)', async () => {
      let callCount = 0;
      const resolver: IRoleResolver = {
        async resolveRoles() {
          callCount++;
          return [roles.accountant];
        },
      };
      const policy = new RbacAuthorizationPolicy(resolver, createMockSoDRepo());

      await policy.hasPermission(T, U, 'journal:create');
      await policy.hasPermission(T, U, 'journal:post');

      expect(callCount).toBe(1);
    });

    it('clearCache resets the role cache', async () => {
      let callCount = 0;
      const resolver: IRoleResolver = {
        async resolveRoles() {
          callCount++;
          return [roles.accountant];
        },
      };
      const policy = new RbacAuthorizationPolicy(resolver, createMockSoDRepo());

      await policy.hasPermission(T, U, 'journal:create');
      policy.clearCache();
      await policy.hasPermission(T, U, 'journal:create');

      expect(callCount).toBe(2);
    });
  });

  describe('checkSoD', () => {
    it('returns null when no prior actions exist', async () => {
      const policy = new RbacAuthorizationPolicy(createMockRoleResolver(), createMockSoDRepo());
      const result = await policy.checkSoD(T, U, 'journal:post', 'journal', 'j-1');
      expect(result).toBeNull();
    });

    it('returns null when prior action is by a different user', async () => {
      const sodRepo = createMockSoDRepo([
        {
          id: 'log-1',
          tenantId: T,
          entityType: 'journal',
          entityId: 'j-1',
          actorId: 'user-2',
          action: 'journal:create',
          createdAt: new Date(),
        },
      ]);
      const policy = new RbacAuthorizationPolicy(createMockRoleResolver(), sodRepo);
      const result = await policy.checkSoD(T, U, 'journal:post', 'journal', 'j-1');
      expect(result).toBeNull();
    });

    it('detects SoD violation: same user created and tries to post', async () => {
      const sodRepo = createMockSoDRepo([
        {
          id: 'log-1',
          tenantId: T,
          entityType: 'journal',
          entityId: 'j-1',
          actorId: U,
          action: 'journal:create',
          createdAt: new Date(),
        },
      ]);
      const policy = new RbacAuthorizationPolicy(createMockRoleResolver(), sodRepo);
      const result = await policy.checkSoD(T, U, 'journal:post', 'journal', 'j-1');

      expect(result).not.toBeNull();
      expect(result!.action).toBe('journal:post');
      expect(result!.conflictingAction).toBe('journal:create');
      expect(result!.entityId).toBe('j-1');
      expect(result!.entityType).toBe('journal');
      expect(result!.reason).toContain('SoD violation');
    });

    it('detects SoD violation: same user posted and tries to reverse', async () => {
      const sodRepo = createMockSoDRepo([
        {
          id: 'log-1',
          tenantId: T,
          entityType: 'journal',
          entityId: 'j-1',
          actorId: U,
          action: 'journal:post',
          createdAt: new Date(),
        },
      ]);
      const policy = new RbacAuthorizationPolicy(createMockRoleResolver(), sodRepo);
      const result = await policy.checkSoD(T, U, 'journal:reverse', 'journal', 'j-1');

      expect(result).not.toBeNull();
      expect(result!.conflictingAction).toBe('journal:post');
    });

    it('detects SoD violation: same user closed and tries to reopen period', async () => {
      const sodRepo = createMockSoDRepo([
        {
          id: 'log-1',
          tenantId: T,
          entityType: 'fiscalPeriod',
          entityId: 'p-1',
          actorId: U,
          action: 'period:close',
          createdAt: new Date(),
        },
      ]);
      const policy = new RbacAuthorizationPolicy(createMockRoleResolver(), sodRepo);
      const result = await policy.checkSoD(T, U, 'period:reopen', 'fiscalPeriod', 'p-1');

      expect(result).not.toBeNull();
      expect(result!.conflictingAction).toBe('period:close');
    });

    it('detects SoD violation: same user wrote budget and tries to post journal in same period', async () => {
      const sodRepo = createMockSoDRepo([
        {
          id: 'log-1',
          tenantId: T,
          entityType: 'budgetControl',
          entityId: 'period-1',
          actorId: U,
          action: 'budget:write',
          createdAt: new Date(),
        },
      ]);
      const policy = new RbacAuthorizationPolicy(createMockRoleResolver(), sodRepo);
      const result = await policy.checkSoD(T, U, 'journal:post', 'budgetControl', 'period-1');

      expect(result).not.toBeNull();
      expect(result!.conflictingAction).toBe('budget:write');
      expect(result!.reason).toContain('SoD violation');
    });

    it('no SoD violation: different user wrote budget and another posts journal', async () => {
      const sodRepo = createMockSoDRepo([
        {
          id: 'log-1',
          tenantId: T,
          entityType: 'budgetControl',
          entityId: 'period-1',
          actorId: 'user-2',
          action: 'budget:write',
          createdAt: new Date(),
        },
      ]);
      const policy = new RbacAuthorizationPolicy(createMockRoleResolver(), sodRepo);
      const result = await policy.checkSoD(T, U, 'journal:post', 'budgetControl', 'period-1');
      expect(result).toBeNull();
    });

    it('returns null for unrelated entity types', async () => {
      const sodRepo = createMockSoDRepo([
        {
          id: 'log-1',
          tenantId: T,
          entityType: 'journal',
          entityId: 'j-1',
          actorId: U,
          action: 'journal:create',
          createdAt: new Date(),
        },
      ]);
      const policy = new RbacAuthorizationPolicy(createMockRoleResolver(), sodRepo);
      // Same entityId but different entityType — should not conflict
      const result = await policy.checkSoD(T, U, 'journal:post', 'fiscalPeriod', 'j-1');
      expect(result).toBeNull();
    });
  });
});
