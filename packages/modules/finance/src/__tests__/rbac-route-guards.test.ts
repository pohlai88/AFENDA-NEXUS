/**
 * GAP-A1: Route-level authorization guard tests.
 *
 * Verifies that:
 * - Missing permission → 403 FORBIDDEN
 * - SoD conflict → 403 SOD_VIOLATION
 * - Valid permission → proceeds normally
 * - Missing x-user-id → 401 UNAUTHORIZED
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';
import type { FinanceRuntime, FinanceDeps } from '../app/ports/finance-runtime.js';
import { registerJournalRoutes } from '../slices/gl/routes/journal-routes.js';
import { registerPeriodRoutes } from '../slices/gl/routes/period-routes.js';
import { RbacAuthorizationPolicy } from '../shared/authorization/rbac-authorization-policy.js';
import { registerErrorHandler, registerBigIntSerializer } from '@afenda/api-kit';
import type { RoleDefinition } from '@afenda/authz';
import type { IRoleResolver } from '../shared/ports/role-resolver.js';
import type { ISoDActionLogRepo, SoDLogInput } from '../shared/ports/sod-action-log-repo.js';
import type { SoDActionLog } from '../shared/entities/sod-action-log.js';
import { roles } from '@afenda/authz';
import {
  IDS,
  makeJournal,
  makeAccount,
  makePeriod,
  mockJournalRepo,
  mockAccountRepo,
  mockPeriodRepo,
  mockBalanceRepo,
  mockIdempotencyStore,
  mockOutboxWriter,
  mockJournalAuditRepo,
  mockLedgerRepo,
  mockDocumentNumberGenerator,
  mockPeriodAuditRepo,
} from './helpers.js';

// ─── Helpers ────────────────────────────────────────────────────────────────

function createRoleResolver(map: Record<string, string[]> = {}): IRoleResolver {
  return {
    async resolveRoles(_tenantId: string, userId: string) {
      const roleNames = map[userId] ?? [];
      return roleNames
        .map((n) => (roles as Record<string, import('@afenda/authz').RoleDefinition>)[n])
        .filter((r): r is import('@afenda/authz').RoleDefinition => !!r);
    },
  };
}

function createSoDRepo(entries: SoDActionLog[] = []): ISoDActionLogRepo {
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

function buildGuardedApp(opts: {
  roleMap?: Record<string, string[]>;
  sodEntries?: SoDActionLog[];
}): { app: FastifyInstance } {
  const deps = {
    journalRepo: mockJournalRepo(new Map([[IDS.journal, makeJournal()]])),
    accountRepo: mockAccountRepo([
      makeAccount({ id: IDS.account1, code: '1000' }),
      makeAccount({ id: IDS.account2, code: '2000' }),
    ]),
    periodRepo: mockPeriodRepo([makePeriod()]),
    balanceRepo: mockBalanceRepo(),
    idempotencyStore: mockIdempotencyStore(),
    outboxWriter: mockOutboxWriter(),
    journalAuditRepo: mockJournalAuditRepo(),
    ledgerRepo: mockLedgerRepo(),
    documentNumberGenerator: mockDocumentNumberGenerator(),
    periodAuditRepo: mockPeriodAuditRepo(),
  } as unknown as FinanceDeps;

  const runtime: FinanceRuntime = {
    async withTenant<T>(
      _ctx: { tenantId: string; userId: string },
      fn: (d: FinanceDeps) => Promise<T>
    ): Promise<T> {
      return fn(deps);
    },
  };

  const policy = new RbacAuthorizationPolicy(
    createRoleResolver(opts.roleMap ?? {}),
    createSoDRepo(opts.sodEntries ?? [])
  );

  const app = Fastify({ logger: false });
  registerErrorHandler(app);
  registerBigIntSerializer(app);

  // Bridge test headers → req.authUser with roles from roleMap
  const roleMap = opts.roleMap ?? {};
  app.decorateRequest('authUser', undefined);
  app.addHook('preHandler', async (req) => {
    const tenantId = req.headers['x-tenant-id'] as string | undefined;
    const userId = req.headers['x-user-id'] as string | undefined;
    if (tenantId && userId) {
      const roleNames = roleMap[userId] ?? [];
      const resolved = roleNames
        .map((n) => (roles as Record<string, RoleDefinition>)[n])
        .filter((r): r is RoleDefinition => !!r);
      (req as typeof req & { authUser?: Record<string, unknown> }).authUser = {
        tenantId,
        userId,
        roles: resolved,
        orgRoles: [] as readonly string[],
      };
    }
  });

  registerJournalRoutes(app, runtime, policy);
  registerPeriodRoutes(app, runtime, policy);

  return { app };
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('Route authorization guards', () => {
  describe('403 FORBIDDEN — missing permission', () => {
    let app: FastifyInstance;

    beforeAll(async () => {
      // viewer role: can read but NOT create/post journals
      ({ app } = buildGuardedApp({ roleMap: { u1: ['viewer'] } }));
      await app.ready();
    });
    afterAll(() => app.close());

    it('POST /journals — 403 when viewer tries to create', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/journals',
        headers: { 'x-tenant-id': 't1', 'x-user-id': 'u1', 'content-type': 'application/json' },
        payload: JSON.stringify({
          ledgerId: IDS.ledger,
          description: 'Test',
          date: '2024-01-01',
          lines: [
            { accountCode: '1000', debit: 100, credit: 0, currency: 'USD' },
            { accountCode: '2000', debit: 0, credit: 100, currency: 'USD' },
          ],
        }),
      });
      expect(res.statusCode).toBe(403);
      expect(res.json().error.code).toBe('FORBIDDEN');
    });

    it('POST /journals/:id/post — 403 when viewer tries to post', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/journals/${IDS.journal}/post`,
        headers: { 'x-tenant-id': 't1', 'x-user-id': 'u1', 'idempotency-key': 'test-key' },
      });
      expect(res.statusCode).toBe(403);
      expect(res.json().error.code).toBe('FORBIDDEN');
    });
  });

  describe('401 UNAUTHORIZED — missing x-user-id', () => {
    let app: FastifyInstance;

    beforeAll(async () => {
      ({ app } = buildGuardedApp({ roleMap: { u1: ['owner'] } }));
      await app.ready();
    });
    afterAll(() => app.close());

    it('POST /journals — 401 without x-user-id', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/journals',
        headers: { 'x-tenant-id': 't1', 'content-type': 'application/json' },
        payload: JSON.stringify({
          ledgerId: IDS.ledger,
          description: 'Test',
          date: '2024-01-01',
          lines: [
            { accountCode: '1000', debit: 100, credit: 0, currency: 'USD' },
            { accountCode: '2000', debit: 0, credit: 100, currency: 'USD' },
          ],
        }),
      });
      expect(res.statusCode).toBe(401);
      expect(res.json().error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('403 SOD_VIOLATION — SoD conflict', () => {
    let app: FastifyInstance;

    beforeAll(async () => {
      // accountant can post journals, but SoD log shows they already created this journal
      ({ app } = buildGuardedApp({
        roleMap: { u1: ['accountant'] },
        sodEntries: [
          {
            id: 'log-1',
            tenantId: 't1',
            entityType: 'journal',
            entityId: IDS.journal,
            actorId: 'u1',
            action: 'journal:create',
            createdAt: new Date(),
          },
        ],
      }));
      await app.ready();
    });
    afterAll(() => app.close());

    it('POST /journals/:id/post — 403 SOD_VIOLATION when same user created and tries to post', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/journals/${IDS.journal}/post`,
        headers: { 'x-tenant-id': 't1', 'x-user-id': 'u1', 'idempotency-key': 'test-key' },
      });
      expect(res.statusCode).toBe(403);
      expect(res.json().error.code).toBe('SOD_VIOLATION');
    });
  });

  describe('Permission OK — proceeds normally', () => {
    let app: FastifyInstance;

    beforeAll(async () => {
      ({ app } = buildGuardedApp({ roleMap: { u1: ['owner'] } }));
      await app.ready();
    });
    afterAll(() => app.close());

    it('GET /journals/:id — 200 when owner reads journal', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/journals/${IDS.journal}`,
        headers: { 'x-tenant-id': 't1', 'x-user-id': 'u1' },
      });
      expect(res.statusCode).toBe(200);
    });
  });
});
