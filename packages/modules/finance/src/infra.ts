/**
 * @afenda/finance/infra — Infrastructure adapters subpath.
 *
 * OBS-01: Separated from the public API so consumers who only need
 * domain types and services don't pull in drizzle-orm or fastify.
 *
 * Import from "@afenda/finance/infra" for Drizzle repos, route registrars, and runtime.
 */

// Drizzle repositories
export { DrizzleJournalRepo } from "./infra/repositories/drizzle-journal-repo.js";
export { DrizzleAccountRepo } from "./infra/repositories/drizzle-account-repo.js";
export { DrizzlePeriodRepo } from "./infra/repositories/drizzle-period-repo.js";
export { DrizzleBalanceRepo } from "./infra/repositories/drizzle-balance-repo.js";
export { DrizzleIdempotencyStore } from "./infra/repositories/drizzle-idempotency.js";
export { DrizzleOutboxWriter } from "./infra/repositories/drizzle-outbox-writer.js";
export { DrizzleJournalAuditRepo } from "./infra/repositories/drizzle-journal-audit-repo.js";
export { DrizzleFxRateRepo } from "./infra/repositories/drizzle-fx-rate-repo.js";
export { DrizzleLedgerRepo } from "./infra/repositories/drizzle-ledger-repo.js";
export { DrizzleIcAgreementRepo, DrizzleIcTransactionRepo } from "./infra/repositories/drizzle-ic-repo.js";
export { DrizzleDocumentNumberGenerator } from "./infra/repositories/drizzle-document-number-generator.js";
export { DrizzleRecurringTemplateRepo } from "./infra/repositories/drizzle-recurring-template-repo.js";
export { DrizzleBudgetRepo } from "./infra/repositories/drizzle-budget-repo.js";

// Runtime composition root
export { createFinanceRuntime } from "./infra/drizzle-finance-runtime.js";

// Fastify route registrars
export { registerJournalRoutes } from "./infra/routes/journal-routes.js";
export { registerAccountRoutes } from "./infra/routes/account-routes.js";
export { registerPeriodRoutes } from "./infra/routes/period-routes.js";
export { registerBalanceRoutes } from "./infra/routes/balance-routes.js";
export { registerIcRoutes } from "./infra/routes/ic-routes.js";
export { registerIcAgreementRoutes } from "./infra/routes/ic-agreement-routes.js";
export { registerLedgerRoutes } from "./infra/routes/ledger-routes.js";
export { registerFxRateRoutes } from "./infra/routes/fx-rate-routes.js";
export { registerRecurringTemplateRoutes } from "./infra/routes/recurring-template-routes.js";
export { registerBudgetRoutes } from "./infra/routes/budget-routes.js";
export { registerReportRoutes } from "./infra/routes/report-routes.js";
export { registerSettlementRoutes } from "./infra/routes/settlement-routes.js";
export { registerClassificationRuleRoutes } from "./infra/routes/classification-rule-routes.js";
export { registerFxRateApprovalRoutes } from "./infra/routes/fx-rate-approval-routes.js";
export { registerRevenueRoutes } from "./infra/routes/revenue-routes.js";

// Fastify plugins and error mapper
export { mapErrorToStatus } from "./infra/routes/error-mapper.js";
export { registerErrorHandler, registerBigIntSerializer, registerTenantGuard } from "./infra/routes/fastify-plugins.js";
