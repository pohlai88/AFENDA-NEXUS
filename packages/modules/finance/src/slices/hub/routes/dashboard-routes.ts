import type { FastifyInstance } from 'fastify';
import type { FinanceRuntime } from '../../../app/ports/finance-runtime.js';
import type { IAuthorizationPolicy } from '../../../shared/ports/authorization.js';
import { requirePermission } from '../../../shared/routes/authorization-guard.js';
import { extractIdentity } from '@afenda/api-kit';
import type { Pagination } from '@afenda/contracts';

/** Use read replica when DATABASE_URL_READONLY is set; otherwise primary. */
const withDashboardCtx = (runtime: FinanceRuntime) =>
  runtime.withTenantReadOnly ?? runtime.withTenant;

export function registerDashboardRoutes(
  app: FastifyInstance,
  runtime: FinanceRuntime,
  policy: IAuthorizationPolicy
): void {
  const run = withDashboardCtx(runtime);

  app.get(
    '/dashboard/summary',
    { preHandler: [requirePermission(policy, 'trialBalance:read')] },
    async (req, reply) => {
      const { tenantId, userId } = extractIdentity(req);

      const result = await run({ tenantId, userId }, async (deps) => {
        // 1. Cash balance via trial balance — find the default ledger + open period,
        //    then sum ASSET rows whose account code starts with '1'.
        let cashBalance = 0;
        try {
          const ledgerQuery: Pagination = { page: 1, limit: 1 };
          const periodQuery: Pagination = { page: 1, limit: 100 };
          const ledgerResult = await deps.ledgerRepo.findAll(ledgerQuery);
          const periodResult = await deps.periodRepo.findAll(periodQuery);

          if (ledgerResult.ok && periodResult.ok) {
            const defaultLedger = ledgerResult.value.data[0];
            const openPeriod = periodResult.value.data.find((p) => p.status === 'OPEN');

            if (defaultLedger && openPeriod) {
              const tbResult = await deps.balanceRepo.getTrialBalance(
                defaultLedger.id,
                openPeriod.name.split(' ')[0] ?? new Date().getFullYear().toString()
              );
              if (tbResult.ok) {
                for (const row of tbResult.value.rows) {
                  if (row.accountType === 'ASSET' && row.accountCode.startsWith('1')) {
                    cashBalance += Number(row.debitTotal.amount - row.creditTotal.amount);
                  }
                }
              }
            }
          }
        } catch {
          // Best-effort; cashBalance stays 0
        }

        // 2. Open AR (POSTED + APPROVED invoices)
        let arCount = 0;
        let arTotal = 0n;
        try {
          const arResult = await deps.arInvoiceRepo.findAll({ page: 1, limit: 10000 });
          const openStatuses = new Set(['POSTED', 'APPROVED']);
          for (const inv of arResult.data) {
            if (openStatuses.has(inv.status)) {
              arCount++;
              arTotal += inv.totalAmount.amount - inv.paidAmount.amount;
            }
          }
        } catch {
          // Best-effort
        }

        // 3. Open AP (POSTED + APPROVED invoices)
        let apCount = 0;
        let apTotal = 0n;
        try {
          const apResult = await deps.apInvoiceRepo.findAll({ page: 1, limit: 10000 });
          const openStatuses = new Set(['POSTED', 'APPROVED']);
          for (const inv of apResult.data) {
            if (openStatuses.has(inv.status)) {
              apCount++;
              apTotal += inv.totalAmount.amount - inv.paidAmount.amount;
            }
          }
        } catch {
          // Best-effort
        }

        // 4. Current fiscal period (status = OPEN)
        let currentPeriod: { id: string; name: string; status: string } | null = null;
        try {
          const periodResult = await deps.periodRepo.findAll({ page: 1, limit: 100 });
          if (periodResult.ok) {
            const open = periodResult.value.data.find((p) => p.status === 'OPEN');
            if (open) {
              currentPeriod = { id: open.id, name: open.name, status: open.status };
            }
          }
        } catch {
          // Best-effort
        }

        // 5. Recent activity (last 10 outbox entries)
        let recentActivity: Array<{
          id: string;
          eventType: string;
          createdAt: string;
          payload: unknown;
        }> = [];
        try {
          if (deps.outboxWriter.findRecent) {
            const rows = await deps.outboxWriter.findRecent(10);
            recentActivity = rows.map((r) => ({
              id: r.id,
              eventType: r.eventType,
              createdAt: r.createdAt.toISOString(),
              payload: r.payload,
            }));
          }
        } catch {
          // Outbox query is best-effort
        }

        return {
          cashBalance,
          openAr: { count: arCount, total: Number(arTotal) },
          openAp: { count: apCount, total: Number(apTotal) },
          currentPeriod,
          recentActivity,
        };
      });

      return reply.send(result);
    }
  );
}
