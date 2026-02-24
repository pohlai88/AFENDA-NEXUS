/**
 * @afenda/finance/infra — Infrastructure adapters subpath.
 *
 * OBS-01: Separated from the public API so consumers who only need
 * domain types and services don't pull in drizzle-orm or fastify.
 *
 * Import from "@afenda/finance/infra" for Drizzle repos, route registrars, and runtime.
 */

// ─── GL repos ───────────────────────────────────────────────────────────────
export { DrizzleJournalRepo } from "./slices/gl/repos/drizzle-journal-repo.js";
export { DrizzleAccountRepo } from "./slices/gl/repos/drizzle-account-repo.js";
export { DrizzlePeriodRepo } from "./slices/gl/repos/drizzle-period-repo.js";
export { DrizzleBalanceRepo } from "./slices/gl/repos/drizzle-balance-repo.js";
export { DrizzleJournalAuditRepo } from "./slices/gl/repos/drizzle-journal-audit-repo.js";
export { DrizzleLedgerRepo } from "./slices/gl/repos/drizzle-ledger-repo.js";
export { DrizzleDocumentNumberGenerator } from "./slices/gl/repos/drizzle-document-number-generator.js";

// ─── Shared repos ───────────────────────────────────────────────────────────
export { DrizzleIdempotencyStore } from "./shared/repos/drizzle-idempotency.js";
export { DrizzleOutboxWriter } from "./shared/repos/drizzle-outbox-writer.js";

// ─── FX repos ───────────────────────────────────────────────────────────────
export { DrizzleFxRateRepo } from "./slices/fx/repos/drizzle-fx-rate-repo.js";

// ─── IC repos ───────────────────────────────────────────────────────────────
export { DrizzleIcAgreementRepo, DrizzleIcTransactionRepo } from "./slices/ic/repos/drizzle-ic-repo.js";

// ─── Hub repos ──────────────────────────────────────────────────────────────
export { DrizzleRecurringTemplateRepo } from "./slices/hub/repos/drizzle-recurring-template-repo.js";
export { DrizzleBudgetRepo } from "./slices/hub/repos/drizzle-budget-repo.js";

// ─── Runtime composition root ───────────────────────────────────────────────
export { createFinanceRuntime } from "./runtime.js";

// ─── GL routes ──────────────────────────────────────────────────────────────
export { registerJournalRoutes } from "./slices/gl/routes/journal-routes.js";
export { registerAccountRoutes } from "./slices/gl/routes/account-routes.js";
export { registerPeriodRoutes } from "./slices/gl/routes/period-routes.js";
export { registerBalanceRoutes } from "./slices/gl/routes/balance-routes.js";
export { registerLedgerRoutes } from "./slices/gl/routes/ledger-routes.js";

// ─── FX routes ──────────────────────────────────────────────────────────────
export { registerFxRateRoutes } from "./slices/fx/routes/fx-rate-routes.js";
export { registerFxRateApprovalRoutes } from "./slices/fx/routes/fx-rate-approval-routes.js";

// ─── IC routes ──────────────────────────────────────────────────────────────
export { registerIcRoutes } from "./slices/ic/routes/ic-routes.js";
export { registerIcAgreementRoutes } from "./slices/ic/routes/ic-agreement-routes.js";
export { registerSettlementRoutes } from "./slices/ic/routes/settlement-routes.js";

// ─── Hub routes ─────────────────────────────────────────────────────────────
export { registerRecurringTemplateRoutes } from "./slices/hub/routes/recurring-template-routes.js";
export { registerBudgetRoutes } from "./slices/hub/routes/budget-routes.js";
export { registerClassificationRuleRoutes } from "./slices/hub/routes/classification-rule-routes.js";
export { registerRevenueRoutes } from "./slices/hub/routes/revenue-routes.js";
export { registerConsolidationRoutes } from "./slices/hub/routes/consolidation-routes.js";

// ─── Reporting routes ───────────────────────────────────────────────────────
export { registerReportRoutes } from "./slices/reporting/routes/report-routes.js";

// ─── AP routes ──────────────────────────────────────────────────────────────
export { registerApInvoiceRoutes } from "./slices/ap/routes/ap-invoice-routes.js";
export { registerApPaymentRunRoutes } from "./slices/ap/routes/ap-payment-run-routes.js";
export { registerApAgingRoutes } from "./slices/ap/routes/ap-aging-routes.js";

// ─── AR routes ──────────────────────────────────────────────────────────────
export { registerArInvoiceRoutes } from "./slices/ar/routes/ar-invoice-routes.js";
export { registerArPaymentRoutes } from "./slices/ar/routes/ar-payment-routes.js";
export { registerArDunningRoutes } from "./slices/ar/routes/ar-dunning-routes.js";
export { registerArAgingRoutes } from "./slices/ar/routes/ar-aging-routes.js";

// ─── Tax routes ─────────────────────────────────────────────────────────────
export { registerTaxCodeRoutes } from "./slices/tax/routes/tax-code-routes.js";
export { registerTaxRateRoutes } from "./slices/tax/routes/tax-rate-routes.js";
export { registerTaxReturnRoutes } from "./slices/tax/routes/tax-return-routes.js";
export { registerWhtCertificateRoutes } from "./slices/tax/routes/wht-certificate-routes.js";

// ─── Fixed Assets routes ────────────────────────────────────────────────────
export { registerAssetRoutes } from "./slices/fixed-assets/routes/asset-routes.js";

// ─── Bank routes ────────────────────────────────────────────────────────────
export { registerBankRoutes } from "./slices/bank/routes/bank-routes.js";

// ─── Credit routes ──────────────────────────────────────────────────────────
export { registerCreditRoutes } from "./slices/credit/routes/credit-routes.js";

// ─── Expense routes ─────────────────────────────────────────────────────────
export { registerExpenseRoutes } from "./slices/expense/routes/expense-routes.js";

// ─── Project routes ─────────────────────────────────────────────────────────
export { registerProjectRoutes } from "./slices/project/routes/project-routes.js";

// ─── Lease routes (Phase 4) ─────────────────────────────────────────────────
export { registerLeaseRoutes } from "./slices/lease/routes/lease-routes.js";

// ─── Provision routes (Phase 4) ─────────────────────────────────────────────
export { registerProvisionRoutes } from "./slices/provision/routes/provision-routes.js";

// ─── Treasury routes (Phase 4) ──────────────────────────────────────────────
export { registerTreasuryRoutes } from "./slices/treasury/routes/treasury-routes.js";

// ─── Consolidation ext routes (Phase 5) ─────────────────────────────────────
export { registerConsolidationExtRoutes } from "./slices/consolidation/routes/consolidation-ext-routes.js";

// ─── Cost Accounting routes (Phase 5) ───────────────────────────────────────
export { registerCostAccountingRoutes } from "./slices/cost-accounting/routes/cost-accounting-routes.js";

// ─── Phase 4 repos ──────────────────────────────────────────────────────────
export { DrizzleLeaseContractRepo } from "./slices/lease/repos/drizzle-lease-contract-repo.js";
export { DrizzleLeaseScheduleRepo } from "./slices/lease/repos/drizzle-lease-schedule-repo.js";
export { DrizzleLeaseModificationRepo } from "./slices/lease/repos/drizzle-lease-modification-repo.js";
export { DrizzleProvisionRepo } from "./slices/provision/repos/drizzle-provision-repo.js";
export { DrizzleProvisionMovementRepo } from "./slices/provision/repos/drizzle-provision-movement-repo.js";
export { DrizzleCashForecastRepo } from "./slices/treasury/repos/drizzle-cash-forecast-repo.js";
export { DrizzleCovenantRepo } from "./slices/treasury/repos/drizzle-covenant-repo.js";
export { DrizzleIcLoanRepo } from "./slices/treasury/repos/drizzle-ic-loan-repo.js";

// ─── Shared: Fastify plugins and error mapper ───────────────────────────────
export { mapErrorToStatus } from "./shared/routes/error-mapper.js";
export { registerErrorHandler, registerBigIntSerializer, registerTenantGuard } from "./shared/routes/fastify-plugins.js";

// ─── Fin-Instruments routes & repos (Phase 7) ──────────────────────────────
export { registerFinInstrumentRoutes } from "./slices/fin-instruments/routes/fin-instrument-routes.js";
export { DrizzleFinInstrumentRepo } from "./slices/fin-instruments/repos/drizzle-fin-instrument-repo.js";
export { DrizzleFairValueMeasurementRepo } from "./slices/fin-instruments/repos/drizzle-fair-value-measurement-repo.js";

// ─── Hedge routes & repos (Phase 7) ────────────────────────────────────────
export { registerHedgeRoutes } from "./slices/hedge/routes/hedge-routes.js";
export { DrizzleHedgeRelationshipRepo } from "./slices/hedge/repos/drizzle-hedge-relationship-repo.js";
export { DrizzleHedgeEffectivenessTestRepo } from "./slices/hedge/repos/drizzle-hedge-effectiveness-test-repo.js";

// ─── Intangibles routes & repos (Phase 7) ──────────────────────────────────
export { registerIntangibleRoutes } from "./slices/intangibles/routes/intangible-routes.js";
export { DrizzleIntangibleAssetRepo } from "./slices/intangibles/repos/drizzle-intangible-asset-repo.js";

// ─── Deferred Tax routes & repos (Phase 7) ─────────────────────────────────
export { registerDeferredTaxRoutes } from "./slices/deferred-tax/routes/deferred-tax-routes.js";
export { DrizzleDeferredTaxItemRepo } from "./slices/deferred-tax/repos/drizzle-deferred-tax-item-repo.js";

// ─── Transfer Pricing routes & repos (Phase 7) ─────────────────────────────
export { registerTransferPricingRoutes } from "./slices/transfer-pricing/routes/transfer-pricing-routes.js";
export { DrizzleTpPolicyRepo } from "./slices/transfer-pricing/repos/drizzle-tp-policy-repo.js";
export { DrizzleTpBenchmarkRepo } from "./slices/transfer-pricing/repos/drizzle-tp-benchmark-repo.js";
