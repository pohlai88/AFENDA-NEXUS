import type { FastifyInstance } from 'fastify';
import {
  BalanceSheetQuerySchema,
  IncomeStatementQuerySchema,
  CashFlowQuerySchema,
  VarianceAlertsQuerySchema,
  ComparativeBalanceSheetQuerySchema,
  ComparativeIncomeStatementQuerySchema,
  EquityStatementBodySchema,
  EpsBodySchema,
  FinancialRatiosBodySchema,
  GoingConcernBodySchema,
  GenerateNotesBodySchema,
  XbrlTagBodySchema,
  IcAgingQuerySchema,
} from '@afenda/contracts';
import type { FinanceRuntime } from '../../../app/ports/finance-runtime.js';
import type { IAuthorizationPolicy } from '../../../shared/ports/authorization.js';
import { requirePermission } from '../../../shared/routes/authorization-guard.js';
import { getBalanceSheet } from '../services/get-balance-sheet.js';
import { getIncomeStatement } from '../services/get-income-statement.js';
import { getComparativeBalanceSheet } from '../services/get-comparative-balance-sheet.js';
import { getComparativeIncomeStatement } from '../services/get-comparative-income-statement.js';
import { getCashFlow } from '../services/get-cash-flow.js';
import { getEquityStatement } from '../services/get-equity-statement.js';
import { computeEps } from '../calculators/eps-calculator.js';
import { computeFinancialRatios } from '../calculators/financial-ratios.js';
import { assessGoingConcern } from '../calculators/going-concern.js';
import { getNotes } from '../services/get-notes.js';
import { getXbrlTags } from '../services/get-xbrl-tags.js';
import { getBudgetVariance } from '../../../shared/ports/report-hooks.js';
import { evaluateVarianceAlerts } from '../../../shared/ports/report-hooks.js';
import { computeIcAging } from '../../../shared/ports/report-hooks.js';
import type { IcOpenItem } from '../../../shared/ports/report-hooks.js';
import { money } from '@afenda/core';
import { mapErrorToStatus } from '../../../shared/routes/error-mapper.js';
import { extractIdentity } from '@afenda/api-kit';

/** Use read replica when DATABASE_URL_READONLY is set; otherwise primary. */
const withReportCtx = (runtime: FinanceRuntime) => runtime.withTenantReadOnly ?? runtime.withTenant;

export function registerReportRoutes(
  app: FastifyInstance,
  runtime: FinanceRuntime,
  policy: IAuthorizationPolicy
): void {
  const run = withReportCtx(runtime);

  // GET /reports/balance-sheet?ledgerId=&periodId=
  app.get(
    '/reports/balance-sheet',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req, reply) => {
      const { tenantId, userId } = extractIdentity(req);
      const { ledgerId, periodId } = BalanceSheetQuerySchema.parse(req.query);

      const result = await run({ tenantId, userId }, async (deps) => {
        return getBalanceSheet(
          { ledgerId, periodId },
          {
            balanceRepo: deps.balanceRepo,
            ledgerRepo: deps.ledgerRepo,
          }
        );
      });

      if (!result.ok)
        return reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
      return reply.send(result.value);
    }
  );

  // GET /reports/income-statement?ledgerId=&fromPeriodId=&toPeriodId=
  app.get(
    '/reports/income-statement',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req, reply) => {
      const { tenantId, userId } = extractIdentity(req);
      const { ledgerId, fromPeriodId, toPeriodId } = IncomeStatementQuerySchema.parse(req.query);

      const result = await run({ tenantId, userId }, async (deps) => {
        return getIncomeStatement(
          { ledgerId, fromPeriodId, toPeriodId },
          {
            balanceRepo: deps.balanceRepo,
            ledgerRepo: deps.ledgerRepo,
          }
        );
      });

      if (!result.ok)
        return reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
      return reply.send(result.value);
    }
  );

  // GET /reports/cash-flow?ledgerId=&fromPeriodId=&toPeriodId=
  app.get(
    '/reports/cash-flow',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req, reply) => {
      const { tenantId, userId } = extractIdentity(req);
      const { ledgerId, fromPeriodId, toPeriodId } = CashFlowQuerySchema.parse(req.query);

      const result = await run({ tenantId, userId }, async (deps) => {
        return getCashFlow(
          { ledgerId, fromPeriodId, toPeriodId },
          {
            balanceRepo: deps.balanceRepo,
            ledgerRepo: deps.ledgerRepo,
          }
        );
      });

      if (!result.ok)
        return reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
      return reply.send(result.value);
    }
  );

  // POST /reports/equity-statement
  app.post(
    '/reports/equity-statement',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req, reply) => {
      const { tenantId, userId } = extractIdentity(req);
      const { ledgerId, periodId, movements } = EquityStatementBodySchema.parse(req.body);

      const result = await run({ tenantId, userId }, async (deps) => {
        return getEquityStatement(
          { ledgerId, periodId, movements },
          { ledgerRepo: deps.ledgerRepo }
        );
      });

      if (!result.ok)
        return reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
      return reply.send(result.value);
    }
  );

  // POST /reports/eps
  app.post(
    '/reports/eps',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req, reply) => {
      const input = EpsBodySchema.parse(req.body);
      try {
        const { result } = computeEps(input);
        return reply.send(result);
      } catch (e) {
        return reply
          .status(400)
          .send({ error: { code: 'VALIDATION', message: (e as Error).message } });
      }
    }
  );

  // POST /reports/financial-ratios
  app.post(
    '/reports/financial-ratios',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req, reply) => {
      const input = FinancialRatiosBodySchema.parse(req.body);
      const { result } = computeFinancialRatios(input);
      return reply.send(result);
    }
  );

  // POST /reports/going-concern
  app.post(
    '/reports/going-concern',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req, reply) => {
      const input = GoingConcernBodySchema.parse(req.body);
      const { result } = assessGoingConcern(input);
      return reply.send(result);
    }
  );

  // POST /reports/notes
  app.post(
    '/reports/notes',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req, reply) => {
      const { templates, data } = GenerateNotesBodySchema.parse(req.body);

      const result = await getNotes({ templates, data });

      if (!result.ok)
        return reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
      return reply.send(result.value);
    }
  );

  // POST /reports/xbrl-tags
  app.post(
    '/reports/xbrl-tags',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req, reply) => {
      const { dataPoints, mappings, taxonomy, entityId } = XbrlTagBodySchema.parse(req.body);

      const result = await getXbrlTags({ dataPoints, mappings, taxonomy, entityId });

      if (!result.ok)
        return reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
      return reply.send(result.value);
    }
  );

  // GET /reports/budget-variance-alerts?ledgerId=&periodId=&warningPct=10&criticalPct=25
  app.get(
    '/reports/budget-variance-alerts',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req, reply) => {
      const { tenantId, userId } = extractIdentity(req);
      const { ledgerId, periodId, warningPct, criticalPct } = VarianceAlertsQuerySchema.parse(
        req.query
      );

      const varianceResult = await run({ tenantId, userId }, async (deps) => {
        return getBudgetVariance(
          { ledgerId, periodId },
          {
            budgetRepo: deps.budgetRepo,
            balanceRepo: deps.balanceRepo,
            accountRepo: deps.accountRepo,
            ledgerRepo: deps.ledgerRepo,
          }
        );
      });

      if (!varianceResult.ok) {
        return reply
          .status(mapErrorToStatus(varianceResult.error))
          .send({ error: varianceResult.error });
      }

      const alertResult = evaluateVarianceAlerts(varianceResult.value.rows, {
        percentageWarning: warningPct,
        percentageCritical: criticalPct,
      });

      return reply.send(alertResult.result);
    }
  );

  // GET /reports/comparative-balance-sheet?ledgerId=&currentPeriodId=&priorPeriodId=
  app.get(
    '/reports/comparative-balance-sheet',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req, reply) => {
      const { tenantId, userId } = extractIdentity(req);
      const { ledgerId, currentPeriodId, priorPeriodId } = ComparativeBalanceSheetQuerySchema.parse(
        req.query
      );

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        return getComparativeBalanceSheet(
          { ledgerId, currentPeriodId, priorPeriodId },
          {
            balanceRepo: deps.balanceRepo,
            ledgerRepo: deps.ledgerRepo,
          }
        );
      });

      if (!result.ok)
        return reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
      return reply.send(result.value);
    }
  );

  // GET /reports/comparative-income-statement?ledgerId=&currentFromPeriodId=&currentToPeriodId=&priorFromPeriodId=&priorToPeriodId=
  app.get(
    '/reports/comparative-income-statement',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req, reply) => {
      const { tenantId, userId } = extractIdentity(req);
      const {
        ledgerId,
        currentFromPeriodId,
        currentToPeriodId,
        priorFromPeriodId,
        priorToPeriodId,
      } = ComparativeIncomeStatementQuerySchema.parse(req.query);

      const result = await run({ tenantId, userId }, async (deps) => {
        return getComparativeIncomeStatement(
          { ledgerId, currentFromPeriodId, currentToPeriodId, priorFromPeriodId, priorToPeriodId },
          { balanceRepo: deps.balanceRepo, ledgerRepo: deps.ledgerRepo }
        );
      });

      if (!result.ok)
        return reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
      return reply.send(result.value);
    }
  );

  // GET /reports/ic-aging?currency=USD&asOfDate=2025-12-31
  app.get(
    '/reports/ic-aging',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req, reply) => {
      const { tenantId, userId } = extractIdentity(req);
      const parsed = IcAgingQuerySchema.parse(req.query);
      const currency = parsed.currency;
      const asOfDate = parsed.asOfDate ? new Date(parsed.asOfDate) : new Date();

      const txResult = await run({ tenantId, userId }, async (deps) => {
        return deps.icTransactionRepo.findAll({ page: 1, limit: 10000 });
      });

      if (!txResult.ok) {
        return reply.status(mapErrorToStatus(txResult.error)).send({ error: txResult.error });
      }

      const items: IcOpenItem[] = txResult.value.data.map((tx) => ({
        transactionId: tx.id,
        sourceCompanyId: tx.sourceCompanyId,
        mirrorCompanyId: tx.mirrorCompanyId,
        amount: money(tx.amount, tx.currency),
        createdAt: tx.createdAt,
        status: tx.status as IcOpenItem['status'],
      }));

      const agingResult = computeIcAging(items, asOfDate, currency);
      return reply.send(agingResult.result);
    }
  );
}
