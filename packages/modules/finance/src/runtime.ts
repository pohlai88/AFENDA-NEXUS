import type { DbSession } from "@afenda/db";
import type { FinanceRuntime, FinanceDeps } from "./app/ports/finance-runtime.js";
import { DrizzleJournalRepo } from "./slices/gl/repos/drizzle-journal-repo.js";
import { DrizzleAccountRepo } from "./slices/gl/repos/drizzle-account-repo.js";
import { DrizzlePeriodRepo } from "./slices/gl/repos/drizzle-period-repo.js";
import { DrizzleBalanceRepo } from "./slices/gl/repos/drizzle-balance-repo.js";
import { DrizzleIdempotencyStore } from "./shared/repos/drizzle-idempotency.js";
import { DrizzleOutboxWriter } from "./shared/repos/drizzle-outbox-writer.js";
import { DrizzleJournalAuditRepo } from "./slices/gl/repos/drizzle-journal-audit-repo.js";
import { DrizzleFxRateRepo } from "./slices/fx/repos/drizzle-fx-rate-repo.js";
import { DrizzleLedgerRepo } from "./slices/gl/repos/drizzle-ledger-repo.js";
import { DrizzleIcAgreementRepo, DrizzleIcTransactionRepo } from "./slices/ic/repos/drizzle-ic-repo.js";
import { DrizzleRecurringTemplateRepo } from "./slices/hub/repos/drizzle-recurring-template-repo.js";
import { DrizzleBudgetRepo } from "./slices/hub/repos/drizzle-budget-repo.js";
import { DrizzlePeriodAuditRepo } from "./slices/gl/repos/drizzle-period-audit-repo.js";
import { DrizzleIcSettlementRepo } from "./slices/ic/repos/drizzle-ic-settlement-repo.js";
import { DrizzleClassificationRuleRepo } from "./slices/hub/repos/drizzle-classification-rule-repo.js";
import { DrizzleFxRateApprovalRepo } from "./slices/fx/repos/drizzle-fx-rate-approval-repo.js";
import { DrizzleRevenueContractRepo } from "./slices/hub/repos/drizzle-revenue-contract-repo.js";
import { DrizzleDocumentNumberGenerator } from "./slices/gl/repos/drizzle-document-number-generator.js";
import { DrizzleApInvoiceRepo } from "./slices/ap/repos/drizzle-ap-invoice-repo.js";
import { DrizzlePaymentTermsRepo } from "./slices/ap/repos/drizzle-payment-terms-repo.js";
import { DrizzleApPaymentRunRepo } from "./slices/ap/repos/drizzle-ap-payment-run-repo.js";
import { DrizzleArInvoiceRepo } from "./slices/ar/repos/drizzle-ar-invoice-repo.js";
import { DrizzleArPaymentAllocationRepo } from "./slices/ar/repos/drizzle-ar-payment-allocation-repo.js";
import { DrizzleDunningRepo } from "./slices/ar/repos/drizzle-dunning-repo.js";

/**
 * Composition-root adapter that wires all Drizzle repos into a FinanceRuntime.
 * Created in apps/api and injected into routes.
 * Routes never see DbSession, TenantTx, or Drizzle.
 */
export function createFinanceRuntime(session: DbSession): FinanceRuntime {
  return {
    async withTenant<T>(
      ctx: { tenantId: string; userId: string },
      fn: (deps: FinanceDeps) => Promise<T>,
    ): Promise<T> {
      return session.withTenant(ctx, async (tx) => {
        const deps: FinanceDeps = {
          journalRepo: new DrizzleJournalRepo(tx),
          accountRepo: new DrizzleAccountRepo(tx),
          periodRepo: new DrizzlePeriodRepo(tx),
          balanceRepo: new DrizzleBalanceRepo(tx),
          idempotencyStore: new DrizzleIdempotencyStore(tx),
          outboxWriter: new DrizzleOutboxWriter(tx),
          journalAuditRepo: new DrizzleJournalAuditRepo(tx),
          fxRateRepo: new DrizzleFxRateRepo(tx),
          ledgerRepo: new DrizzleLedgerRepo(tx),
          icAgreementRepo: new DrizzleIcAgreementRepo(tx),
          icTransactionRepo: new DrizzleIcTransactionRepo(tx),
          recurringTemplateRepo: new DrizzleRecurringTemplateRepo(tx),
          budgetRepo: new DrizzleBudgetRepo(tx),
          periodAuditRepo: new DrizzlePeriodAuditRepo(tx),
          icSettlementRepo: new DrizzleIcSettlementRepo(tx),
          classificationRuleRepo: new DrizzleClassificationRuleRepo(tx),
          fxRateApprovalRepo: new DrizzleFxRateApprovalRepo(tx),
          revenueContractRepo: new DrizzleRevenueContractRepo(tx),
          documentNumberGenerator: new DrizzleDocumentNumberGenerator(tx),
          apInvoiceRepo: new DrizzleApInvoiceRepo(tx),
          paymentTermsRepo: new DrizzlePaymentTermsRepo(tx),
          apPaymentRunRepo: new DrizzleApPaymentRunRepo(tx),
          arInvoiceRepo: new DrizzleArInvoiceRepo(tx),
          arPaymentAllocationRepo: new DrizzleArPaymentAllocationRepo(tx),
          dunningRepo: new DrizzleDunningRepo(tx),
        };
        return fn(deps);
      });
    },
  };
}
