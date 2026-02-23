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

// ─── Shared: Fastify plugins and error mapper ───────────────────────────────
export { mapErrorToStatus } from "./shared/routes/error-mapper.js";
export { registerErrorHandler, registerBigIntSerializer, registerTenantGuard } from "./shared/routes/fastify-plugins.js";
