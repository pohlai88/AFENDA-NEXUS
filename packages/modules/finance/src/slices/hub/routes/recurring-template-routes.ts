import type { FastifyInstance } from 'fastify';
import { IdParamSchema, PaginationSchema, CreateRecurringTemplateSchema } from '@afenda/contracts';
import type { FinanceRuntime } from '../../../app/ports/finance-runtime.js';
import type { IAuthorizationPolicy } from '../../../shared/ports/authorization.js';
import { requirePermission } from '../../../shared/routes/authorization-guard.js';
import { processRecurringJournals } from '../../../shared/ports/recurring-journal-hook.js';
import { extractIdentity } from '@afenda/api-kit';

export function registerRecurringTemplateRoutes(
  app: FastifyInstance,
  runtime: FinanceRuntime,
  policy: IAuthorizationPolicy
): void {
  // POST /recurring-templates — create template
  app.post(
    '/recurring-templates',
    { preHandler: [requirePermission(policy, 'journal:create')] },
    async (req, reply) => {
      const { tenantId, userId } = extractIdentity(req);

      const body = CreateRecurringTemplateSchema.parse(req.body);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return deps.recurringTemplateRepo.create({
          tenantId,
          companyId: body.companyId,
          ledgerId: body.ledgerId,
          description: body.description,
          lines: body.lines.map((l) => ({
            accountCode: l.accountCode,
            debit: BigInt(l.debit),
            credit: BigInt(l.credit),
            description: l.description,
          })),
          frequency: body.frequency,
          nextRunDate: body.nextRunDate,
        });
      });

      return reply.status(201).send(result);
    }
  );

  // GET /recurring-templates — paginated list
  app.get(
    '/recurring-templates',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req, reply) => {
      const { tenantId, userId } = extractIdentity(req);
      const pagination = PaginationSchema.parse(req.query);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return deps.recurringTemplateRepo.findAll(pagination);
      });

      return reply.send(result);
    }
  );

  // GET /recurring-templates/:id
  app.get(
    '/recurring-templates/:id',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const { tenantId, userId } = extractIdentity(req);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return deps.recurringTemplateRepo.findById(id);
      });

      if (!result) return reply.status(404).send({ error: 'RecurringTemplate not found' });
      return reply.send(result);
    }
  );

  // POST /recurring-templates/process — trigger processing
  app.post(
    '/recurring-templates/process',
    { preHandler: [requirePermission(policy, 'journal:post')] },
    async (req, reply) => {
      const { tenantId, userId } = extractIdentity(req);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return processRecurringJournals(
          { tenantId, userId, asOfDate: new Date() },
          {
            recurringTemplateRepo: deps.recurringTemplateRepo,
            journalRepo: deps.journalRepo,
            accountRepo: deps.accountRepo,
            periodRepo: deps.periodRepo,
            outboxWriter: deps.outboxWriter,
            journalAuditRepo: deps.journalAuditRepo,
          }
        );
      });

      if (!result.ok) return reply.status(500).send({ error: result.error });
      return reply.send(result.value);
    }
  );
}
