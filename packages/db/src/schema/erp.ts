import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  primaryKey,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { erpSchema } from "./_schemas";
import {
  accountTypeEnum,
  apInvoiceStatusEnum,
  contractStatusEnum,
  counterpartyTypeEnum,
  documentTypeEnum,
  icLegSideEnum,
  icPricingEnum,
  icSettlementStatusEnum,
  journalStatusEnum,
  paymentRunStatusEnum,
  periodStatusEnum,
  recognitionMethodEnum,
  recurringFrequencyEnum,
  reportingStandardEnum,
  settlementMethodEnum,
  settlementStatusEnum,
  arInvoiceStatusEnum,
  dunningRunStatusEnum,
  taxRateTypeEnum,
  jurisdictionLevelEnum,
  taxReturnStatusEnum,
  whtCertificateStatusEnum,
  assetStatusEnum,
  depreciationMethodEnum,
  assetMovementTypeEnum,
} from "./_enums";
import { moneyBigint, pkId, tenantCol, timestamps } from "./_common";

// ─── erp.currency ───────────────────────────────────────────────────────────

export const currencies = erpSchema.table(
  "currency",
  {
    ...pkId(),
    ...tenantCol(),
    code: varchar("code", { length: 3 }).notNull(),
    name: text("name").notNull(),
    symbol: varchar("symbol", { length: 5 }).notNull(),
    decimalPlaces: smallint("decimal_places").notNull().default(2),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex("uq_currency_code_tenant").on(t.tenantId, t.code),
    check("chk_currency_decimal_places", sql`${t.decimalPlaces} >= 0 AND ${t.decimalPlaces} <= 4`),
  ],
);

// ─── erp.fiscal_year ────────────────────────────────────────────────────────

export const fiscalYears = erpSchema.table(
  "fiscal_year",
  {
    ...pkId(),
    ...tenantCol(),
    name: varchar("name", { length: 50 }).notNull(),
    startDate: timestamp("start_date", { withTimezone: true }).notNull(),
    endDate: timestamp("end_date", { withTimezone: true }).notNull(),
    isClosed: boolean("is_closed").notNull().default(false),
    ...timestamps(),
  },
  (t) => [uniqueIndex("uq_fiscal_year_name_tenant").on(t.tenantId, t.name)],
);

// ─── erp.fiscal_period ──────────────────────────────────────────────────────

export const fiscalPeriods = erpSchema.table(
  "fiscal_period",
  {
    ...pkId(),
    ...tenantCol(),
    fiscalYearId: uuid("fiscal_year_id").notNull(),
    name: varchar("name", { length: 50 }).notNull(),
    periodNumber: smallint("period_number").notNull(),
    startDate: timestamp("start_date", { withTimezone: true }).notNull(),
    endDate: timestamp("end_date", { withTimezone: true }).notNull(),
    status: periodStatusEnum("status").notNull().default("OPEN"),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex("uq_fiscal_period_year_num_tenant").on(t.tenantId, t.fiscalYearId, t.periodNumber),
  ],
);

// ─── erp.account ────────────────────────────────────────────────────────────

export const accounts = erpSchema.table(
  "account",
  {
    ...pkId(),
    ...tenantCol(),
    code: varchar("code", { length: 20 }).notNull(),
    name: text("name").notNull(),
    accountType: accountTypeEnum("account_type").notNull(),
    parentId: uuid("parent_id"),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex("uq_account_code_tenant").on(t.tenantId, t.code),
    index("idx_account_type_tenant").on(t.tenantId, t.accountType),
  ],
);

// ─── erp.ledger ─────────────────────────────────────────────────────────────

export const ledgers = erpSchema.table(
  "ledger",
  {
    ...pkId(),
    ...tenantCol(),
    companyId: uuid("company_id").notNull(),
    name: text("name").notNull(),
    currencyId: uuid("currency_id").notNull(),
    isDefault: boolean("is_default").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex("uq_ledger_name_company_tenant").on(t.tenantId, t.companyId, t.name),
  ],
);

// ─── erp.gl_journal ─────────────────────────────────────────────────────────

export const glJournals = erpSchema.table(
  "gl_journal",
  {
    ...pkId(),
    ...tenantCol(),
    ledgerId: uuid("ledger_id").notNull(),
    fiscalPeriodId: uuid("fiscal_period_id").notNull(),
    journalNumber: varchar("journal_number", { length: 30 }).notNull(),
    documentType: documentTypeEnum("document_type").notNull().default("JOURNAL"),
    status: journalStatusEnum("status").notNull().default("DRAFT"),
    description: text("description"),
    postingDate: timestamp("posting_date", { withTimezone: true }).notNull(),
    reversalOfId: uuid("reversal_of_id"),
    reversedById: uuid("reversed_by_id"),
    postedAt: timestamp("posted_at", { withTimezone: true }),
    postedBy: uuid("posted_by"),
    metadata: jsonb("metadata").notNull().default({}),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex("uq_journal_number_ledger_tenant").on(t.tenantId, t.ledgerId, t.journalNumber),
    index("idx_journal_status_tenant").on(t.tenantId, t.status),
    index("idx_journal_posting_date_tenant").on(t.tenantId, t.postingDate),
    index("idx_journal_period_tenant").on(t.tenantId, t.fiscalPeriodId),
  ],
);

// ─── erp.gl_journal_line ────────────────────────────────────────────────────

export const glJournalLines = erpSchema.table(
  "gl_journal_line",
  {
    ...pkId(),
    ...tenantCol(),
    journalId: uuid("journal_id").notNull(),
    lineNumber: smallint("line_number").notNull(),
    accountId: uuid("account_id").notNull(),
    description: text("description"),
    debit: moneyBigint("debit").notNull().default(sql`0`),
    credit: moneyBigint("credit").notNull().default(sql`0`),
    currencyCode: varchar("currency_code", { length: 3 }),
    baseCurrencyDebit: moneyBigint("base_currency_debit").notNull().default(sql`0`),
    baseCurrencyCredit: moneyBigint("base_currency_credit").notNull().default(sql`0`),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex("uq_journal_line_num_tenant").on(t.tenantId, t.journalId, t.lineNumber),
    index("idx_journal_line_account_tenant").on(t.tenantId, t.accountId),
    check("chk_journal_line_debit_credit", sql`(${t.debit} = 0) <> (${t.credit} = 0)`),
  ],
);

// ─── erp.gl_balance (composite PK — no surrogate) ──────────────────────────

export const glBalances = erpSchema.table(
  "gl_balance",
  {
    tenantId: uuid("tenant_id").notNull(),
    ledgerId: uuid("ledger_id").notNull(),
    accountId: uuid("account_id").notNull(),
    fiscalYear: varchar("fiscal_year", { length: 10 }).notNull(),
    fiscalPeriod: smallint("fiscal_period").notNull(),
    debitBalance: moneyBigint("debit_balance").notNull().default(sql`0`),
    creditBalance: moneyBigint("credit_balance").notNull().default(sql`0`),
    ...timestamps(),
  },
  (t) => [
    primaryKey({
      columns: [t.tenantId, t.ledgerId, t.accountId, t.fiscalYear, t.fiscalPeriod],
    }),
    index("idx_gl_balance_account_tenant").on(t.tenantId, t.accountId),
  ],
);

// ─── erp.fx_rate ───────────────────────────────────────────────────────────

export const fxRates = erpSchema.table(
  "fx_rate",
  {
    ...pkId(),
    ...tenantCol(),
    fromCurrencyId: uuid("from_currency_id").notNull(),
    toCurrencyId: uuid("to_currency_id").notNull(),
    rate: text("rate").notNull(),
    effectiveDate: timestamp("effective_date", { withTimezone: true }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    source: varchar("source", { length: 50 }).notNull().default("MANUAL"),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex("uq_fx_rate_pair_date_tenant").on(
      t.tenantId,
      t.fromCurrencyId,
      t.toCurrencyId,
      t.effectiveDate,
    ),
    index("idx_fx_rate_effective_tenant").on(t.tenantId, t.effectiveDate),
  ],
);

// ─── erp.counterparty ───────────────────────────────────────────────────────

export const counterparties = erpSchema.table(
  "counterparty",
  {
    ...pkId(),
    ...tenantCol(),
    code: varchar("code", { length: 20 }).notNull(),
    name: text("name").notNull(),
    counterpartyType: counterpartyTypeEnum("counterparty_type").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps(),
  },
  (t) => [uniqueIndex("uq_counterparty_code_tenant").on(t.tenantId, t.code)],
);

// ─── erp.ic_agreement ───────────────────────────────────────────────────────

export const icAgreements = erpSchema.table(
  "ic_agreement",
  {
    ...pkId(),
    ...tenantCol(),
    sellerCompanyId: uuid("seller_company_id").notNull(),
    buyerCompanyId: uuid("buyer_company_id").notNull(),
    pricing: icPricingEnum("pricing").notNull().default("COST"),
    markupPercent: smallint("markup_percent"),
    currencyId: uuid("currency_id").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex("uq_ic_agreement_pair_tenant").on(t.tenantId, t.sellerCompanyId, t.buyerCompanyId),
  ],
);

// ─── erp.ic_transaction ─────────────────────────────────────────────────────

export const icTransactions = erpSchema.table(
  "ic_transaction",
  {
    ...pkId(),
    ...tenantCol(),
    agreementId: uuid("agreement_id").notNull(),
    transactionDate: timestamp("transaction_date", { withTimezone: true }).notNull(),
    amount: moneyBigint("amount").notNull(),
    currencyId: uuid("currency_id").notNull(),
    settlementStatus: icSettlementStatusEnum("settlement_status").notNull().default("PENDING"),
    description: text("description"),
    ...timestamps(),
  },
  (t) => [
    index("idx_ic_tx_agreement_tenant").on(t.tenantId, t.agreementId),
    index("idx_ic_tx_status_tenant").on(t.tenantId, t.settlementStatus),
  ],
);

// ─── erp.ic_transaction_leg ─────────────────────────────────────────────────

export const icTransactionLegs = erpSchema.table(
  "ic_transaction_leg",
  {
    ...pkId(),
    ...tenantCol(),
    transactionId: uuid("transaction_id").notNull(),
    companyId: uuid("company_id").notNull(),
    side: icLegSideEnum("side").notNull(),
    journalId: uuid("journal_id"),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex("uq_ic_leg_tx_side_tenant").on(t.tenantId, t.transactionId, t.side),
  ],
);

// ─── erp.recurring_template ────────────────────────────────────────────────

export const recurringTemplates = erpSchema.table(
  "recurring_template",
  {
    ...pkId(),
    ...tenantCol(),
    companyId: uuid("company_id").notNull(),
    ledgerId: uuid("ledger_id").notNull(),
    description: text("description").notNull(),
    lineTemplate: jsonb("line_template").notNull(),
    frequency: recurringFrequencyEnum("frequency").notNull(),
    nextRunDate: timestamp("next_run_date", { withTimezone: true }).notNull(),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps(),
  },
  (t) => [
    index("idx_recurring_template_tenant_active").on(t.tenantId, t.isActive),
    index("idx_recurring_template_next_run").on(t.tenantId, t.nextRunDate).where(sql`is_active = true`),
  ],
);

// ─── erp.budget_entry ──────────────────────────────────────────────────────

export const budgetEntries = erpSchema.table(
  "budget_entry",
  {
    ...pkId(),
    ...tenantCol(),
    companyId: uuid("company_id").notNull(),
    ledgerId: uuid("ledger_id").notNull(),
    accountId: uuid("account_id").notNull(),
    periodId: uuid("period_id").notNull(),
    budgetAmount: moneyBigint("budget_amount").notNull(),
    version: integer("version").notNull().default(1),
    versionNote: text("version_note"),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex("uq_budget_entry_tenant_ledger_account_period").on(
      t.tenantId, t.ledgerId, t.accountId, t.periodId,
    ),
  ],
);

// ─── erp.ic_settlement (A-22) ────────────────────────────────────────────────

export const icSettlements = erpSchema.table(
  "ic_settlement",
  {
    ...pkId(),
    ...tenantCol(),
    settlementNumber: varchar("settlement_number", { length: 30 }).notNull(),
    agreementId: uuid("agreement_id").notNull(),
    method: settlementMethodEnum("method").notNull(),
    status: settlementStatusEnum("status").notNull().default("DRAFT"),
    settlementDate: timestamp("settlement_date", { withTimezone: true }).notNull(),
    totalAmount: moneyBigint("total_amount").notNull(),
    currencyId: uuid("currency_id").notNull(),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    confirmedBy: uuid("confirmed_by"),
    metadata: jsonb("metadata").notNull().default({}),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex("uq_ic_settlement_number_tenant").on(t.tenantId, t.settlementNumber),
    index("idx_ic_settlement_agreement_tenant").on(t.tenantId, t.agreementId),
    index("idx_ic_settlement_status_tenant").on(t.tenantId, t.status),
  ],
);

// ─── erp.ic_settlement_line (links settlement to IC transactions) ───────────

export const icSettlementLines = erpSchema.table(
  "ic_settlement_line",
  {
    ...pkId(),
    ...tenantCol(),
    settlementId: uuid("settlement_id").notNull(),
    transactionId: uuid("transaction_id").notNull(),
    amount: moneyBigint("amount").notNull(),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex("uq_ic_settlement_line_tx_tenant").on(t.tenantId, t.settlementId, t.transactionId),
    index("idx_ic_settlement_line_settlement").on(t.tenantId, t.settlementId),
  ],
);

// ─── erp.revenue_contract (A-24) ────────────────────────────────────────────

export const revenueContracts = erpSchema.table(
  "revenue_contract",
  {
    ...pkId(),
    ...tenantCol(),
    companyId: uuid("company_id").notNull(),
    contractNumber: varchar("contract_number", { length: 50 }).notNull(),
    customerName: text("customer_name").notNull(),
    totalAmount: moneyBigint("total_amount").notNull(),
    currencyId: uuid("currency_id").notNull(),
    recognitionMethod: recognitionMethodEnum("recognition_method").notNull(),
    startDate: timestamp("start_date", { withTimezone: true }).notNull(),
    endDate: timestamp("end_date", { withTimezone: true }).notNull(),
    deferredAccountId: uuid("deferred_account_id").notNull(),
    revenueAccountId: uuid("revenue_account_id").notNull(),
    status: contractStatusEnum("status").notNull().default("ACTIVE"),
    recognizedToDate: moneyBigint("recognized_to_date").notNull().default(sql`0`),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex("uq_revenue_contract_number_tenant").on(t.tenantId, t.contractNumber),
    index("idx_revenue_contract_company_tenant").on(t.tenantId, t.companyId),
    index("idx_revenue_contract_status_tenant").on(t.tenantId, t.status),
  ],
);

// ─── erp.recognition_milestone ──────────────────────────────────────────────

export const recognitionMilestones = erpSchema.table(
  "recognition_milestone",
  {
    ...pkId(),
    ...tenantCol(),
    contractId: uuid("contract_id").notNull(),
    description: text("description").notNull(),
    amount: moneyBigint("amount").notNull(),
    targetDate: timestamp("target_date", { withTimezone: true }).notNull(),
    completedDate: timestamp("completed_date", { withTimezone: true }),
    isCompleted: boolean("is_completed").notNull().default(false),
    ...timestamps(),
  },
  (t) => [
    index("idx_recognition_milestone_contract_tenant").on(t.tenantId, t.contractId),
  ],
);

// ─── erp.classification_rule_set (A-18) ─────────────────────────────────────

export const classificationRuleSets = erpSchema.table(
  "classification_rule_set",
  {
    ...pkId(),
    ...tenantCol(),
    standard: reportingStandardEnum("standard").notNull(),
    version: integer("version").notNull().default(1),
    name: varchar("name", { length: 100 }).notNull(),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex("uq_classification_rule_set_tenant_standard_version").on(
      t.tenantId, t.standard, t.version,
    ),
  ],
);

// ─── erp.classification_rule ────────────────────────────────────────────────

export const classificationRules = erpSchema.table(
  "classification_rule",
  {
    ...pkId(),
    ...tenantCol(),
    ruleSetId: uuid("rule_set_id").notNull(),
    accountType: accountTypeEnum("account_type").notNull(),
    pattern: varchar("pattern", { length: 100 }).notNull(),
    category: varchar("category", { length: 100 }).notNull(),
    priority: smallint("priority").notNull().default(0),
    ...timestamps(),
  },
  (t) => [
    index("idx_classification_rule_set_tenant").on(t.tenantId, t.ruleSetId),
    index("idx_classification_rule_type_tenant").on(t.tenantId, t.accountType),
  ],
);

// ─── erp.payment_terms_template ──────────────────────────────────────────────

export const paymentTermsTemplates = erpSchema.table(
  "payment_terms_template",
  {
    ...pkId(),
    ...tenantCol(),
    code: varchar("code", { length: 20 }).notNull(),
    name: text("name").notNull(),
    netDays: smallint("net_days").notNull(),
    discountPercent: smallint("discount_percent").notNull().default(0),
    discountDays: smallint("discount_days").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex("uq_payment_terms_code_tenant").on(t.tenantId, t.code),
  ],
);

// ─── erp.ap_invoice ──────────────────────────────────────────────────────────

export const apInvoices = erpSchema.table(
  "ap_invoice",
  {
    ...pkId(),
    ...tenantCol(),
    companyId: uuid("company_id").notNull(),
    supplierId: uuid("supplier_id").notNull(),
    ledgerId: uuid("ledger_id").notNull(),
    invoiceNumber: varchar("invoice_number", { length: 50 }).notNull(),
    supplierRef: varchar("supplier_ref", { length: 100 }),
    invoiceDate: timestamp("invoice_date", { withTimezone: true }).notNull(),
    dueDate: timestamp("due_date", { withTimezone: true }).notNull(),
    currencyId: uuid("currency_id").notNull(),
    totalAmount: moneyBigint("total_amount").notNull(),
    paidAmount: moneyBigint("paid_amount").notNull().default(sql`0`),
    status: apInvoiceStatusEnum("status").notNull().default("DRAFT"),
    description: text("description"),
    poRef: varchar("po_ref", { length: 50 }),
    receiptRef: varchar("receipt_ref", { length: 50 }),
    paymentTermsId: uuid("payment_terms_id"),
    journalId: uuid("journal_id"),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex("uq_ap_invoice_number_tenant").on(t.tenantId, t.companyId, t.invoiceNumber),
    index("idx_ap_invoice_supplier_tenant").on(t.tenantId, t.supplierId),
    index("idx_ap_invoice_status_tenant").on(t.tenantId, t.status),
    index("idx_ap_invoice_due_date_tenant").on(t.tenantId, t.dueDate),
  ],
);

// ─── erp.ap_invoice_line ─────────────────────────────────────────────────────

export const apInvoiceLines = erpSchema.table(
  "ap_invoice_line",
  {
    ...pkId(),
    ...tenantCol(),
    invoiceId: uuid("invoice_id").notNull(),
    lineNumber: smallint("line_number").notNull(),
    accountId: uuid("account_id").notNull(),
    description: text("description"),
    quantity: integer("quantity").notNull().default(1),
    unitPrice: moneyBigint("unit_price").notNull(),
    amount: moneyBigint("amount").notNull(),
    taxAmount: moneyBigint("tax_amount").notNull().default(sql`0`),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex("uq_ap_invoice_line_num_tenant").on(t.tenantId, t.invoiceId, t.lineNumber),
    index("idx_ap_invoice_line_account_tenant").on(t.tenantId, t.accountId),
  ],
);

// ─── erp.ap_payment_run ──────────────────────────────────────────────────────

export const apPaymentRuns = erpSchema.table(
  "ap_payment_run",
  {
    ...pkId(),
    ...tenantCol(),
    companyId: uuid("company_id").notNull(),
    runNumber: varchar("run_number", { length: 30 }).notNull(),
    runDate: timestamp("run_date", { withTimezone: true }).notNull(),
    cutoffDate: timestamp("cutoff_date", { withTimezone: true }).notNull(),
    currencyId: uuid("currency_id").notNull(),
    totalAmount: moneyBigint("total_amount").notNull().default(sql`0`),
    status: paymentRunStatusEnum("status").notNull().default("DRAFT"),
    executedAt: timestamp("executed_at", { withTimezone: true }),
    executedBy: uuid("executed_by"),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex("uq_ap_payment_run_number_tenant").on(t.tenantId, t.companyId, t.runNumber),
    index("idx_ap_payment_run_status_tenant").on(t.tenantId, t.status),
  ],
);

// ─── erp.ap_payment_run_item ─────────────────────────────────────────────────

export const apPaymentRunItems = erpSchema.table(
  "ap_payment_run_item",
  {
    ...pkId(),
    ...tenantCol(),
    paymentRunId: uuid("payment_run_id").notNull(),
    invoiceId: uuid("invoice_id").notNull(),
    supplierId: uuid("supplier_id").notNull(),
    amount: moneyBigint("amount").notNull(),
    discountAmount: moneyBigint("discount_amount").notNull().default(sql`0`),
    netAmount: moneyBigint("net_amount").notNull(),
    journalId: uuid("journal_id"),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex("uq_ap_payment_run_item_invoice_tenant").on(t.tenantId, t.paymentRunId, t.invoiceId),
    index("idx_ap_payment_run_item_run_tenant").on(t.tenantId, t.paymentRunId),
  ],
);

// ─── AR Sub-Ledger ─────────────────────────────────────────────────────────

export const arInvoices = erpSchema.table(
  "ar_invoice",
  {
    ...pkId(),
    ...tenantCol(),
    companyId: uuid("company_id").notNull(),
    customerId: uuid("customer_id").notNull(),
    ledgerId: uuid("ledger_id").notNull(),
    invoiceNumber: varchar("invoice_number", { length: 50 }).notNull(),
    customerRef: varchar("customer_ref", { length: 100 }),
    invoiceDate: timestamp("invoice_date", { withTimezone: true }).notNull(),
    dueDate: timestamp("due_date", { withTimezone: true }).notNull(),
    totalAmount: moneyBigint("total_amount").notNull().default(sql`0`),
    paidAmount: moneyBigint("paid_amount").notNull().default(sql`0`),
    status: arInvoiceStatusEnum("status").notNull().default("DRAFT"),
    currencyCode: varchar("currency_code", { length: 3 }).notNull().default("USD"),
    description: text("description"),
    paymentTermsId: uuid("payment_terms_id"),
    journalId: uuid("journal_id"),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex("uq_ar_invoice_number_tenant").on(t.tenantId, t.invoiceNumber),
    index("idx_ar_invoice_customer_tenant").on(t.tenantId, t.customerId),
    index("idx_ar_invoice_status_tenant").on(t.tenantId, t.status),
    index("idx_ar_invoice_due_date_tenant").on(t.tenantId, t.dueDate),
  ],
);

export const arInvoiceLines = erpSchema.table(
  "ar_invoice_line",
  {
    ...pkId(),
    ...tenantCol(),
    invoiceId: uuid("invoice_id").notNull(),
    lineNumber: smallint("line_number").notNull(),
    accountId: uuid("account_id").notNull(),
    description: text("description"),
    quantity: integer("quantity").notNull().default(1),
    unitPrice: moneyBigint("unit_price").notNull(),
    amount: moneyBigint("amount").notNull(),
    taxAmount: moneyBigint("tax_amount").notNull().default(sql`0`),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex("uq_ar_invoice_line_tenant").on(t.tenantId, t.invoiceId, t.lineNumber),
    index("idx_ar_invoice_line_invoice_tenant").on(t.tenantId, t.invoiceId),
  ],
);

export const arPaymentAllocations = erpSchema.table(
  "ar_payment_allocation",
  {
    ...pkId(),
    ...tenantCol(),
    customerId: uuid("customer_id").notNull(),
    paymentDate: timestamp("payment_date", { withTimezone: true }).notNull(),
    paymentRef: varchar("payment_ref", { length: 100 }).notNull(),
    totalAmount: moneyBigint("total_amount").notNull(),
    currencyCode: varchar("currency_code", { length: 3 }).notNull().default("USD"),
    ...timestamps(),
  },
  (t) => [
    index("idx_ar_payment_allocation_customer_tenant").on(t.tenantId, t.customerId),
  ],
);

export const arAllocationItems = erpSchema.table(
  "ar_allocation_item",
  {
    ...pkId(),
    ...tenantCol(),
    paymentAllocationId: uuid("payment_allocation_id").notNull(),
    invoiceId: uuid("invoice_id").notNull(),
    allocatedAmount: moneyBigint("allocated_amount").notNull(),
    journalId: uuid("journal_id"),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex("uq_ar_allocation_item_tenant").on(t.tenantId, t.paymentAllocationId, t.invoiceId),
    index("idx_ar_allocation_item_alloc_tenant").on(t.tenantId, t.paymentAllocationId),
  ],
);

export const dunningRuns = erpSchema.table(
  "dunning_run",
  {
    ...pkId(),
    ...tenantCol(),
    runDate: timestamp("run_date", { withTimezone: true }).notNull(),
    status: dunningRunStatusEnum("status").notNull().default("DRAFT"),
    ...timestamps(),
  },
  (t) => [
    index("idx_dunning_run_status_tenant").on(t.tenantId, t.status),
  ],
);

export const dunningLetters = erpSchema.table(
  "dunning_letter",
  {
    ...pkId(),
    ...tenantCol(),
    dunningRunId: uuid("dunning_run_id").notNull(),
    customerId: uuid("customer_id").notNull(),
    level: smallint("level").notNull(),
    invoiceIds: jsonb("invoice_ids").notNull().default(sql`'[]'::jsonb`),
    totalOverdue: moneyBigint("total_overdue").notNull(),
    currencyCode: varchar("currency_code", { length: 3 }).notNull().default("USD"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    ...timestamps(),
  },
  (t) => [
    index("idx_dunning_letter_run_tenant").on(t.tenantId, t.dunningRunId),
    index("idx_dunning_letter_customer_tenant").on(t.tenantId, t.customerId),
  ],
);

// ─── erp.tax_code ──────────────────────────────────────────────────────────

export const taxCodes = erpSchema.table(
  "tax_code",
  {
    ...pkId(),
    ...tenantCol(),
    code: varchar("code", { length: 20 }).notNull(),
    name: text("name").notNull(),
    description: text("description"),
    jurisdictionLevel: jurisdictionLevelEnum("jurisdiction_level").notNull(),
    countryCode: varchar("country_code", { length: 2 }).notNull(),
    stateCode: varchar("state_code", { length: 10 }),
    cityCode: varchar("city_code", { length: 20 }),
    parentId: uuid("parent_id"),
    isCompound: boolean("is_compound").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex("idx_tax_code_tenant_code").on(t.tenantId, t.code),
    index("idx_tax_code_country_tenant").on(t.tenantId, t.countryCode),
  ],
);

// ─── erp.tax_rate ──────────────────────────────────────────────────────────

export const taxRates = erpSchema.table(
  "tax_rate",
  {
    ...pkId(),
    ...tenantCol(),
    taxCodeId: uuid("tax_code_id").notNull(),
    name: text("name").notNull(),
    ratePercent: smallint("rate_percent").notNull(),
    type: taxRateTypeEnum("type").notNull(),
    jurisdictionCode: varchar("jurisdiction_code", { length: 20 }).notNull(),
    effectiveFrom: timestamp("effective_from", { withTimezone: true }).notNull(),
    effectiveTo: timestamp("effective_to", { withTimezone: true }),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps(),
  },
  (t) => [
    index("idx_tax_rate_code_tenant").on(t.tenantId, t.taxCodeId),
    index("idx_tax_rate_jurisdiction_tenant").on(t.tenantId, t.jurisdictionCode),
  ],
);

// ─── erp.tax_return_period ─────────────────────────────────────────────────

export const taxReturnPeriods = erpSchema.table(
  "tax_return_period",
  {
    ...pkId(),
    ...tenantCol(),
    taxType: varchar("tax_type", { length: 20 }).notNull(),
    jurisdictionCode: varchar("jurisdiction_code", { length: 20 }).notNull(),
    periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
    periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
    outputTax: moneyBigint("output_tax").notNull().default(sql`0`),
    inputTax: moneyBigint("input_tax").notNull().default(sql`0`),
    netPayable: moneyBigint("net_payable").notNull().default(sql`0`),
    currencyCode: varchar("currency_code", { length: 3 }).notNull().default("USD"),
    status: taxReturnStatusEnum("status").notNull().default("DRAFT"),
    filedAt: timestamp("filed_at", { withTimezone: true }),
    filedBy: uuid("filed_by"),
    ...timestamps(),
  },
  (t) => [
    index("idx_tax_return_jurisdiction_tenant").on(t.tenantId, t.jurisdictionCode),
    index("idx_tax_return_status_tenant").on(t.tenantId, t.status),
  ],
);

// ─── erp.wht_certificate ──────────────────────────────────────────────────

export const whtCertificates = erpSchema.table(
  "wht_certificate",
  {
    ...pkId(),
    ...tenantCol(),
    payeeId: uuid("payee_id").notNull(),
    payeeName: text("payee_name").notNull(),
    payeeType: varchar("payee_type", { length: 20 }).notNull(),
    countryCode: varchar("country_code", { length: 2 }).notNull(),
    incomeType: varchar("income_type", { length: 50 }).notNull(),
    grossAmount: moneyBigint("gross_amount").notNull(),
    whtAmount: moneyBigint("wht_amount").notNull(),
    netAmount: moneyBigint("net_amount").notNull(),
    currencyCode: varchar("currency_code", { length: 3 }).notNull().default("USD"),
    rateApplied: smallint("rate_applied").notNull(),
    treatyRate: smallint("treaty_rate"),
    certificateNumber: varchar("certificate_number", { length: 50 }).notNull(),
    issueDate: timestamp("issue_date", { withTimezone: true }).notNull(),
    taxPeriodStart: timestamp("tax_period_start", { withTimezone: true }).notNull(),
    taxPeriodEnd: timestamp("tax_period_end", { withTimezone: true }).notNull(),
    relatedInvoiceId: uuid("related_invoice_id"),
    relatedPaymentId: uuid("related_payment_id"),
    status: whtCertificateStatusEnum("status").notNull().default("DRAFT"),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex("idx_wht_cert_number_tenant").on(t.tenantId, t.certificateNumber),
    index("idx_wht_cert_payee_tenant").on(t.tenantId, t.payeeId),
    index("idx_wht_cert_status_tenant").on(t.tenantId, t.status),
  ],
);

// ─── erp.asset ─────────────────────────────────────────────────────────────

export const assets = erpSchema.table(
  "asset",
  {
    ...pkId(),
    ...tenantCol(),
    companyId: uuid("company_id").notNull(),
    assetNumber: varchar("asset_number", { length: 50 }).notNull(),
    name: text("name").notNull(),
    description: text("description"),
    categoryCode: varchar("category_code", { length: 20 }).notNull(),
    acquisitionDate: timestamp("acquisition_date", { withTimezone: true }).notNull(),
    acquisitionCost: moneyBigint("acquisition_cost").notNull(),
    residualValue: moneyBigint("residual_value").notNull(),
    usefulLifeMonths: smallint("useful_life_months").notNull(),
    depreciationMethod: depreciationMethodEnum("depreciation_method").notNull(),
    accumulatedDepreciation: moneyBigint("accumulated_depreciation").notNull().default(sql`0`),
    netBookValue: moneyBigint("net_book_value").notNull(),
    currencyCode: varchar("currency_code", { length: 3 }).notNull().default("USD"),
    locationCode: varchar("location_code", { length: 20 }),
    costCenterId: uuid("cost_center_id"),
    glAccountId: uuid("gl_account_id").notNull(),
    depreciationAccountId: uuid("depreciation_account_id").notNull(),
    accumulatedDepreciationAccountId: uuid("accumulated_depreciation_account_id").notNull(),
    status: assetStatusEnum("status").notNull().default("ACTIVE"),
    disposedAt: timestamp("disposed_at", { withTimezone: true }),
    disposalProceeds: moneyBigint("disposal_proceeds"),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex("idx_asset_number_tenant").on(t.tenantId, t.assetNumber),
    index("idx_asset_company_tenant").on(t.tenantId, t.companyId),
    index("idx_asset_status_tenant").on(t.tenantId, t.status),
  ],
);

// ─── erp.depreciation_schedule ─────────────────────────────────────────────

export const depreciationSchedules = erpSchema.table(
  "depreciation_schedule",
  {
    ...pkId(),
    ...tenantCol(),
    assetId: uuid("asset_id").notNull(),
    componentId: uuid("component_id"),
    periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
    periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
    depreciationAmount: moneyBigint("depreciation_amount").notNull(),
    accumulatedDepreciation: moneyBigint("accumulated_depreciation").notNull(),
    netBookValue: moneyBigint("net_book_value").notNull(),
    currencyCode: varchar("currency_code", { length: 3 }).notNull().default("USD"),
    journalId: uuid("journal_id"),
    isPosted: boolean("is_posted").notNull().default(false),
    ...timestamps(),
  },
  (t) => [
    index("idx_depr_schedule_asset_tenant").on(t.tenantId, t.assetId),
    index("idx_depr_schedule_posted_tenant").on(t.tenantId, t.isPosted),
  ],
);

// ─── erp.asset_movement ────────────────────────────────────────────────────

export const assetMovements = erpSchema.table(
  "asset_movement",
  {
    ...pkId(),
    ...tenantCol(),
    assetId: uuid("asset_id").notNull(),
    movementType: assetMovementTypeEnum("movement_type").notNull(),
    movementDate: timestamp("movement_date", { withTimezone: true }).notNull(),
    amount: moneyBigint("amount").notNull(),
    currencyCode: varchar("currency_code", { length: 3 }).notNull().default("USD"),
    description: text("description"),
    fromCompanyId: uuid("from_company_id"),
    toCompanyId: uuid("to_company_id"),
    journalId: uuid("journal_id"),
    createdBy: uuid("created_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("idx_asset_movement_asset_tenant").on(t.tenantId, t.assetId),
    index("idx_asset_movement_type_tenant").on(t.tenantId, t.movementType),
  ],
);
