import type { FastifyInstance } from 'fastify';
import { SupplierReconRequestSchema } from '@afenda/contracts';
import type { FinanceRuntime } from '../../../app/ports/finance-runtime.js';
import type { IAuthorizationPolicy } from '../../../shared/ports/authorization.js';
import { requirePermission } from '../../../shared/routes/authorization-guard.js';
import { reconcileSupplierStatement } from '../calculators/supplier-statement-recon.js';
import type {
  SupplierStatementLine,
  ApLedgerEntry,
} from '../calculators/supplier-statement-recon.js';
import { extractIdentity } from '@afenda/api-kit';
import { toMinorUnits } from '@afenda/core';

export function registerApSupplierReconRoutes(
  app: FastifyInstance,
  runtime: FinanceRuntime,
  policy: IAuthorizationPolicy
): void {
  // POST /ap/supplier-recon — reconcile supplier statement against AP ledger
  app.post(
    '/ap/supplier-recon',
    { preHandler: [requirePermission(policy, 'report:read')] },
    async (req, reply) => {
      const { tenantId, userId } = extractIdentity(req);
      const body = SupplierReconRequestSchema.parse(req.body);

      const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
        // Convert statement lines to domain format
        const statementLines: SupplierStatementLine[] = body.statementLines.map((sl) => ({
          lineRef: sl.lineRef,
          date: new Date(sl.date),
          description: sl.description,
          amount: toMinorUnits(sl.amount, sl.currencyCode),
          currencyCode: sl.currencyCode,
        }));

        // Load AP invoices for the supplier as ledger entries
        const invoices = await deps.apInvoiceRepo.findBySupplier(body.supplierId, {
          page: 1,
          limit: 1000,
        });

        const ledgerEntries: ApLedgerEntry[] = invoices.data.map((inv) => ({
          invoiceId: inv.id,
          invoiceNumber: inv.invoiceNumber,
          invoiceDate: inv.invoiceDate,
          amount: inv.totalAmount.amount,
          currencyCode: inv.totalAmount.currency,
          supplierRef: inv.supplierRef,
        }));

        return reconcileSupplierStatement(
          body.supplierId,
          new Date(body.asOfDate),
          statementLines,
          ledgerEntries,
          body.dateTolerance
        );
      });

      return reply.send(result);
    }
  );
}
