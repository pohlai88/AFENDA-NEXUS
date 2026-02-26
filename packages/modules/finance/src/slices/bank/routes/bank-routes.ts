import type { FastifyInstance } from 'fastify';
import type { FinanceRuntime } from '../../../app/ports/finance-runtime.js';
import type { IAuthorizationPolicy } from '../../../shared/ports/authorization.js';
import { requirePermission } from '../../../shared/routes/authorization-guard.js';
import { signOffReconciliation } from '../services/sign-off-reconciliation.js';
import { extractIdentity } from '@afenda/api-kit';
import type { IdParam } from '@afenda/contracts';

export function registerBankRoutes(
  app: FastifyInstance,
  runtime: FinanceRuntime,
  policy: IAuthorizationPolicy
): void {
  app.get(
    '/bank-statements',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req) => {
      const { tenantId, userId } = extractIdentity(req);
      const bankAccountId = (req.query as Record<string, string>).bankAccountId;
      return runtime.withTenant({ tenantId, userId }, async (deps) => {
        if (bankAccountId)
          return { data: await deps.bankStatementRepo.findByBankAccount(bankAccountId) };
        return { data: [] };
      });
    }
  );

  app.get<{ Params: IdParam }>(
    '/bank-statements/:id',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req, reply) => {
      const { tenantId, userId } = extractIdentity(req);
      return runtime.withTenant({ tenantId, userId }, async (deps) => {
        const stmt = await deps.bankStatementRepo.findById(req.params.id);
        if (!stmt) return reply.status(404).send({ error: 'Statement not found' });
        return stmt;
      });
    }
  );

  app.get<{ Params: IdParam }>(
    '/bank-statements/:id/lines',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req) => {
      const { tenantId, userId } = extractIdentity(req);
      return runtime.withTenant({ tenantId, userId }, async (deps) => {
        const lines = await deps.bankStatementRepo.findLinesByStatement(req.params.id);
        return { data: lines };
      });
    }
  );

  app.get(
    '/bank-reconciliations',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req) => {
      const { tenantId, userId } = extractIdentity(req);
      return runtime.withTenant({ tenantId, userId }, async (deps) => {
        const list = await deps.bankReconciliationRepo.findAll();
        return { data: list };
      });
    }
  );

  app.get<{ Params: IdParam }>(
    '/bank-reconciliations/:id',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req, reply) => {
      const { tenantId, userId } = extractIdentity(req);
      return runtime.withTenant({ tenantId, userId }, async (deps) => {
        const recon = await deps.bankReconciliationRepo.findById(req.params.id);
        if (!recon) return reply.status(404).send({ error: 'Reconciliation not found' });
        return recon;
      });
    }
  );

  app.post<{ Params: IdParam }>(
    '/bank-reconciliations/:id/sign-off',
    { preHandler: [requirePermission(policy, 'journal:post')] },
    async (req, reply) => {
      const { tenantId, userId } = extractIdentity(req);
      return runtime.withTenant({ tenantId, userId }, async (deps) => {
        const result = await signOffReconciliation(
          { tenantId, userId, reconciliationId: req.params.id },
          deps
        );
        if (!result.ok) return reply.status(400).send({ error: result.error });
        return result.value;
      });
    }
  );
}
