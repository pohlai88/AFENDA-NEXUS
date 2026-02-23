/**
 * SHIM — Phase 0 Strangler Fig.
 * Re-exports infra layer from new slice locations.
 * TODO: Remove once all consumers import from slices/ directly.
 */

// ─── GL repos ───────────────────────────────────────────────────────────────
export { DrizzleJournalRepo } from "../slices/gl/repos/drizzle-journal-repo.js";
export { DrizzleAccountRepo } from "../slices/gl/repos/drizzle-account-repo.js";
export { DrizzlePeriodRepo } from "../slices/gl/repos/drizzle-period-repo.js";
export { DrizzleBalanceRepo } from "../slices/gl/repos/drizzle-balance-repo.js";

// ─── Shared repos ───────────────────────────────────────────────────────────
export { DrizzleIdempotencyStore } from "../shared/repos/drizzle-idempotency.js";
export { DrizzleOutboxWriter } from "../shared/repos/drizzle-outbox-writer.js";

// ─── Hub repos ──────────────────────────────────────────────────────────────
export { DrizzleRecurringTemplateRepo } from "../slices/hub/repos/drizzle-recurring-template-repo.js";
export { DrizzleBudgetRepo } from "../slices/hub/repos/drizzle-budget-repo.js";

// ─── Runtime ────────────────────────────────────────────────────────────────
export { createFinanceRuntime } from "../runtime.js";

// ─── GL routes ──────────────────────────────────────────────────────────────
export { registerJournalRoutes } from "../slices/gl/routes/journal-routes.js";
export { registerAccountRoutes } from "../slices/gl/routes/account-routes.js";
export { registerPeriodRoutes } from "../slices/gl/routes/period-routes.js";
export { registerBalanceRoutes } from "../slices/gl/routes/balance-routes.js";
export { registerLedgerRoutes } from "../slices/gl/routes/ledger-routes.js";

// ─── FX routes ──────────────────────────────────────────────────────────────
export { registerFxRateApprovalRoutes } from "../slices/fx/routes/fx-rate-approval-routes.js";

// ─── IC routes ──────────────────────────────────────────────────────────────
export { registerIcAgreementRoutes } from "../slices/ic/routes/ic-agreement-routes.js";
export { registerSettlementRoutes } from "../slices/ic/routes/settlement-routes.js";

// ─── Hub routes ─────────────────────────────────────────────────────────────
export { registerRecurringTemplateRoutes } from "../slices/hub/routes/recurring-template-routes.js";
export { registerBudgetRoutes } from "../slices/hub/routes/budget-routes.js";
export { registerClassificationRuleRoutes } from "../slices/hub/routes/classification-rule-routes.js";
export { registerRevenueRoutes } from "../slices/hub/routes/revenue-routes.js";

// ─── Reporting routes ───────────────────────────────────────────────────────
export { registerReportRoutes } from "../slices/reporting/routes/report-routes.js";

// ─── Shared mappers ─────────────────────────────────────────────────────────
export { mapJournalToDomain, mapLineToDomain } from "../shared/mappers/journal-mapper.js";
export { mapAccountToDomain } from "../shared/mappers/account-mapper.js";
export { mapPeriodToDomain } from "../shared/mappers/period-mapper.js";

// ─── Shared error mapping ───────────────────────────────────────────────────
export { mapErrorToStatus } from "../shared/routes/error-mapper.js";
