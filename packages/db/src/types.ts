import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import type { tenants, companies, users } from "./schema/platform.js";
import type {
  accounts,
  counterparties,
  currencies,
  fiscalPeriods,
  fiscalYears,
  fxRates,
  glBalances,
  glJournalLines,
  glJournals,
  icAgreements,
  icTransactionLegs,
  icTransactions,
  icSettlements,
  icSettlementLines,
  ledgers,
  recurringTemplates,
  budgetEntries,
  revenueContracts,
  recognitionMilestones,
  classificationRuleSets,
  classificationRules,
} from "./schema/erp.js";
import type { auditLogs } from "./schema/audit.js";
import type { outbox } from "./schema/outbox-table.js";
import type { idempotencyStore } from "./schema/idempotency-store.js";

// ─── Platform ───────────────────────────────────────────────────────────────

export type Tenant = InferSelectModel<typeof tenants>;
export type NewTenant = InferInsertModel<typeof tenants>;

export type Company = InferSelectModel<typeof companies>;
export type NewCompany = InferInsertModel<typeof companies>;

export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

// ─── ERP ────────────────────────────────────────────────────────────────────

export type Currency = InferSelectModel<typeof currencies>;
export type NewCurrency = InferInsertModel<typeof currencies>;

export type FiscalYear = InferSelectModel<typeof fiscalYears>;
export type NewFiscalYear = InferInsertModel<typeof fiscalYears>;

export type FiscalPeriod = InferSelectModel<typeof fiscalPeriods>;
export type NewFiscalPeriod = InferInsertModel<typeof fiscalPeriods>;

export type Account = InferSelectModel<typeof accounts>;
export type NewAccount = InferInsertModel<typeof accounts>;

export type Ledger = InferSelectModel<typeof ledgers>;
export type NewLedger = InferInsertModel<typeof ledgers>;

export type GlJournal = InferSelectModel<typeof glJournals>;
export type NewGlJournal = InferInsertModel<typeof glJournals>;

export type GlJournalLine = InferSelectModel<typeof glJournalLines>;
export type NewGlJournalLine = InferInsertModel<typeof glJournalLines>;

export type GlBalance = InferSelectModel<typeof glBalances>;
export type NewGlBalance = InferInsertModel<typeof glBalances>;

export type Counterparty = InferSelectModel<typeof counterparties>;
export type NewCounterparty = InferInsertModel<typeof counterparties>;

export type IcAgreement = InferSelectModel<typeof icAgreements>;
export type NewIcAgreement = InferInsertModel<typeof icAgreements>;

export type IcTransaction = InferSelectModel<typeof icTransactions>;
export type NewIcTransaction = InferInsertModel<typeof icTransactions>;

export type IcTransactionLeg = InferSelectModel<typeof icTransactionLegs>;
export type NewIcTransactionLeg = InferInsertModel<typeof icTransactionLegs>;

export type FxRate = InferSelectModel<typeof fxRates>;
export type NewFxRate = InferInsertModel<typeof fxRates>;

export type RecurringTemplate = InferSelectModel<typeof recurringTemplates>;
export type NewRecurringTemplate = InferInsertModel<typeof recurringTemplates>;

export type BudgetEntry = InferSelectModel<typeof budgetEntries>;
export type NewBudgetEntry = InferInsertModel<typeof budgetEntries>;

export type IcSettlement = InferSelectModel<typeof icSettlements>;
export type NewIcSettlement = InferInsertModel<typeof icSettlements>;

export type IcSettlementLine = InferSelectModel<typeof icSettlementLines>;
export type NewIcSettlementLine = InferInsertModel<typeof icSettlementLines>;

export type RevenueContract = InferSelectModel<typeof revenueContracts>;
export type NewRevenueContract = InferInsertModel<typeof revenueContracts>;

export type RecognitionMilestone = InferSelectModel<typeof recognitionMilestones>;
export type NewRecognitionMilestone = InferInsertModel<typeof recognitionMilestones>;

export type ClassificationRuleSet = InferSelectModel<typeof classificationRuleSets>;
export type NewClassificationRuleSet = InferInsertModel<typeof classificationRuleSets>;

export type ClassificationRule = InferSelectModel<typeof classificationRules>;
export type NewClassificationRule = InferInsertModel<typeof classificationRules>;

// ─── Audit ──────────────────────────────────────────────────────────────

export type AuditLog = InferSelectModel<typeof auditLogs>;
export type NewAuditLog = InferInsertModel<typeof auditLogs>;

// ─── Outbox ─────────────────────────────────────────────────────────────

export type OutboxEntry = InferSelectModel<typeof outbox>;
export type NewOutboxEntry = InferInsertModel<typeof outbox>;

// ─── Idempotency ────────────────────────────────────────────────────────

export type IdempotencyStoreEntry = InferSelectModel<typeof idempotencyStore>;
export type NewIdempotencyStoreEntry = InferInsertModel<typeof idempotencyStore>;
