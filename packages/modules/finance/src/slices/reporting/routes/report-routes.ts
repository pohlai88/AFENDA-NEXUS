import type { FastifyInstance } from "fastify";
import {
  BalanceSheetQuerySchema,
  IncomeStatementQuerySchema,
  CashFlowQuerySchema,
  VarianceAlertsQuerySchema,
  ComparativeBalanceSheetQuerySchema,
  ComparativeIncomeStatementQuerySchema,
  IcAgingQuerySchema,
} from "@afenda/contracts";
import type { FinanceRuntime } from "../../../app/ports/finance-runtime.js";
import { getBalanceSheet } from "../services/get-balance-sheet.js";
import { getIncomeStatement } from "../services/get-income-statement.js";
import { getComparativeBalanceSheet } from "../services/get-comparative-balance-sheet.js";
import { getComparativeIncomeStatement } from "../services/get-comparative-income-statement.js";
import { getCashFlow } from "../services/get-cash-flow.js";
import { getBudgetVariance } from "../../hub/services/get-budget-variance.js";
import { evaluateVarianceAlerts } from "../../hub/calculators/variance-alerts.js";
import { computeIcAging } from "../../ic/calculators/ic-aging.js";
import type { IcOpenItem } from "../../ic/calculators/ic-aging.js";
import { money } from "@afenda/core";
import { mapErrorToStatus } from "../../../shared/routes/error-mapper.js";

export function registerReportRoutes(
  app: FastifyInstance,
  runtime: FinanceRuntime,
): void {
  // GET /reports/balance-sheet?ledgerId=&periodId=
  app.get("/reports/balance-sheet", async (req, reply) => {
    const tenantId = req.headers["x-tenant-id"] as string;
    const userId = (req.headers["x-user-id"] as string) ?? "system";
    const { ledgerId, periodId } = BalanceSheetQuerySchema.parse(req.query);

    const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
      return getBalanceSheet({ ledgerId, periodId }, {
        balanceRepo: deps.balanceRepo,
        ledgerRepo: deps.ledgerRepo,
      });
    });

    if (!result.ok) return reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    return reply.send(result.value);
  });

  // GET /reports/income-statement?ledgerId=&fromPeriodId=&toPeriodId=
  app.get("/reports/income-statement", async (req, reply) => {
    const tenantId = req.headers["x-tenant-id"] as string;
    const userId = (req.headers["x-user-id"] as string) ?? "system";
    const { ledgerId, fromPeriodId, toPeriodId } = IncomeStatementQuerySchema.parse(req.query);

    const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
      return getIncomeStatement({ ledgerId, fromPeriodId, toPeriodId }, {
        balanceRepo: deps.balanceRepo,
        ledgerRepo: deps.ledgerRepo,
      });
    });

    if (!result.ok) return reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    return reply.send(result.value);
  });

  // GET /reports/cash-flow?ledgerId=&fromPeriodId=&toPeriodId=
  app.get("/reports/cash-flow", async (req, reply) => {
    const tenantId = req.headers["x-tenant-id"] as string;
    const userId = (req.headers["x-user-id"] as string) ?? "system";
    const { ledgerId, fromPeriodId, toPeriodId } = CashFlowQuerySchema.parse(req.query);

    const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
      return getCashFlow({ ledgerId, fromPeriodId, toPeriodId }, {
        balanceRepo: deps.balanceRepo,
        ledgerRepo: deps.ledgerRepo,
      });
    });

    if (!result.ok) return reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    return reply.send(result.value);
  });

  // GET /reports/budget-variance-alerts?ledgerId=&periodId=&warningPct=10&criticalPct=25
  app.get("/reports/budget-variance-alerts", async (req, reply) => {
    const tenantId = req.headers["x-tenant-id"] as string;
    const userId = (req.headers["x-user-id"] as string) ?? "system";
    const { ledgerId, periodId, warningPct, criticalPct } = VarianceAlertsQuerySchema.parse(req.query);

    const varianceResult = await runtime.withTenant({ tenantId, userId }, async (deps) => {
      return getBudgetVariance({ ledgerId, periodId }, {
        budgetRepo: deps.budgetRepo,
        balanceRepo: deps.balanceRepo,
        accountRepo: deps.accountRepo,
        ledgerRepo: deps.ledgerRepo,
      });
    });

    if (!varianceResult.ok) {
      return reply.status(mapErrorToStatus(varianceResult.error)).send({ error: varianceResult.error });
    }

    const alertResult = evaluateVarianceAlerts(varianceResult.value.rows, {
      percentageWarning: warningPct,
      percentageCritical: criticalPct,
    });

    return reply.send(alertResult.result);
  });

  // GET /reports/comparative-balance-sheet?ledgerId=&currentPeriodId=&priorPeriodId=
  app.get("/reports/comparative-balance-sheet", async (req, reply) => {
    const tenantId = req.headers["x-tenant-id"] as string;
    const userId = (req.headers["x-user-id"] as string) ?? "system";
    const { ledgerId, currentPeriodId, priorPeriodId } = ComparativeBalanceSheetQuerySchema.parse(req.query);

    const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
      return getComparativeBalanceSheet({ ledgerId, currentPeriodId, priorPeriodId }, {
        balanceRepo: deps.balanceRepo,
        ledgerRepo: deps.ledgerRepo,
      });
    });

    if (!result.ok) return reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    return reply.send(result.value);
  });

  // GET /reports/comparative-income-statement?ledgerId=&currentFromPeriodId=&currentToPeriodId=&priorFromPeriodId=&priorToPeriodId=
  app.get("/reports/comparative-income-statement", async (req, reply) => {
    const tenantId = req.headers["x-tenant-id"] as string;
    const userId = (req.headers["x-user-id"] as string) ?? "system";
    const { ledgerId, currentFromPeriodId, currentToPeriodId, priorFromPeriodId, priorToPeriodId } = ComparativeIncomeStatementQuerySchema.parse(req.query);

    const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
      return getComparativeIncomeStatement(
        { ledgerId, currentFromPeriodId, currentToPeriodId, priorFromPeriodId, priorToPeriodId },
        { balanceRepo: deps.balanceRepo, ledgerRepo: deps.ledgerRepo },
      );
    });

    if (!result.ok) return reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    return reply.send(result.value);
  });

  // GET /reports/ic-aging?currency=USD&asOfDate=2025-12-31
  app.get("/reports/ic-aging", async (req, reply) => {
    const tenantId = req.headers["x-tenant-id"] as string;
    const userId = (req.headers["x-user-id"] as string) ?? "system";
    const parsed = IcAgingQuerySchema.parse(req.query);
    const currency = parsed.currency;
    const asOfDate = parsed.asOfDate ? new Date(parsed.asOfDate) : new Date();

    const txResult = await runtime.withTenant({ tenantId, userId }, async (deps) => {
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
      status: tx.status as IcOpenItem["status"],
    }));

    const agingResult = computeIcAging(items, asOfDate, currency);
    return reply.send(agingResult.result);
  });
}
