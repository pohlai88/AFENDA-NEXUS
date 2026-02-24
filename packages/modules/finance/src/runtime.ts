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
import { DrizzleTaxCodeRepo } from "./slices/tax/repos/drizzle-tax-code-repo.js";
import { DrizzleTaxRateRepo } from "./slices/tax/repos/drizzle-tax-rate-repo.js";
import { DrizzleTaxReturnRepo } from "./slices/tax/repos/drizzle-tax-return-repo.js";
import { DrizzleWhtCertificateRepo } from "./slices/tax/repos/drizzle-wht-certificate-repo.js";
import { DrizzleAssetRepo } from "./slices/fixed-assets/repos/drizzle-asset-repo.js";
import { DrizzleDepreciationScheduleRepo } from "./slices/fixed-assets/repos/drizzle-depreciation-schedule-repo.js";
import { DrizzleAssetMovementRepo } from "./slices/fixed-assets/repos/drizzle-asset-movement-repo.js";
import { DrizzleBankStatementRepo } from "./slices/bank/repos/drizzle-bank-statement-repo.js";
import { DrizzleBankMatchRepo } from "./slices/bank/repos/drizzle-bank-match-repo.js";
import { DrizzleBankReconciliationRepo } from "./slices/bank/repos/drizzle-bank-reconciliation-repo.js";
import { DrizzleCreditLimitRepo } from "./slices/credit/repos/drizzle-credit-limit-repo.js";
import { DrizzleCreditReviewRepo } from "./slices/credit/repos/drizzle-credit-review-repo.js";
import { DrizzleExpenseClaimRepo } from "./slices/expense/repos/drizzle-expense-claim-repo.js";
import { DrizzleExpensePolicyRepo } from "./slices/expense/repos/drizzle-expense-policy-repo.js";
import { DrizzleProjectRepo } from "./slices/project/repos/drizzle-project-repo.js";
import { DrizzleLeaseContractRepo } from "./slices/lease/repos/drizzle-lease-contract-repo.js";
import { DrizzleLeaseScheduleRepo } from "./slices/lease/repos/drizzle-lease-schedule-repo.js";
import { DrizzleLeaseModificationRepo } from "./slices/lease/repos/drizzle-lease-modification-repo.js";
import { DrizzleProvisionRepo } from "./slices/provision/repos/drizzle-provision-repo.js";
import { DrizzleProvisionMovementRepo } from "./slices/provision/repos/drizzle-provision-movement-repo.js";
import { DrizzleCashForecastRepo } from "./slices/treasury/repos/drizzle-cash-forecast-repo.js";
import { DrizzleCovenantRepo } from "./slices/treasury/repos/drizzle-covenant-repo.js";
import { DrizzleIcLoanRepo } from "./slices/treasury/repos/drizzle-ic-loan-repo.js";
import { DrizzleCostCenterRepo } from "./slices/cost-accounting/repos/drizzle-cost-center-repo.js";
import { DrizzleCostDriverRepo } from "./slices/cost-accounting/repos/drizzle-cost-driver-repo.js";
import { DrizzleCostAllocationRunRepo } from "./slices/cost-accounting/repos/drizzle-cost-allocation-run-repo.js";
import { DrizzleGroupEntityRepo } from "./slices/consolidation/repos/drizzle-group-entity-repo.js";
import { DrizzleOwnershipRecordRepo } from "./slices/consolidation/repos/drizzle-ownership-record-repo.js";
import { DrizzleGoodwillRepo } from "./slices/consolidation/repos/drizzle-goodwill-repo.js";
import { DrizzleFinInstrumentRepo } from "./slices/fin-instruments/repos/drizzle-fin-instrument-repo.js";
import { DrizzleFairValueMeasurementRepo } from "./slices/fin-instruments/repos/drizzle-fair-value-measurement-repo.js";
import { DrizzleHedgeRelationshipRepo } from "./slices/hedge/repos/drizzle-hedge-relationship-repo.js";
import { DrizzleHedgeEffectivenessTestRepo } from "./slices/hedge/repos/drizzle-hedge-effectiveness-test-repo.js";
import { DrizzleIntangibleAssetRepo } from "./slices/intangibles/repos/drizzle-intangible-asset-repo.js";
import { DrizzleDeferredTaxItemRepo } from "./slices/deferred-tax/repos/drizzle-deferred-tax-item-repo.js";
import { DrizzleTpPolicyRepo } from "./slices/transfer-pricing/repos/drizzle-tp-policy-repo.js";
import { DrizzleTpBenchmarkRepo } from "./slices/transfer-pricing/repos/drizzle-tp-benchmark-repo.js";

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
          taxCodeRepo: new DrizzleTaxCodeRepo(tx),
          taxRateRepo: new DrizzleTaxRateRepo(tx),
          taxReturnRepo: new DrizzleTaxReturnRepo(tx),
          whtCertificateRepo: new DrizzleWhtCertificateRepo(tx),
          assetRepo: new DrizzleAssetRepo(tx),
          depreciationScheduleRepo: new DrizzleDepreciationScheduleRepo(tx),
          assetMovementRepo: new DrizzleAssetMovementRepo(tx),
          bankStatementRepo: new DrizzleBankStatementRepo(tx),
          bankMatchRepo: new DrizzleBankMatchRepo(tx),
          bankReconciliationRepo: new DrizzleBankReconciliationRepo(tx),
          creditLimitRepo: new DrizzleCreditLimitRepo(tx),
          creditReviewRepo: new DrizzleCreditReviewRepo(tx),
          expenseClaimRepo: new DrizzleExpenseClaimRepo(tx),
          expensePolicyRepo: new DrizzleExpensePolicyRepo(tx),
          projectRepo: new DrizzleProjectRepo(tx),
          leaseContractRepo: new DrizzleLeaseContractRepo(tx),
          leaseScheduleRepo: new DrizzleLeaseScheduleRepo(tx),
          leaseModificationRepo: new DrizzleLeaseModificationRepo(tx),
          provisionRepo: new DrizzleProvisionRepo(tx),
          provisionMovementRepo: new DrizzleProvisionMovementRepo(tx),
          cashForecastRepo: new DrizzleCashForecastRepo(tx),
          covenantRepo: new DrizzleCovenantRepo(tx),
          icLoanRepo: new DrizzleIcLoanRepo(tx),
          costCenterRepo: new DrizzleCostCenterRepo(tx),
          costDriverRepo: new DrizzleCostDriverRepo(tx),
          costAllocationRunRepo: new DrizzleCostAllocationRunRepo(tx),
          groupEntityRepo: new DrizzleGroupEntityRepo(tx),
          ownershipRecordRepo: new DrizzleOwnershipRecordRepo(tx),
          goodwillRepo: new DrizzleGoodwillRepo(tx),
          finInstrumentRepo: new DrizzleFinInstrumentRepo(tx),
          fairValueMeasurementRepo: new DrizzleFairValueMeasurementRepo(tx),
          hedgeRelationshipRepo: new DrizzleHedgeRelationshipRepo(tx),
          hedgeEffectivenessTestRepo: new DrizzleHedgeEffectivenessTestRepo(tx),
          intangibleAssetRepo: new DrizzleIntangibleAssetRepo(tx),
          deferredTaxItemRepo: new DrizzleDeferredTaxItemRepo(tx),
          tpPolicyRepo: new DrizzleTpPolicyRepo(tx),
          tpBenchmarkRepo: new DrizzleTpBenchmarkRepo(tx),
        };
        return fn(deps);
      });
    },
  };
}
