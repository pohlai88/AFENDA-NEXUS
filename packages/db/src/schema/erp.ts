import { sql } from 'drizzle-orm';
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
} from 'drizzle-orm/pg-core';
import { erpSchema } from './_schemas';
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
  statementFormatEnum,
  bankLineMatchStatusEnum,
  bankMatchTypeEnum,
  bankMatchConfidenceEnum,
  reconciliationStatusEnum,
  creditStatusEnum,
  reviewOutcomeEnum,
  expenseClaimStatusEnum,
  expenseCategoryEnum,
  projectStatusEnum,
  billingTypeEnum,
  costCategoryEnum,
  billingStatusEnum,
  leaseTypeEnum,
  leaseStatusEnum,
  lesseeOrLessorEnum,
  leaseModificationTypeEnum,
  provisionTypeEnum,
  provisionStatusEnum,
  provisionMovementTypeEnum,
  forecastTypeEnum,
  covenantTypeEnum,
  covenantStatusEnum,
  icLoanStatusEnum,
  costCenterStatusEnum,
  driverTypeEnum,
  allocationMethodEnum,
  allocationRunStatusEnum,
  groupEntityTypeEnum,
  goodwillStatusEnum,
  intangibleAssetStatusEnum,
  intangibleCategoryEnum,
  usefulLifeTypeEnum,
  instrumentClassificationEnum,
  instrumentTypeEnum,
  fairValueLevelEnum,
  hedgeTypeEnum,
  hedgeStatusEnum,
  accountingEventStatusEnum,
  mappingRuleStatusEnum,
  hedgeTestMethodEnum,
  hedgeTestResultEnum,
  tpMethodEnum,
} from './_enums';
import { moneyBigint, pkId, tenantCol, timestamps } from './_common';

// ─── erp.currency ───────────────────────────────────────────────────────────

export const currencies = erpSchema.table(
  'currency',
  {
    ...pkId(),
    ...tenantCol(),
    code: varchar('code', { length: 3 }).notNull(),
    name: text('name').notNull(),
    symbol: varchar('symbol', { length: 5 }).notNull(),
    decimalPlaces: smallint('decimal_places').notNull().default(2),
    isActive: boolean('is_active').notNull().default(true),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('uq_currency_code_tenant').on(t.tenantId, t.code),
    check('chk_currency_decimal_places', sql`${t.decimalPlaces} >= 0 AND ${t.decimalPlaces} <= 4`),
  ]
);

// ─── erp.fiscal_year ────────────────────────────────────────────────────────

export const fiscalYears = erpSchema.table(
  'fiscal_year',
  {
    ...pkId(),
    ...tenantCol(),
    name: varchar('name', { length: 50 }).notNull(),
    startDate: timestamp('start_date', { withTimezone: true }).notNull(),
    endDate: timestamp('end_date', { withTimezone: true }).notNull(),
    isClosed: boolean('is_closed').notNull().default(false),
    ...timestamps(),
  },
  (t) => [uniqueIndex('uq_fiscal_year_name_tenant').on(t.tenantId, t.name)]
);

// ─── erp.fiscal_period ──────────────────────────────────────────────────────

export const fiscalPeriods = erpSchema.table(
  'fiscal_period',
  {
    ...pkId(),
    ...tenantCol(),
    fiscalYearId: uuid('fiscal_year_id').notNull(),
    name: varchar('name', { length: 50 }).notNull(),
    periodNumber: smallint('period_number').notNull(),
    startDate: timestamp('start_date', { withTimezone: true }).notNull(),
    endDate: timestamp('end_date', { withTimezone: true }).notNull(),
    status: periodStatusEnum('status').notNull().default('OPEN'),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('uq_fiscal_period_year_num_tenant').on(t.tenantId, t.fiscalYearId, t.periodNumber),
  ]
);

// ─── erp.account ────────────────────────────────────────────────────────────

export const accounts = erpSchema.table(
  'account',
  {
    ...pkId(),
    ...tenantCol(),
    code: varchar('code', { length: 20 }).notNull(),
    name: text('name').notNull(),
    accountType: accountTypeEnum('account_type').notNull(),
    parentId: uuid('parent_id'),
    isActive: boolean('is_active').notNull().default(true),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('uq_account_code_tenant').on(t.tenantId, t.code),
    index('idx_account_type_tenant').on(t.tenantId, t.accountType),
  ]
);

// ─── erp.ledger ─────────────────────────────────────────────────────────────

export const ledgers = erpSchema.table(
  'ledger',
  {
    ...pkId(),
    ...tenantCol(),
    companyId: uuid('company_id').notNull(),
    name: text('name').notNull(),
    currencyId: uuid('currency_id').notNull(),
    isDefault: boolean('is_default').notNull().default(false),
    isActive: boolean('is_active').notNull().default(true),
    ...timestamps(),
  },
  (t) => [uniqueIndex('uq_ledger_name_company_tenant').on(t.tenantId, t.companyId, t.name)]
);

// ─── erp.gl_journal ─────────────────────────────────────────────────────────

export const glJournals = erpSchema.table(
  'gl_journal',
  {
    ...pkId(),
    ...tenantCol(),
    ledgerId: uuid('ledger_id').notNull(),
    fiscalPeriodId: uuid('fiscal_period_id').notNull(),
    journalNumber: varchar('journal_number', { length: 30 }).notNull(),
    documentType: documentTypeEnum('document_type').notNull().default('JOURNAL'),
    status: journalStatusEnum('status').notNull().default('DRAFT'),
    description: text('description'),
    postingDate: timestamp('posting_date', { withTimezone: true }).notNull(),
    reversalOfId: uuid('reversal_of_id'),
    reversedById: uuid('reversed_by_id'),
    postedAt: timestamp('posted_at', { withTimezone: true }),
    postedBy: uuid('posted_by'),
    metadata: jsonb('metadata').notNull().default({}),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('uq_journal_number_ledger_tenant').on(t.tenantId, t.ledgerId, t.journalNumber),
    index('idx_journal_status_tenant').on(t.tenantId, t.status),
    index('idx_journal_posting_date_tenant').on(t.tenantId, t.postingDate),
    index('idx_journal_period_tenant').on(t.tenantId, t.fiscalPeriodId),
  ]
);

// ─── erp.gl_journal_line ────────────────────────────────────────────────────

export const glJournalLines = erpSchema.table(
  'gl_journal_line',
  {
    ...pkId(),
    ...tenantCol(),
    journalId: uuid('journal_id').notNull(),
    lineNumber: smallint('line_number').notNull(),
    accountId: uuid('account_id').notNull(),
    description: text('description'),
    debit: moneyBigint('debit')
      .notNull()
      .default(sql`0`),
    credit: moneyBigint('credit')
      .notNull()
      .default(sql`0`),
    currencyCode: varchar('currency_code', { length: 3 }),
    baseCurrencyDebit: moneyBigint('base_currency_debit')
      .notNull()
      .default(sql`0`),
    baseCurrencyCredit: moneyBigint('base_currency_credit')
      .notNull()
      .default(sql`0`),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('uq_journal_line_num_tenant').on(t.tenantId, t.journalId, t.lineNumber),
    index('idx_journal_line_account_tenant').on(t.tenantId, t.accountId),
    check('chk_journal_line_debit_credit', sql`(${t.debit} = 0) <> (${t.credit} = 0)`),
  ]
);

// ─── erp.gl_balance (composite PK — no surrogate) ──────────────────────────

export const glBalances = erpSchema.table(
  'gl_balance',
  {
    tenantId: uuid('tenant_id').notNull(),
    ledgerId: uuid('ledger_id').notNull(),
    accountId: uuid('account_id').notNull(),
    fiscalYear: varchar('fiscal_year', { length: 10 }).notNull(),
    fiscalPeriod: smallint('fiscal_period').notNull(),
    debitBalance: moneyBigint('debit_balance')
      .notNull()
      .default(sql`0`),
    creditBalance: moneyBigint('credit_balance')
      .notNull()
      .default(sql`0`),
    ...timestamps(),
  },
  (t) => [
    primaryKey({
      columns: [t.tenantId, t.ledgerId, t.accountId, t.fiscalYear, t.fiscalPeriod],
    }),
    index('idx_gl_balance_account_tenant').on(t.tenantId, t.accountId),
  ]
);

// ─── erp.fx_rate ───────────────────────────────────────────────────────────

export const fxRates = erpSchema.table(
  'fx_rate',
  {
    ...pkId(),
    ...tenantCol(),
    fromCurrencyId: uuid('from_currency_id').notNull(),
    toCurrencyId: uuid('to_currency_id').notNull(),
    rate: text('rate').notNull(),
    effectiveDate: timestamp('effective_date', { withTimezone: true }).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    source: varchar('source', { length: 50 }).notNull().default('MANUAL'),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('uq_fx_rate_pair_date_tenant').on(
      t.tenantId,
      t.fromCurrencyId,
      t.toCurrencyId,
      t.effectiveDate
    ),
    index('idx_fx_rate_effective_tenant').on(t.tenantId, t.effectiveDate),
  ]
);

// ─── erp.counterparty ───────────────────────────────────────────────────────

export const counterparties = erpSchema.table(
  'counterparty',
  {
    ...pkId(),
    ...tenantCol(),
    code: varchar('code', { length: 20 }).notNull(),
    name: text('name').notNull(),
    counterpartyType: counterpartyTypeEnum('counterparty_type').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    ...timestamps(),
  },
  (t) => [uniqueIndex('uq_counterparty_code_tenant').on(t.tenantId, t.code)]
);

// ─── erp.ic_agreement ───────────────────────────────────────────────────────

export const icAgreements = erpSchema.table(
  'ic_agreement',
  {
    ...pkId(),
    ...tenantCol(),
    sellerCompanyId: uuid('seller_company_id').notNull(),
    buyerCompanyId: uuid('buyer_company_id').notNull(),
    pricing: icPricingEnum('pricing').notNull().default('COST'),
    markupPercent: smallint('markup_percent'),
    currencyId: uuid('currency_id').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('uq_ic_agreement_pair_tenant').on(t.tenantId, t.sellerCompanyId, t.buyerCompanyId),
  ]
);

// ─── erp.ic_transaction ─────────────────────────────────────────────────────

export const icTransactions = erpSchema.table(
  'ic_transaction',
  {
    ...pkId(),
    ...tenantCol(),
    agreementId: uuid('agreement_id').notNull(),
    transactionDate: timestamp('transaction_date', { withTimezone: true }).notNull(),
    amount: moneyBigint('amount').notNull(),
    currencyId: uuid('currency_id').notNull(),
    settlementStatus: icSettlementStatusEnum('settlement_status').notNull().default('PENDING'),
    description: text('description'),
    ...timestamps(),
  },
  (t) => [
    index('idx_ic_tx_agreement_tenant').on(t.tenantId, t.agreementId),
    index('idx_ic_tx_status_tenant').on(t.tenantId, t.settlementStatus),
  ]
);

// ─── erp.ic_transaction_leg ─────────────────────────────────────────────────

export const icTransactionLegs = erpSchema.table(
  'ic_transaction_leg',
  {
    ...pkId(),
    ...tenantCol(),
    transactionId: uuid('transaction_id').notNull(),
    companyId: uuid('company_id').notNull(),
    side: icLegSideEnum('side').notNull(),
    journalId: uuid('journal_id'),
    ...timestamps(),
  },
  (t) => [uniqueIndex('uq_ic_leg_tx_side_tenant').on(t.tenantId, t.transactionId, t.side)]
);

// ─── erp.recurring_template ────────────────────────────────────────────────

export const recurringTemplates = erpSchema.table(
  'recurring_template',
  {
    ...pkId(),
    ...tenantCol(),
    companyId: uuid('company_id').notNull(),
    ledgerId: uuid('ledger_id').notNull(),
    description: text('description').notNull(),
    lineTemplate: jsonb('line_template').notNull(),
    frequency: recurringFrequencyEnum('frequency').notNull(),
    nextRunDate: timestamp('next_run_date', { withTimezone: true }).notNull(),
    isActive: boolean('is_active').notNull().default(true),
    ...timestamps(),
  },
  (t) => [
    index('idx_recurring_template_tenant_active').on(t.tenantId, t.isActive),
    index('idx_recurring_template_next_run')
      .on(t.tenantId, t.nextRunDate)
      .where(sql`is_active = true`),
  ]
);

// ─── erp.budget_entry ──────────────────────────────────────────────────────

export const budgetEntries = erpSchema.table(
  'budget_entry',
  {
    ...pkId(),
    ...tenantCol(),
    companyId: uuid('company_id').notNull(),
    ledgerId: uuid('ledger_id').notNull(),
    accountId: uuid('account_id').notNull(),
    periodId: uuid('period_id').notNull(),
    budgetAmount: moneyBigint('budget_amount').notNull(),
    version: integer('version').notNull().default(1),
    versionNote: text('version_note'),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('uq_budget_entry_tenant_ledger_account_period').on(
      t.tenantId,
      t.ledgerId,
      t.accountId,
      t.periodId
    ),
  ]
);

// ─── erp.ic_settlement (A-22) ────────────────────────────────────────────────

export const icSettlements = erpSchema.table(
  'ic_settlement',
  {
    ...pkId(),
    ...tenantCol(),
    settlementNumber: varchar('settlement_number', { length: 30 }).notNull(),
    agreementId: uuid('agreement_id').notNull(),
    method: settlementMethodEnum('method').notNull(),
    status: settlementStatusEnum('status').notNull().default('DRAFT'),
    settlementDate: timestamp('settlement_date', { withTimezone: true }).notNull(),
    totalAmount: moneyBigint('total_amount').notNull(),
    currencyId: uuid('currency_id').notNull(),
    confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
    confirmedBy: uuid('confirmed_by'),
    metadata: jsonb('metadata').notNull().default({}),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('uq_ic_settlement_number_tenant').on(t.tenantId, t.settlementNumber),
    index('idx_ic_settlement_agreement_tenant').on(t.tenantId, t.agreementId),
    index('idx_ic_settlement_status_tenant').on(t.tenantId, t.status),
  ]
);

// ─── erp.ic_settlement_line (links settlement to IC transactions) ───────────

export const icSettlementLines = erpSchema.table(
  'ic_settlement_line',
  {
    ...pkId(),
    ...tenantCol(),
    settlementId: uuid('settlement_id').notNull(),
    transactionId: uuid('transaction_id').notNull(),
    amount: moneyBigint('amount').notNull(),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('uq_ic_settlement_line_tx_tenant').on(t.tenantId, t.settlementId, t.transactionId),
    index('idx_ic_settlement_line_settlement').on(t.tenantId, t.settlementId),
  ]
);

// ─── erp.revenue_contract (A-24) ────────────────────────────────────────────

export const revenueContracts = erpSchema.table(
  'revenue_contract',
  {
    ...pkId(),
    ...tenantCol(),
    companyId: uuid('company_id').notNull(),
    contractNumber: varchar('contract_number', { length: 50 }).notNull(),
    customerName: text('customer_name').notNull(),
    totalAmount: moneyBigint('total_amount').notNull(),
    currencyId: uuid('currency_id').notNull(),
    recognitionMethod: recognitionMethodEnum('recognition_method').notNull(),
    startDate: timestamp('start_date', { withTimezone: true }).notNull(),
    endDate: timestamp('end_date', { withTimezone: true }).notNull(),
    deferredAccountId: uuid('deferred_account_id').notNull(),
    revenueAccountId: uuid('revenue_account_id').notNull(),
    status: contractStatusEnum('status').notNull().default('ACTIVE'),
    recognizedToDate: moneyBigint('recognized_to_date')
      .notNull()
      .default(sql`0`),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('uq_revenue_contract_number_tenant').on(t.tenantId, t.contractNumber),
    index('idx_revenue_contract_company_tenant').on(t.tenantId, t.companyId),
    index('idx_revenue_contract_status_tenant').on(t.tenantId, t.status),
  ]
);

// ─── erp.recognition_milestone ──────────────────────────────────────────────

export const recognitionMilestones = erpSchema.table(
  'recognition_milestone',
  {
    ...pkId(),
    ...tenantCol(),
    contractId: uuid('contract_id').notNull(),
    description: text('description').notNull(),
    amount: moneyBigint('amount').notNull(),
    targetDate: timestamp('target_date', { withTimezone: true }).notNull(),
    completedDate: timestamp('completed_date', { withTimezone: true }),
    isCompleted: boolean('is_completed').notNull().default(false),
    ...timestamps(),
  },
  (t) => [index('idx_recognition_milestone_contract_tenant').on(t.tenantId, t.contractId)]
);

// ─── erp.classification_rule_set (A-18) ─────────────────────────────────────

export const classificationRuleSets = erpSchema.table(
  'classification_rule_set',
  {
    ...pkId(),
    ...tenantCol(),
    standard: reportingStandardEnum('standard').notNull(),
    version: integer('version').notNull().default(1),
    name: varchar('name', { length: 100 }).notNull(),
    isActive: boolean('is_active').notNull().default(true),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('uq_classification_rule_set_tenant_standard_version').on(
      t.tenantId,
      t.standard,
      t.version
    ),
  ]
);

// ─── erp.classification_rule ────────────────────────────────────────────────

export const classificationRules = erpSchema.table(
  'classification_rule',
  {
    ...pkId(),
    ...tenantCol(),
    ruleSetId: uuid('rule_set_id').notNull(),
    accountType: accountTypeEnum('account_type').notNull(),
    pattern: varchar('pattern', { length: 100 }).notNull(),
    category: varchar('category', { length: 100 }).notNull(),
    priority: smallint('priority').notNull().default(0),
    ...timestamps(),
  },
  (t) => [
    index('idx_classification_rule_set_tenant').on(t.tenantId, t.ruleSetId),
    index('idx_classification_rule_type_tenant').on(t.tenantId, t.accountType),
  ]
);

// ─── erp.payment_terms_template ──────────────────────────────────────────────

export const paymentTermsTemplates = erpSchema.table(
  'payment_terms_template',
  {
    ...pkId(),
    ...tenantCol(),
    code: varchar('code', { length: 20 }).notNull(),
    name: text('name').notNull(),
    netDays: smallint('net_days').notNull(),
    discountPercent: smallint('discount_percent').notNull().default(0),
    discountDays: smallint('discount_days').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    ...timestamps(),
  },
  (t) => [uniqueIndex('uq_payment_terms_code_tenant').on(t.tenantId, t.code)]
);

// ─── erp.ap_invoice ──────────────────────────────────────────────────────────

export const apInvoices = erpSchema.table(
  'ap_invoice',
  {
    ...pkId(),
    ...tenantCol(),
    companyId: uuid('company_id').notNull(),
    supplierId: uuid('supplier_id').notNull(),
    ledgerId: uuid('ledger_id').notNull(),
    invoiceNumber: varchar('invoice_number', { length: 50 }).notNull(),
    supplierRef: varchar('supplier_ref', { length: 100 }),
    invoiceDate: timestamp('invoice_date', { withTimezone: true }).notNull(),
    dueDate: timestamp('due_date', { withTimezone: true }).notNull(),
    currencyId: uuid('currency_id').notNull(),
    totalAmount: moneyBigint('total_amount').notNull(),
    paidAmount: moneyBigint('paid_amount')
      .notNull()
      .default(sql`0`),
    status: apInvoiceStatusEnum('status').notNull().default('DRAFT'),
    description: text('description'),
    poRef: varchar('po_ref', { length: 50 }),
    receiptRef: varchar('receipt_ref', { length: 50 }),
    paymentTermsId: uuid('payment_terms_id'),
    journalId: uuid('journal_id'),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('uq_ap_invoice_number_tenant').on(t.tenantId, t.companyId, t.invoiceNumber),
    index('idx_ap_invoice_supplier_tenant').on(t.tenantId, t.supplierId),
    index('idx_ap_invoice_status_tenant').on(t.tenantId, t.status),
    index('idx_ap_invoice_due_date_tenant').on(t.tenantId, t.dueDate),
  ]
);

// ─── erp.ap_invoice_line ─────────────────────────────────────────────────────

export const apInvoiceLines = erpSchema.table(
  'ap_invoice_line',
  {
    ...pkId(),
    ...tenantCol(),
    invoiceId: uuid('invoice_id').notNull(),
    lineNumber: smallint('line_number').notNull(),
    accountId: uuid('account_id').notNull(),
    description: text('description'),
    quantity: integer('quantity').notNull().default(1),
    unitPrice: moneyBigint('unit_price').notNull(),
    amount: moneyBigint('amount').notNull(),
    taxAmount: moneyBigint('tax_amount')
      .notNull()
      .default(sql`0`),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('uq_ap_invoice_line_num_tenant').on(t.tenantId, t.invoiceId, t.lineNumber),
    index('idx_ap_invoice_line_account_tenant').on(t.tenantId, t.accountId),
  ]
);

// ─── erp.ap_payment_run ──────────────────────────────────────────────────────

export const apPaymentRuns = erpSchema.table(
  'ap_payment_run',
  {
    ...pkId(),
    ...tenantCol(),
    companyId: uuid('company_id').notNull(),
    runNumber: varchar('run_number', { length: 30 }).notNull(),
    runDate: timestamp('run_date', { withTimezone: true }).notNull(),
    cutoffDate: timestamp('cutoff_date', { withTimezone: true }).notNull(),
    currencyId: uuid('currency_id').notNull(),
    totalAmount: moneyBigint('total_amount')
      .notNull()
      .default(sql`0`),
    status: paymentRunStatusEnum('status').notNull().default('DRAFT'),
    executedAt: timestamp('executed_at', { withTimezone: true }),
    executedBy: uuid('executed_by'),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('uq_ap_payment_run_number_tenant').on(t.tenantId, t.companyId, t.runNumber),
    index('idx_ap_payment_run_status_tenant').on(t.tenantId, t.status),
  ]
);

// ─── erp.ap_payment_run_item ─────────────────────────────────────────────────

export const apPaymentRunItems = erpSchema.table(
  'ap_payment_run_item',
  {
    ...pkId(),
    ...tenantCol(),
    paymentRunId: uuid('payment_run_id').notNull(),
    invoiceId: uuid('invoice_id').notNull(),
    supplierId: uuid('supplier_id').notNull(),
    amount: moneyBigint('amount').notNull(),
    discountAmount: moneyBigint('discount_amount')
      .notNull()
      .default(sql`0`),
    netAmount: moneyBigint('net_amount').notNull(),
    journalId: uuid('journal_id'),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('uq_ap_payment_run_item_invoice_tenant').on(
      t.tenantId,
      t.paymentRunId,
      t.invoiceId
    ),
    index('idx_ap_payment_run_item_run_tenant').on(t.tenantId, t.paymentRunId),
  ]
);

// ─── AR Sub-Ledger ─────────────────────────────────────────────────────────

export const arInvoices = erpSchema.table(
  'ar_invoice',
  {
    ...pkId(),
    ...tenantCol(),
    companyId: uuid('company_id').notNull(),
    customerId: uuid('customer_id').notNull(),
    ledgerId: uuid('ledger_id').notNull(),
    invoiceNumber: varchar('invoice_number', { length: 50 }).notNull(),
    customerRef: varchar('customer_ref', { length: 100 }),
    invoiceDate: timestamp('invoice_date', { withTimezone: true }).notNull(),
    dueDate: timestamp('due_date', { withTimezone: true }).notNull(),
    totalAmount: moneyBigint('total_amount')
      .notNull()
      .default(sql`0`),
    paidAmount: moneyBigint('paid_amount')
      .notNull()
      .default(sql`0`),
    status: arInvoiceStatusEnum('status').notNull().default('DRAFT'),
    currencyCode: varchar('currency_code', { length: 3 }).notNull().default('USD'),
    description: text('description'),
    paymentTermsId: uuid('payment_terms_id'),
    journalId: uuid('journal_id'),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('uq_ar_invoice_number_tenant').on(t.tenantId, t.invoiceNumber),
    index('idx_ar_invoice_customer_tenant').on(t.tenantId, t.customerId),
    index('idx_ar_invoice_status_tenant').on(t.tenantId, t.status),
    index('idx_ar_invoice_due_date_tenant').on(t.tenantId, t.dueDate),
  ]
);

export const arInvoiceLines = erpSchema.table(
  'ar_invoice_line',
  {
    ...pkId(),
    ...tenantCol(),
    invoiceId: uuid('invoice_id').notNull(),
    lineNumber: smallint('line_number').notNull(),
    accountId: uuid('account_id').notNull(),
    description: text('description'),
    quantity: integer('quantity').notNull().default(1),
    unitPrice: moneyBigint('unit_price').notNull(),
    amount: moneyBigint('amount').notNull(),
    taxAmount: moneyBigint('tax_amount')
      .notNull()
      .default(sql`0`),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('uq_ar_invoice_line_tenant').on(t.tenantId, t.invoiceId, t.lineNumber),
    index('idx_ar_invoice_line_invoice_tenant').on(t.tenantId, t.invoiceId),
  ]
);

export const arPaymentAllocations = erpSchema.table(
  'ar_payment_allocation',
  {
    ...pkId(),
    ...tenantCol(),
    customerId: uuid('customer_id').notNull(),
    paymentDate: timestamp('payment_date', { withTimezone: true }).notNull(),
    paymentRef: varchar('payment_ref', { length: 100 }).notNull(),
    totalAmount: moneyBigint('total_amount').notNull(),
    currencyCode: varchar('currency_code', { length: 3 }).notNull().default('USD'),
    ...timestamps(),
  },
  (t) => [index('idx_ar_payment_allocation_customer_tenant').on(t.tenantId, t.customerId)]
);

export const arAllocationItems = erpSchema.table(
  'ar_allocation_item',
  {
    ...pkId(),
    ...tenantCol(),
    paymentAllocationId: uuid('payment_allocation_id').notNull(),
    invoiceId: uuid('invoice_id').notNull(),
    allocatedAmount: moneyBigint('allocated_amount').notNull(),
    journalId: uuid('journal_id'),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('uq_ar_allocation_item_tenant').on(t.tenantId, t.paymentAllocationId, t.invoiceId),
    index('idx_ar_allocation_item_alloc_tenant').on(t.tenantId, t.paymentAllocationId),
  ]
);

export const dunningRuns = erpSchema.table(
  'dunning_run',
  {
    ...pkId(),
    ...tenantCol(),
    runDate: timestamp('run_date', { withTimezone: true }).notNull(),
    status: dunningRunStatusEnum('status').notNull().default('DRAFT'),
    ...timestamps(),
  },
  (t) => [index('idx_dunning_run_status_tenant').on(t.tenantId, t.status)]
);

export const dunningLetters = erpSchema.table(
  'dunning_letter',
  {
    ...pkId(),
    ...tenantCol(),
    dunningRunId: uuid('dunning_run_id').notNull(),
    customerId: uuid('customer_id').notNull(),
    level: smallint('level').notNull(),
    invoiceIds: jsonb('invoice_ids')
      .notNull()
      .default(sql`'[]'::jsonb`),
    totalOverdue: moneyBigint('total_overdue').notNull(),
    currencyCode: varchar('currency_code', { length: 3 }).notNull().default('USD'),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    ...timestamps(),
  },
  (t) => [
    index('idx_dunning_letter_run_tenant').on(t.tenantId, t.dunningRunId),
    index('idx_dunning_letter_customer_tenant').on(t.tenantId, t.customerId),
  ]
);

// ─── erp.tax_code ──────────────────────────────────────────────────────────

export const taxCodes = erpSchema.table(
  'tax_code',
  {
    ...pkId(),
    ...tenantCol(),
    code: varchar('code', { length: 20 }).notNull(),
    name: text('name').notNull(),
    description: text('description'),
    jurisdictionLevel: jurisdictionLevelEnum('jurisdiction_level').notNull(),
    countryCode: varchar('country_code', { length: 2 }).notNull(),
    stateCode: varchar('state_code', { length: 10 }),
    cityCode: varchar('city_code', { length: 20 }),
    parentId: uuid('parent_id'),
    isCompound: boolean('is_compound').notNull().default(false),
    isActive: boolean('is_active').notNull().default(true),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('idx_tax_code_tenant_code').on(t.tenantId, t.code),
    index('idx_tax_code_country_tenant').on(t.tenantId, t.countryCode),
  ]
);

// ─── erp.tax_rate ──────────────────────────────────────────────────────────

export const taxRates = erpSchema.table(
  'tax_rate',
  {
    ...pkId(),
    ...tenantCol(),
    taxCodeId: uuid('tax_code_id').notNull(),
    name: text('name').notNull(),
    ratePercent: smallint('rate_percent').notNull(),
    type: taxRateTypeEnum('type').notNull(),
    jurisdictionCode: varchar('jurisdiction_code', { length: 20 }).notNull(),
    effectiveFrom: timestamp('effective_from', { withTimezone: true }).notNull(),
    effectiveTo: timestamp('effective_to', { withTimezone: true }),
    isActive: boolean('is_active').notNull().default(true),
    ...timestamps(),
  },
  (t) => [
    index('idx_tax_rate_code_tenant').on(t.tenantId, t.taxCodeId),
    index('idx_tax_rate_jurisdiction_tenant').on(t.tenantId, t.jurisdictionCode),
  ]
);

// ─── erp.tax_return_period ─────────────────────────────────────────────────

export const taxReturnPeriods = erpSchema.table(
  'tax_return_period',
  {
    ...pkId(),
    ...tenantCol(),
    taxType: varchar('tax_type', { length: 20 }).notNull(),
    jurisdictionCode: varchar('jurisdiction_code', { length: 20 }).notNull(),
    periodStart: timestamp('period_start', { withTimezone: true }).notNull(),
    periodEnd: timestamp('period_end', { withTimezone: true }).notNull(),
    outputTax: moneyBigint('output_tax')
      .notNull()
      .default(sql`0`),
    inputTax: moneyBigint('input_tax')
      .notNull()
      .default(sql`0`),
    netPayable: moneyBigint('net_payable')
      .notNull()
      .default(sql`0`),
    currencyCode: varchar('currency_code', { length: 3 }).notNull().default('USD'),
    status: taxReturnStatusEnum('status').notNull().default('DRAFT'),
    filedAt: timestamp('filed_at', { withTimezone: true }),
    filedBy: uuid('filed_by'),
    ...timestamps(),
  },
  (t) => [
    index('idx_tax_return_jurisdiction_tenant').on(t.tenantId, t.jurisdictionCode),
    index('idx_tax_return_status_tenant').on(t.tenantId, t.status),
  ]
);

// ─── erp.wht_certificate ──────────────────────────────────────────────────

export const whtCertificates = erpSchema.table(
  'wht_certificate',
  {
    ...pkId(),
    ...tenantCol(),
    payeeId: uuid('payee_id').notNull(),
    payeeName: text('payee_name').notNull(),
    payeeType: varchar('payee_type', { length: 20 }).notNull(),
    countryCode: varchar('country_code', { length: 2 }).notNull(),
    incomeType: varchar('income_type', { length: 50 }).notNull(),
    grossAmount: moneyBigint('gross_amount').notNull(),
    whtAmount: moneyBigint('wht_amount').notNull(),
    netAmount: moneyBigint('net_amount').notNull(),
    currencyCode: varchar('currency_code', { length: 3 }).notNull().default('USD'),
    rateApplied: smallint('rate_applied').notNull(),
    treatyRate: smallint('treaty_rate'),
    certificateNumber: varchar('certificate_number', { length: 50 }).notNull(),
    issueDate: timestamp('issue_date', { withTimezone: true }).notNull(),
    taxPeriodStart: timestamp('tax_period_start', { withTimezone: true }).notNull(),
    taxPeriodEnd: timestamp('tax_period_end', { withTimezone: true }).notNull(),
    relatedInvoiceId: uuid('related_invoice_id'),
    relatedPaymentId: uuid('related_payment_id'),
    status: whtCertificateStatusEnum('status').notNull().default('DRAFT'),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('idx_wht_cert_number_tenant').on(t.tenantId, t.certificateNumber),
    index('idx_wht_cert_payee_tenant').on(t.tenantId, t.payeeId),
    index('idx_wht_cert_status_tenant').on(t.tenantId, t.status),
  ]
);

// ─── erp.asset ─────────────────────────────────────────────────────────────

export const assets = erpSchema.table(
  'asset',
  {
    ...pkId(),
    ...tenantCol(),
    companyId: uuid('company_id').notNull(),
    assetNumber: varchar('asset_number', { length: 50 }).notNull(),
    name: text('name').notNull(),
    description: text('description'),
    categoryCode: varchar('category_code', { length: 20 }).notNull(),
    acquisitionDate: timestamp('acquisition_date', { withTimezone: true }).notNull(),
    acquisitionCost: moneyBigint('acquisition_cost').notNull(),
    residualValue: moneyBigint('residual_value').notNull(),
    usefulLifeMonths: smallint('useful_life_months').notNull(),
    depreciationMethod: depreciationMethodEnum('depreciation_method').notNull(),
    accumulatedDepreciation: moneyBigint('accumulated_depreciation')
      .notNull()
      .default(sql`0`),
    netBookValue: moneyBigint('net_book_value').notNull(),
    currencyCode: varchar('currency_code', { length: 3 }).notNull().default('USD'),
    locationCode: varchar('location_code', { length: 20 }),
    costCenterId: uuid('cost_center_id'),
    glAccountId: uuid('gl_account_id').notNull(),
    depreciationAccountId: uuid('depreciation_account_id').notNull(),
    accumulatedDepreciationAccountId: uuid('accumulated_depreciation_account_id').notNull(),
    status: assetStatusEnum('status').notNull().default('ACTIVE'),
    disposedAt: timestamp('disposed_at', { withTimezone: true }),
    disposalProceeds: moneyBigint('disposal_proceeds'),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('idx_asset_number_tenant').on(t.tenantId, t.assetNumber),
    index('idx_asset_company_tenant').on(t.tenantId, t.companyId),
    index('idx_asset_status_tenant').on(t.tenantId, t.status),
  ]
);

// ─── erp.depreciation_schedule ─────────────────────────────────────────────

export const depreciationSchedules = erpSchema.table(
  'depreciation_schedule',
  {
    ...pkId(),
    ...tenantCol(),
    assetId: uuid('asset_id').notNull(),
    componentId: uuid('component_id'),
    periodStart: timestamp('period_start', { withTimezone: true }).notNull(),
    periodEnd: timestamp('period_end', { withTimezone: true }).notNull(),
    depreciationAmount: moneyBigint('depreciation_amount').notNull(),
    accumulatedDepreciation: moneyBigint('accumulated_depreciation').notNull(),
    netBookValue: moneyBigint('net_book_value').notNull(),
    currencyCode: varchar('currency_code', { length: 3 }).notNull().default('USD'),
    journalId: uuid('journal_id'),
    isPosted: boolean('is_posted').notNull().default(false),
    ...timestamps(),
  },
  (t) => [
    index('idx_depr_schedule_asset_tenant').on(t.tenantId, t.assetId),
    index('idx_depr_schedule_posted_tenant').on(t.tenantId, t.isPosted),
  ]
);

// ─── erp.asset_movement ────────────────────────────────────────────────────

export const assetMovements = erpSchema.table(
  'asset_movement',
  {
    ...pkId(),
    ...tenantCol(),
    assetId: uuid('asset_id').notNull(),
    movementType: assetMovementTypeEnum('movement_type').notNull(),
    movementDate: timestamp('movement_date', { withTimezone: true }).notNull(),
    amount: moneyBigint('amount').notNull(),
    currencyCode: varchar('currency_code', { length: 3 }).notNull().default('USD'),
    description: text('description'),
    fromCompanyId: uuid('from_company_id'),
    toCompanyId: uuid('to_company_id'),
    journalId: uuid('journal_id'),
    createdBy: uuid('created_by').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('idx_asset_movement_asset_tenant').on(t.tenantId, t.assetId),
    index('idx_asset_movement_type_tenant').on(t.tenantId, t.movementType),
  ]
);

// ─── erp.bank_statement ────────────────────────────────────────────────────

export const bankStatements = erpSchema.table(
  'bank_statement',
  {
    ...pkId(),
    ...tenantCol(),
    bankAccountId: uuid('bank_account_id').notNull(),
    bankAccountName: text('bank_account_name').notNull(),
    statementDate: timestamp('statement_date', { withTimezone: true }).notNull(),
    periodStart: timestamp('period_start', { withTimezone: true }).notNull(),
    periodEnd: timestamp('period_end', { withTimezone: true }).notNull(),
    openingBalance: moneyBigint('opening_balance').notNull(),
    closingBalance: moneyBigint('closing_balance').notNull(),
    currencyCode: varchar('currency_code', { length: 3 }).notNull().default('USD'),
    format: statementFormatEnum('format').notNull(),
    lineCount: smallint('line_count').notNull().default(0),
    importedAt: timestamp('imported_at', { withTimezone: true }).notNull().defaultNow(),
    importedBy: uuid('imported_by').notNull(),
    ...timestamps(),
  },
  (t) => [index('idx_bank_stmt_account_tenant').on(t.tenantId, t.bankAccountId)]
);

// ─── erp.bank_statement_line ───────────────────────────────────────────────

export const bankStatementLines = erpSchema.table(
  'bank_statement_line',
  {
    ...pkId(),
    ...tenantCol(),
    statementId: uuid('statement_id').notNull(),
    lineNumber: smallint('line_number').notNull(),
    transactionDate: timestamp('transaction_date', { withTimezone: true }).notNull(),
    valueDate: timestamp('value_date', { withTimezone: true }),
    transactionType: varchar('transaction_type', { length: 10 }).notNull(),
    amount: moneyBigint('amount').notNull(),
    currencyCode: varchar('currency_code', { length: 3 }).notNull().default('USD'),
    reference: varchar('reference', { length: 100 }),
    description: text('description').notNull(),
    payeeOrPayer: text('payee_or_payer'),
    bankReference: varchar('bank_reference', { length: 100 }),
    matchStatus: bankLineMatchStatusEnum('match_status').notNull().default('UNMATCHED'),
    matchId: uuid('match_id'),
    ...timestamps(),
  },
  (t) => [
    index('idx_bank_line_stmt_tenant').on(t.tenantId, t.statementId),
    index('idx_bank_line_status_tenant').on(t.tenantId, t.matchStatus),
  ]
);

// ─── erp.bank_match ────────────────────────────────────────────────────────

export const bankMatches = erpSchema.table(
  'bank_match',
  {
    ...pkId(),
    ...tenantCol(),
    statementLineId: uuid('statement_line_id').notNull(),
    journalId: uuid('journal_id'),
    sourceDocumentId: uuid('source_document_id'),
    sourceDocumentType: varchar('source_document_type', { length: 30 }),
    matchType: bankMatchTypeEnum('match_type').notNull(),
    confidence: bankMatchConfidenceEnum('confidence').notNull(),
    confidenceScore: smallint('confidence_score').notNull(),
    matchedAmount: moneyBigint('matched_amount').notNull(),
    currencyCode: varchar('currency_code', { length: 3 }).notNull().default('USD'),
    matchedAt: timestamp('matched_at', { withTimezone: true }).notNull().defaultNow(),
    matchedBy: uuid('matched_by'),
    confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
    confirmedBy: uuid('confirmed_by'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('idx_bank_match_line_tenant').on(t.tenantId, t.statementLineId)]
);

// ─── erp.bank_reconciliation ───────────────────────────────────────────────

export const bankReconciliations = erpSchema.table(
  'bank_reconciliation',
  {
    ...pkId(),
    ...tenantCol(),
    bankAccountId: uuid('bank_account_id').notNull(),
    periodStart: timestamp('period_start', { withTimezone: true }).notNull(),
    periodEnd: timestamp('period_end', { withTimezone: true }).notNull(),
    statementBalance: moneyBigint('statement_balance').notNull(),
    glBalance: moneyBigint('gl_balance').notNull(),
    adjustedStatementBalance: moneyBigint('adjusted_statement_balance').notNull(),
    adjustedGlBalance: moneyBigint('adjusted_gl_balance').notNull(),
    outstandingChecks: moneyBigint('outstanding_checks')
      .notNull()
      .default(sql`0`),
    depositsInTransit: moneyBigint('deposits_in_transit')
      .notNull()
      .default(sql`0`),
    difference: moneyBigint('difference')
      .notNull()
      .default(sql`0`),
    currencyCode: varchar('currency_code', { length: 3 }).notNull().default('USD'),
    status: reconciliationStatusEnum('status').notNull().default('IN_PROGRESS'),
    matchedCount: smallint('matched_count').notNull().default(0),
    unmatchedCount: smallint('unmatched_count').notNull().default(0),
    signedOffAt: timestamp('signed_off_at', { withTimezone: true }),
    signedOffBy: uuid('signed_off_by'),
    ...timestamps(),
  },
  (t) => [
    index('idx_bank_recon_account_tenant').on(t.tenantId, t.bankAccountId),
    index('idx_bank_recon_status_tenant').on(t.tenantId, t.status),
  ]
);

// ─── erp.credit_limit ──────────────────────────────────────────────────────

export const creditLimits = erpSchema.table(
  'credit_limit',
  {
    ...pkId(),
    ...tenantCol(),
    customerId: uuid('customer_id').notNull(),
    companyId: uuid('company_id').notNull(),
    creditLimit: moneyBigint('credit_limit').notNull(),
    currencyCode: varchar('currency_code', { length: 3 }).notNull().default('USD'),
    currentExposure: moneyBigint('current_exposure')
      .notNull()
      .default(sql`0`),
    availableCredit: moneyBigint('available_credit')
      .notNull()
      .default(sql`0`),
    status: creditStatusEnum('status').notNull().default('ACTIVE'),
    approvedBy: uuid('approved_by'),
    approvedAt: timestamp('approved_at', { withTimezone: true }),
    effectiveFrom: timestamp('effective_from', { withTimezone: true }).notNull(),
    effectiveTo: timestamp('effective_to', { withTimezone: true }),
    lastReviewDate: timestamp('last_review_date', { withTimezone: true }),
    nextReviewDate: timestamp('next_review_date', { withTimezone: true }),
    riskRating: varchar('risk_rating', { length: 10 }),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('idx_credit_limit_customer_tenant').on(t.tenantId, t.customerId),
    index('idx_credit_limit_company_tenant').on(t.tenantId, t.companyId),
    index('idx_credit_limit_status_tenant').on(t.tenantId, t.status),
  ]
);

// ─── erp.credit_review ─────────────────────────────────────────────────────

export const creditReviews = erpSchema.table(
  'credit_review',
  {
    ...pkId(),
    ...tenantCol(),
    creditLimitId: uuid('credit_limit_id').notNull(),
    customerId: uuid('customer_id').notNull(),
    reviewDate: timestamp('review_date', { withTimezone: true }).notNull(),
    previousLimit: moneyBigint('previous_limit').notNull(),
    proposedLimit: moneyBigint('proposed_limit').notNull(),
    approvedLimit: moneyBigint('approved_limit').notNull(),
    currencyCode: varchar('currency_code', { length: 3 }).notNull().default('USD'),
    outcome: reviewOutcomeEnum('outcome').notNull(),
    riskRating: varchar('risk_rating', { length: 10 }),
    notes: text('notes'),
    reviewedBy: uuid('reviewed_by').notNull(),
    approvedBy: uuid('approved_by'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('idx_credit_review_limit_tenant').on(t.tenantId, t.creditLimitId),
    index('idx_credit_review_customer_tenant').on(t.tenantId, t.customerId),
  ]
);

// ─── erp.expense_claim ─────────────────────────────────────────────────────

export const expenseClaims = erpSchema.table(
  'expense_claim',
  {
    ...pkId(),
    ...tenantCol(),
    companyId: uuid('company_id').notNull(),
    employeeId: uuid('employee_id').notNull(),
    claimNumber: varchar('claim_number', { length: 50 }).notNull(),
    description: text('description').notNull(),
    claimDate: timestamp('claim_date', { withTimezone: true }).notNull(),
    totalAmount: moneyBigint('total_amount').notNull(),
    currencyCode: varchar('currency_code', { length: 3 }).notNull().default('USD'),
    baseCurrencyAmount: moneyBigint('base_currency_amount').notNull(),
    status: expenseClaimStatusEnum('status').notNull().default('DRAFT'),
    submittedAt: timestamp('submitted_at', { withTimezone: true }),
    approvedBy: uuid('approved_by'),
    approvedAt: timestamp('approved_at', { withTimezone: true }),
    rejectionReason: text('rejection_reason'),
    reimbursedAt: timestamp('reimbursed_at', { withTimezone: true }),
    apInvoiceId: uuid('ap_invoice_id'),
    lineCount: smallint('line_count').notNull().default(0),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('idx_expense_claim_number_tenant').on(t.tenantId, t.claimNumber),
    index('idx_expense_claim_employee_tenant').on(t.tenantId, t.employeeId),
    index('idx_expense_claim_status_tenant').on(t.tenantId, t.status),
  ]
);

// ─── erp.expense_claim_line ────────────────────────────────────────────────

export const expenseClaimLines = erpSchema.table(
  'expense_claim_line',
  {
    ...pkId(),
    ...tenantCol(),
    claimId: uuid('claim_id').notNull(),
    lineNumber: smallint('line_number').notNull(),
    expenseDate: timestamp('expense_date', { withTimezone: true }).notNull(),
    category: expenseCategoryEnum('category').notNull(),
    description: text('description').notNull(),
    amount: moneyBigint('amount').notNull(),
    currencyCode: varchar('currency_code', { length: 3 }).notNull().default('USD'),
    baseCurrencyAmount: moneyBigint('base_currency_amount').notNull(),
    receiptRef: varchar('receipt_ref', { length: 200 }),
    glAccountId: uuid('gl_account_id').notNull(),
    costCenterId: uuid('cost_center_id'),
    projectId: uuid('project_id'),
    isBillable: boolean('is_billable').notNull().default(false),
    ...timestamps(),
  },
  (t) => [index('idx_expense_line_claim_tenant').on(t.tenantId, t.claimId)]
);

// ─── erp.expense_policy ────────────────────────────────────────────────────

export const expensePolicies = erpSchema.table(
  'expense_policy',
  {
    ...pkId(),
    ...tenantCol(),
    companyId: uuid('company_id').notNull(),
    name: text('name').notNull(),
    category: varchar('category', { length: 30 }).notNull(),
    maxAmountPerItem: moneyBigint('max_amount_per_item').notNull(),
    maxAmountPerClaim: moneyBigint('max_amount_per_claim').notNull(),
    currencyCode: varchar('currency_code', { length: 3 }).notNull().default('USD'),
    requiresReceipt: boolean('requires_receipt').notNull().default(true),
    requiresApproval: boolean('requires_approval').notNull().default(true),
    perDiemRate: moneyBigint('per_diem_rate'),
    mileageRateBps: smallint('mileage_rate_bps'),
    isActive: boolean('is_active').notNull().default(true),
    ...timestamps(),
  },
  (t) => [index('idx_expense_policy_company_tenant').on(t.tenantId, t.companyId)]
);

// ─── erp.project ───────────────────────────────────────────────────────────

export const projects = erpSchema.table(
  'project',
  {
    ...pkId(),
    ...tenantCol(),
    companyId: uuid('company_id').notNull(),
    projectCode: varchar('project_code', { length: 30 }).notNull(),
    name: text('name').notNull(),
    description: text('description'),
    customerId: uuid('customer_id'),
    managerId: uuid('manager_id').notNull(),
    status: projectStatusEnum('status').notNull().default('PLANNING'),
    billingType: billingTypeEnum('billing_type').notNull(),
    budgetAmount: moneyBigint('budget_amount').notNull(),
    actualCost: moneyBigint('actual_cost')
      .notNull()
      .default(sql`0`),
    billedAmount: moneyBigint('billed_amount')
      .notNull()
      .default(sql`0`),
    currencyCode: varchar('currency_code', { length: 3 }).notNull().default('USD'),
    startDate: timestamp('start_date', { withTimezone: true }).notNull(),
    endDate: timestamp('end_date', { withTimezone: true }),
    completionPct: smallint('completion_pct').notNull().default(0),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('idx_project_code_tenant').on(t.tenantId, t.projectCode),
    index('idx_project_company_tenant').on(t.tenantId, t.companyId),
    index('idx_project_status_tenant').on(t.tenantId, t.status),
  ]
);

// ─── erp.project_cost_line ─────────────────────────────────────────────────

export const projectCostLines = erpSchema.table(
  'project_cost_line',
  {
    ...pkId(),
    ...tenantCol(),
    projectId: uuid('project_id').notNull(),
    lineNumber: smallint('line_number').notNull(),
    costDate: timestamp('cost_date', { withTimezone: true }).notNull(),
    category: costCategoryEnum('category').notNull(),
    description: text('description').notNull(),
    amount: moneyBigint('amount').notNull(),
    currencyCode: varchar('currency_code', { length: 3 }).notNull().default('USD'),
    glAccountId: uuid('gl_account_id').notNull(),
    journalId: uuid('journal_id'),
    employeeId: uuid('employee_id'),
    isBillable: boolean('is_billable').notNull().default(true),
    ...timestamps(),
  },
  (t) => [index('idx_project_cost_project_tenant').on(t.tenantId, t.projectId)]
);

// ─── erp.project_billing ──────────────────────────────────────────────────

export const projectBillings = erpSchema.table(
  'project_billing',
  {
    ...pkId(),
    ...tenantCol(),
    projectId: uuid('project_id').notNull(),
    billingDate: timestamp('billing_date', { withTimezone: true }).notNull(),
    description: text('description').notNull(),
    amount: moneyBigint('amount').notNull(),
    currencyCode: varchar('currency_code', { length: 3 }).notNull().default('USD'),
    status: billingStatusEnum('status').notNull().default('DRAFT'),
    milestoneRef: varchar('milestone_ref', { length: 100 }),
    arInvoiceId: uuid('ar_invoice_id'),
    ...timestamps(),
  },
  (t) => [index('idx_project_billing_project_tenant').on(t.tenantId, t.projectId)]
);

// ═══════════════════════════════════════════════════════════════════════════
// Phase 4: Lease Accounting (IFRS 16)
// ═══════════════════════════════════════════════════════════════════════════

// ─── erp.lease_contract ───────────────────────────────────────────────────

export const leaseContracts = erpSchema.table(
  'lease_contract',
  {
    ...pkId(),
    ...tenantCol(),
    companyId: uuid('company_id').notNull(),
    leaseNumber: varchar('lease_number', { length: 50 }).notNull(),
    description: text('description').notNull(),
    lesseeOrLessor: lesseeOrLessorEnum('lessee_or_lessor').notNull().default('LESSEE'),
    leaseType: leaseTypeEnum('lease_type').notNull().default('OPERATING'),
    status: leaseStatusEnum('status').notNull().default('DRAFT'),
    counterpartyId: uuid('counterparty_id').notNull(),
    counterpartyName: varchar('counterparty_name', { length: 200 }).notNull(),
    assetDescription: text('asset_description').notNull(),
    commencementDate: timestamp('commencement_date', { withTimezone: true }).notNull(),
    endDate: timestamp('end_date', { withTimezone: true }).notNull(),
    leaseTermMonths: integer('lease_term_months').notNull(),
    currencyCode: varchar('currency_code', { length: 3 }).notNull().default('USD'),
    monthlyPayment: moneyBigint('monthly_payment').notNull(),
    annualEscalationBps: integer('annual_escalation_bps').notNull().default(0),
    discountRateBps: integer('discount_rate_bps').notNull(),
    rouAssetAmount: moneyBigint('rou_asset_amount').notNull().default(0n),
    leaseLiabilityAmount: moneyBigint('lease_liability_amount').notNull().default(0n),
    isShortTerm: boolean('is_short_term').notNull().default(false),
    isLowValue: boolean('is_low_value').notNull().default(false),
    createdBy: uuid('created_by').notNull(),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('idx_lease_contract_number_tenant').on(t.tenantId, t.leaseNumber),
    index('idx_lease_contract_company_tenant').on(t.tenantId, t.companyId),
    index('idx_lease_contract_status').on(t.tenantId, t.status),
  ]
);

// ─── erp.lease_schedule ───────────────────────────────────────────────────

export const leaseSchedules = erpSchema.table(
  'lease_schedule',
  {
    ...pkId(),
    ...tenantCol(),
    leaseContractId: uuid('lease_contract_id').notNull(),
    periodNumber: integer('period_number').notNull(),
    paymentDate: timestamp('payment_date', { withTimezone: true }).notNull(),
    paymentAmount: moneyBigint('payment_amount').notNull(),
    principalPortion: moneyBigint('principal_portion').notNull(),
    interestPortion: moneyBigint('interest_portion').notNull(),
    openingLiability: moneyBigint('opening_liability').notNull(),
    closingLiability: moneyBigint('closing_liability').notNull(),
    rouDepreciation: moneyBigint('rou_depreciation').notNull(),
    currencyCode: varchar('currency_code', { length: 3 }).notNull().default('USD'),
    ...timestamps(),
  },
  (t) => [index('idx_lease_schedule_contract_tenant').on(t.tenantId, t.leaseContractId)]
);

// ─── erp.lease_modification ───────────────────────────────────────────────

export const leaseModifications = erpSchema.table(
  'lease_modification',
  {
    ...pkId(),
    ...tenantCol(),
    leaseContractId: uuid('lease_contract_id').notNull(),
    modificationDate: timestamp('modification_date', { withTimezone: true }).notNull(),
    modificationType: leaseModificationTypeEnum('modification_type').notNull(),
    description: text('description').notNull(),
    previousLeaseTermMonths: integer('previous_lease_term_months').notNull(),
    newLeaseTermMonths: integer('new_lease_term_months').notNull(),
    previousMonthlyPayment: moneyBigint('previous_monthly_payment').notNull(),
    newMonthlyPayment: moneyBigint('new_monthly_payment').notNull(),
    previousDiscountRateBps: integer('previous_discount_rate_bps').notNull(),
    newDiscountRateBps: integer('new_discount_rate_bps').notNull(),
    liabilityAdjustment: moneyBigint('liability_adjustment').notNull(),
    rouAssetAdjustment: moneyBigint('rou_asset_adjustment').notNull(),
    gainLossOnModification: moneyBigint('gain_loss_on_modification').notNull().default(0n),
    currencyCode: varchar('currency_code', { length: 3 }).notNull().default('USD'),
    modifiedBy: uuid('modified_by').notNull(),
    ...timestamps(),
  },
  (t) => [index('idx_lease_modification_contract_tenant').on(t.tenantId, t.leaseContractId)]
);

// ═══════════════════════════════════════════════════════════════════════════
// Phase 4: Provisions (IAS 37)
// ═══════════════════════════════════════════════════════════════════════════

// ─── erp.provision ────────────────────────────────────────────────────────

export const provisions = erpSchema.table(
  'provision',
  {
    ...pkId(),
    ...tenantCol(),
    companyId: uuid('company_id').notNull(),
    provisionNumber: varchar('provision_number', { length: 50 }).notNull(),
    description: text('description').notNull(),
    provisionType: provisionTypeEnum('provision_type').notNull(),
    status: provisionStatusEnum('status').notNull().default('ACTIVE'),
    recognitionDate: timestamp('recognition_date', { withTimezone: true }).notNull(),
    expectedSettlementDate: timestamp('expected_settlement_date', { withTimezone: true }),
    initialAmount: moneyBigint('initial_amount').notNull(),
    currentAmount: moneyBigint('current_amount').notNull(),
    discountRateBps: integer('discount_rate_bps').notNull().default(0),
    currencyCode: varchar('currency_code', { length: 3 }).notNull().default('USD'),
    glAccountId: uuid('gl_account_id'),
    isContingentLiability: boolean('is_contingent_liability').notNull().default(false),
    contingentLiabilityNote: text('contingent_liability_note'),
    createdBy: uuid('created_by').notNull(),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('idx_provision_number_tenant').on(t.tenantId, t.provisionNumber),
    index('idx_provision_company_tenant').on(t.tenantId, t.companyId),
    index('idx_provision_type_status').on(t.tenantId, t.provisionType, t.status),
  ]
);

// ─── erp.provision_movement ───────────────────────────────────────────────

export const provisionMovements = erpSchema.table(
  'provision_movement',
  {
    ...pkId(),
    ...tenantCol(),
    provisionId: uuid('provision_id').notNull(),
    movementDate: timestamp('movement_date', { withTimezone: true }).notNull(),
    movementType: provisionMovementTypeEnum('movement_type').notNull(),
    amount: moneyBigint('amount').notNull(),
    balanceAfter: moneyBigint('balance_after').notNull(),
    description: text('description').notNull(),
    journalId: uuid('journal_id'),
    currencyCode: varchar('currency_code', { length: 3 }).notNull().default('USD'),
    createdBy: uuid('created_by').notNull(),
    ...timestamps(),
  },
  (t) => [index('idx_provision_movement_provision_tenant').on(t.tenantId, t.provisionId)]
);

// ═══════════════════════════════════════════════════════════════════════════
// Phase 4: Treasury & Cash Management
// ═══════════════════════════════════════════════════════════════════════════

// ─── erp.cash_forecast ────────────────────────────────────────────────────

export const cashForecasts = erpSchema.table(
  'cash_forecast',
  {
    ...pkId(),
    ...tenantCol(),
    companyId: uuid('company_id').notNull(),
    forecastDate: timestamp('forecast_date', { withTimezone: true }).notNull(),
    forecastType: forecastTypeEnum('forecast_type').notNull(),
    description: text('description').notNull(),
    amount: moneyBigint('amount').notNull(),
    currencyCode: varchar('currency_code', { length: 3 }).notNull().default('USD'),
    probability: integer('probability').notNull().default(100),
    sourceDocumentId: uuid('source_document_id'),
    sourceDocumentType: varchar('source_document_type', { length: 50 }),
    ...timestamps(),
  },
  (t) => [
    index('idx_cash_forecast_company_date').on(t.tenantId, t.companyId, t.forecastDate),
    index('idx_cash_forecast_type').on(t.tenantId, t.forecastType),
  ]
);

// ─── erp.covenant ─────────────────────────────────────────────────────────

export const covenants = erpSchema.table(
  'covenant',
  {
    ...pkId(),
    ...tenantCol(),
    companyId: uuid('company_id').notNull(),
    lenderId: uuid('lender_id').notNull(),
    lenderName: varchar('lender_name', { length: 200 }).notNull(),
    covenantType: covenantTypeEnum('covenant_type').notNull(),
    description: text('description').notNull(),
    thresholdValue: integer('threshold_value').notNull(),
    currentValue: integer('current_value'),
    status: covenantStatusEnum('status').notNull().default('COMPLIANT'),
    testFrequency: varchar('test_frequency', { length: 20 }).notNull().default('QUARTERLY'),
    lastTestDate: timestamp('last_test_date', { withTimezone: true }),
    nextTestDate: timestamp('next_test_date', { withTimezone: true }),
    ...timestamps(),
  },
  (t) => [
    index('idx_covenant_company_tenant').on(t.tenantId, t.companyId),
    index('idx_covenant_status').on(t.tenantId, t.status),
  ]
);

// ─── erp.ic_loan ──────────────────────────────────────────────────────────

export const icLoans = erpSchema.table(
  'ic_loan',
  {
    ...pkId(),
    ...tenantCol(),
    lenderCompanyId: uuid('lender_company_id').notNull(),
    borrowerCompanyId: uuid('borrower_company_id').notNull(),
    loanNumber: varchar('loan_number', { length: 50 }).notNull(),
    description: text('description').notNull(),
    principalAmount: moneyBigint('principal_amount').notNull(),
    outstandingBalance: moneyBigint('outstanding_balance').notNull(),
    interestRateBps: integer('interest_rate_bps').notNull(),
    currencyCode: varchar('currency_code', { length: 3 }).notNull().default('USD'),
    startDate: timestamp('start_date', { withTimezone: true }).notNull(),
    maturityDate: timestamp('maturity_date', { withTimezone: true }).notNull(),
    status: icLoanStatusEnum('status').notNull().default('ACTIVE'),
    icAgreementId: uuid('ic_agreement_id'),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('idx_ic_loan_number_tenant').on(t.tenantId, t.loanNumber),
    index('idx_ic_loan_lender_tenant').on(t.tenantId, t.lenderCompanyId),
    index('idx_ic_loan_borrower_tenant').on(t.tenantId, t.borrowerCompanyId),
  ]
);

// ─── Phase 5: Cost Accounting ─────────────────────────────────────────────

// ─── erp.cost_center ──────────────────────────────────────────────────────

export const costCenters = erpSchema.table(
  'cost_center',
  {
    ...pkId(),
    ...tenantCol(),
    companyId: uuid('company_id').notNull(),
    code: varchar('code', { length: 30 }).notNull(),
    name: varchar('name', { length: 200 }).notNull(),
    parentId: uuid('parent_id'),
    level: smallint('level').notNull().default(0),
    status: costCenterStatusEnum('status').notNull().default('ACTIVE'),
    managerId: uuid('manager_id'),
    currencyCode: varchar('currency_code', { length: 3 }).notNull().default('USD'),
    effectiveFrom: timestamp('effective_from', { withTimezone: true }).notNull(),
    effectiveTo: timestamp('effective_to', { withTimezone: true }),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('idx_cost_center_code_tenant').on(t.tenantId, t.companyId, t.code),
    index('idx_cost_center_parent').on(t.tenantId, t.parentId),
    index('idx_cost_center_company').on(t.tenantId, t.companyId),
  ]
);

// ─── erp.cost_driver ──────────────────────────────────────────────────────

export const costDrivers = erpSchema.table(
  'cost_driver',
  {
    ...pkId(),
    ...tenantCol(),
    companyId: uuid('company_id').notNull(),
    code: varchar('code', { length: 30 }).notNull(),
    name: varchar('name', { length: 200 }).notNull(),
    driverType: driverTypeEnum('driver_type').notNull(),
    unitOfMeasure: varchar('unit_of_measure', { length: 30 }).notNull(),
    isActive: boolean('is_active').notNull().default(true),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('idx_cost_driver_code_tenant').on(t.tenantId, t.companyId, t.code),
    index('idx_cost_driver_company').on(t.tenantId, t.companyId),
  ]
);

// ─── erp.cost_driver_value ────────────────────────────────────────────────

export const costDriverValues = erpSchema.table(
  'cost_driver_value',
  {
    ...pkId(),
    ...tenantCol(),
    driverId: uuid('driver_id').notNull(),
    costCenterId: uuid('cost_center_id').notNull(),
    periodId: uuid('period_id').notNull(),
    quantity: moneyBigint('quantity').notNull(),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('idx_cost_driver_value_unique').on(
      t.tenantId,
      t.driverId,
      t.costCenterId,
      t.periodId
    ),
    index('idx_cost_driver_value_period').on(t.tenantId, t.periodId),
  ]
);

// ─── erp.cost_allocation_run ──────────────────────────────────────────────

export const costAllocationRuns = erpSchema.table(
  'cost_allocation_run',
  {
    ...pkId(),
    ...tenantCol(),
    companyId: uuid('company_id').notNull(),
    periodId: uuid('period_id').notNull(),
    method: allocationMethodEnum('method').notNull(),
    status: allocationRunStatusEnum('status').notNull().default('DRAFT'),
    totalAllocated: moneyBigint('total_allocated').notNull().default(0n),
    currencyCode: varchar('currency_code', { length: 3 }).notNull().default('USD'),
    lineCount: integer('line_count').notNull().default(0),
    executedBy: uuid('executed_by').notNull(),
    executedAt: timestamp('executed_at', { withTimezone: true }),
    reversedAt: timestamp('reversed_at', { withTimezone: true }),
    ...timestamps(),
  },
  (t) => [
    index('idx_cost_alloc_run_period').on(t.tenantId, t.companyId, t.periodId),
    index('idx_cost_alloc_run_status').on(t.tenantId, t.status),
  ]
);

// ─── erp.cost_allocation_line ─────────────────────────────────────────────

export const costAllocationLines = erpSchema.table(
  'cost_allocation_line',
  {
    ...pkId(),
    ...tenantCol(),
    runId: uuid('run_id').notNull(),
    fromCostCenterId: uuid('from_cost_center_id').notNull(),
    toCostCenterId: uuid('to_cost_center_id').notNull(),
    driverId: uuid('driver_id').notNull(),
    amount: moneyBigint('amount').notNull(),
    driverQuantity: moneyBigint('driver_quantity').notNull(),
    allocationRate: moneyBigint('allocation_rate').notNull(),
    ...timestamps(),
  },
  (t) => [
    index('idx_cost_alloc_line_run').on(t.tenantId, t.runId),
    index('idx_cost_alloc_line_from').on(t.tenantId, t.fromCostCenterId),
    index('idx_cost_alloc_line_to').on(t.tenantId, t.toCostCenterId),
  ]
);

// ─── Phase 6: Consolidation ──────────────────────────────────────────────

// ─── erp.group_entity ────────────────────────────────────────────────────

export const groupEntities = erpSchema.table(
  'group_entity',
  {
    ...pkId(),
    ...tenantCol(),
    companyId: uuid('company_id').notNull(),
    name: varchar('name', { length: 200 }).notNull(),
    entityType: groupEntityTypeEnum('entity_type').notNull(),
    parentEntityId: uuid('parent_entity_id'),
    baseCurrency: varchar('base_currency', { length: 3 }).notNull(),
    countryCode: varchar('country_code', { length: 3 }).notNull(),
    isActive: boolean('is_active').notNull().default(true),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('idx_group_entity_company_tenant').on(t.tenantId, t.companyId),
    index('idx_group_entity_parent').on(t.tenantId, t.parentEntityId),
  ]
);

// ─── erp.ownership_record ────────────────────────────────────────────────

export const ownershipRecords = erpSchema.table(
  'ownership_record',
  {
    ...pkId(),
    ...tenantCol(),
    parentEntityId: uuid('parent_entity_id').notNull(),
    childEntityId: uuid('child_entity_id').notNull(),
    ownershipPctBps: integer('ownership_pct_bps').notNull(),
    votingPctBps: integer('voting_pct_bps').notNull(),
    effectiveFrom: timestamp('effective_from', { withTimezone: true }).notNull(),
    effectiveTo: timestamp('effective_to', { withTimezone: true }),
    acquisitionDate: timestamp('acquisition_date', { withTimezone: true }).notNull(),
    acquisitionCost: moneyBigint('acquisition_cost').notNull(),
    currencyCode: varchar('currency_code', { length: 3 }).notNull(),
    ...timestamps(),
  },
  (t) => [
    index('idx_ownership_parent_tenant').on(t.tenantId, t.parentEntityId),
    index('idx_ownership_child_tenant').on(t.tenantId, t.childEntityId),
    index('idx_ownership_effective').on(t.tenantId, t.effectiveFrom, t.effectiveTo),
  ]
);

// ─── erp.goodwill ────────────────────────────────────────────────────────

export const goodwills = erpSchema.table(
  'goodwill',
  {
    ...pkId(),
    ...tenantCol(),
    ownershipRecordId: uuid('ownership_record_id').notNull(),
    childEntityId: uuid('child_entity_id').notNull(),
    acquisitionDate: timestamp('acquisition_date', { withTimezone: true }).notNull(),
    considerationPaid: moneyBigint('consideration_paid').notNull(),
    fairValueNetAssets: moneyBigint('fair_value_net_assets').notNull(),
    nciAtAcquisition: moneyBigint('nci_at_acquisition').notNull(),
    goodwillAmount: moneyBigint('goodwill_amount').notNull(),
    accumulatedImpairment: moneyBigint('accumulated_impairment').notNull().default(0n),
    carryingAmount: moneyBigint('carrying_amount').notNull(),
    currencyCode: varchar('currency_code', { length: 3 }).notNull(),
    status: goodwillStatusEnum('status').notNull().default('ACTIVE'),
    ...timestamps(),
  },
  (t) => [
    index('idx_goodwill_child_tenant').on(t.tenantId, t.childEntityId),
    index('idx_goodwill_ownership').on(t.tenantId, t.ownershipRecordId),
  ]
);

// ─── Phase 7: IFRS Specialist Modules ─────────────────────────────────────

// ─── erp.intangible_asset ─────────────────────────────────────────────────

export const intangibleAssets = erpSchema.table(
  'intangible_asset',
  {
    ...pkId(),
    ...tenantCol(),
    companyId: uuid('company_id').notNull(),
    assetNumber: varchar('asset_number', { length: 30 }).notNull(),
    name: varchar('name', { length: 200 }).notNull(),
    description: text('description'),
    category: intangibleCategoryEnum('category').notNull(),
    usefulLifeType: usefulLifeTypeEnum('useful_life_type').notNull(),
    acquisitionDate: timestamp('acquisition_date', { withTimezone: true }).notNull(),
    acquisitionCost: moneyBigint('acquisition_cost').notNull(),
    residualValue: moneyBigint('residual_value').notNull().default(0n),
    usefulLifeMonths: integer('useful_life_months'),
    accumulatedAmortization: moneyBigint('accumulated_amortization').notNull().default(0n),
    netBookValue: moneyBigint('net_book_value').notNull(),
    currencyCode: varchar('currency_code', { length: 3 }).notNull(),
    glAccountId: uuid('gl_account_id').notNull(),
    amortizationAccountId: uuid('amortization_account_id').notNull(),
    accumulatedAmortizationAccountId: uuid('accumulated_amortization_account_id').notNull(),
    status: intangibleAssetStatusEnum('status').notNull().default('ACTIVE'),
    isInternallyGenerated: boolean('is_internally_generated').notNull().default(false),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('idx_intangible_asset_number').on(t.tenantId, t.companyId, t.assetNumber),
    index('idx_intangible_company').on(t.tenantId, t.companyId),
    index('idx_intangible_category').on(t.tenantId, t.category),
  ]
);

// ─── erp.financial_instrument ─────────────────────────────────────────────

export const financialInstruments = erpSchema.table(
  'financial_instrument',
  {
    ...pkId(),
    ...tenantCol(),
    companyId: uuid('company_id').notNull(),
    instrumentType: instrumentTypeEnum('instrument_type').notNull(),
    classification: instrumentClassificationEnum('classification').notNull(),
    fairValueLevel: fairValueLevelEnum('fair_value_level'),
    nominalAmount: moneyBigint('nominal_amount').notNull(),
    carryingAmount: moneyBigint('carrying_amount').notNull(),
    fairValue: moneyBigint('fair_value'),
    effectiveInterestRateBps: integer('effective_interest_rate_bps').notNull(),
    contractualRateBps: integer('contractual_rate_bps').notNull(),
    currencyCode: varchar('currency_code', { length: 3 }).notNull(),
    maturityDate: timestamp('maturity_date', { withTimezone: true }),
    counterpartyId: uuid('counterparty_id').notNull(),
    glAccountId: uuid('gl_account_id').notNull(),
    isDerecognized: boolean('is_derecognized').notNull().default(false),
    ...timestamps(),
  },
  (t) => [
    index('idx_fin_instrument_company').on(t.tenantId, t.companyId),
    index('idx_fin_instrument_type').on(t.tenantId, t.instrumentType),
    index('idx_fin_instrument_classification').on(t.tenantId, t.classification),
  ]
);

// ─── erp.hedge_relationship ───────────────────────────────────────────────

export const hedgeRelationships = erpSchema.table(
  'hedge_relationship',
  {
    ...pkId(),
    ...tenantCol(),
    companyId: uuid('company_id').notNull(),
    hedgeType: hedgeTypeEnum('hedge_type').notNull(),
    hedgingInstrumentId: uuid('hedging_instrument_id').notNull(),
    hedgedItemId: uuid('hedged_item_id').notNull(),
    hedgedRisk: varchar('hedged_risk', { length: 100 }).notNull(),
    hedgeRatio: integer('hedge_ratio').notNull().default(10000),
    designationDate: timestamp('designation_date', { withTimezone: true }).notNull(),
    status: hedgeStatusEnum('status').notNull().default('DESIGNATED'),
    discontinuationDate: timestamp('discontinuation_date', { withTimezone: true }),
    discontinuationReason: text('discontinuation_reason'),
    ociReserveBalance: moneyBigint('oci_reserve_balance').notNull().default(0n),
    currencyCode: varchar('currency_code', { length: 3 }).notNull(),
    ...timestamps(),
  },
  (t) => [
    index('idx_hedge_company').on(t.tenantId, t.companyId),
    index('idx_hedge_instrument').on(t.tenantId, t.hedgingInstrumentId),
    index('idx_hedge_status').on(t.tenantId, t.status),
  ]
);

// ─── erp.deferred_tax_item ────────────────────────────────────────────────

export const deferredTaxItems = erpSchema.table(
  'deferred_tax_item',
  {
    ...pkId(),
    ...tenantCol(),
    companyId: uuid('company_id').notNull(),
    itemName: varchar('item_name', { length: 200 }).notNull(),
    origin: varchar('origin', { length: 50 }).notNull(),
    carryingAmount: moneyBigint('carrying_amount').notNull(),
    taxBase: moneyBigint('tax_base').notNull(),
    temporaryDifference: moneyBigint('temporary_difference').notNull(),
    taxRateBps: integer('tax_rate_bps').notNull(),
    deferredTaxAsset: moneyBigint('deferred_tax_asset').notNull().default(0n),
    deferredTaxLiability: moneyBigint('deferred_tax_liability').notNull().default(0n),
    isRecognized: boolean('is_recognized').notNull().default(true),
    currencyCode: varchar('currency_code', { length: 3 }).notNull(),
    periodId: uuid('period_id').notNull(),
    ...timestamps(),
  },
  (t) => [
    index('idx_deferred_tax_company').on(t.tenantId, t.companyId),
    index('idx_deferred_tax_period').on(t.tenantId, t.periodId),
  ]
);

// ─── erp.tp_policy ────────────────────────────────────────────────────────

export const tpPolicies = erpSchema.table(
  'tp_policy',
  {
    ...pkId(),
    ...tenantCol(),
    companyId: uuid('company_id').notNull(),
    policyName: varchar('policy_name', { length: 200 }).notNull(),
    method: varchar('method', { length: 30 }).notNull(),
    benchmarkLowBps: integer('benchmark_low_bps').notNull(),
    benchmarkMedianBps: integer('benchmark_median_bps').notNull(),
    benchmarkHighBps: integer('benchmark_high_bps').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    ...timestamps(),
  },
  (t) => [index('idx_tp_policy_company').on(t.tenantId, t.companyId)]
);

// ═══════════════════════════════════════════════════════════════════════════
// Gap remediation tables — 0006
// ═══════════════════════════════════════════════════════════════════════════

// ─── erp.payment_terms_line ───────────────────────────────────────────────
// Multi-installment payment schedule lines (AP-05)

export const paymentTermsLines = erpSchema.table(
  'payment_terms_line',
  {
    ...pkId(),
    ...tenantCol(),
    templateId: uuid('template_id').notNull(),
    lineNumber: smallint('line_number').notNull(),
    dueDays: smallint('due_days').notNull(),
    percentageOfTotal: smallint('percentage_of_total').notNull(),
    discountPercentBps: integer('discount_percent_bps').notNull().default(0),
    discountDays: smallint('discount_days').notNull().default(0),
    ...timestamps(),
  },
  (t) => [
    index('idx_payment_terms_line_template').on(t.tenantId, t.templateId),
    uniqueIndex('uq_payment_terms_line_order').on(t.tenantId, t.templateId, t.lineNumber),
  ]
);

// ─── erp.asset_component ─────────────────────────────────────────────────
// Component accounting for fixed assets (FA-04)

export const assetComponents = erpSchema.table(
  'asset_component',
  {
    ...pkId(),
    ...tenantCol(),
    assetId: uuid('asset_id').notNull(),
    componentName: varchar('component_name', { length: 200 }).notNull(),
    acquisitionCost: moneyBigint('acquisition_cost').notNull(),
    residualValue: moneyBigint('residual_value').notNull().default(0n),
    usefulLifeMonths: smallint('useful_life_months').notNull(),
    depreciationMethod: depreciationMethodEnum('depreciation_method').notNull(),
    accumulatedDepreciation: moneyBigint('accumulated_depreciation').notNull().default(0n),
    netBookValue: moneyBigint('net_book_value').notNull(),
    currencyCode: varchar('currency_code', { length: 3 }).notNull().default('USD'),
    ...timestamps(),
  },
  (t) => [index('idx_asset_component_asset').on(t.tenantId, t.assetId)]
);

// ─── erp.accounting_event ────────────────────────────────────────────────
// SLA event store (SLA-01)

export const accountingEvents = erpSchema.table(
  'accounting_event',
  {
    ...pkId(),
    ...tenantCol(),
    companyId: uuid('company_id').notNull(),
    eventType: varchar('event_type', { length: 100 }).notNull(),
    sourceDocumentType: varchar('source_document_type', { length: 50 }).notNull(),
    sourceDocumentId: uuid('source_document_id').notNull(),
    eventDate: timestamp('event_date', { withTimezone: true }).notNull(),
    payload: jsonb('payload').notNull(),
    status: accountingEventStatusEnum('status').notNull().default('PENDING'),
    processedAt: timestamp('processed_at', { withTimezone: true }),
    errorMessage: text('error_message'),
    journalId: uuid('journal_id'),
    ...timestamps(),
  },
  (t) => [
    index('idx_accounting_event_company').on(t.tenantId, t.companyId),
    index('idx_accounting_event_type').on(t.tenantId, t.eventType),
    index('idx_accounting_event_status').on(t.tenantId, t.status),
    index('idx_accounting_event_source').on(t.tenantId, t.sourceDocumentType, t.sourceDocumentId),
  ]
);

// ─── erp.mapping_rule ────────────────────────────────────────────────────
// SLA mapping rules: event → journal template (SLA-02)

export const mappingRules = erpSchema.table(
  'mapping_rule',
  {
    ...pkId(),
    ...tenantCol(),
    companyId: uuid('company_id').notNull(),
    ruleName: varchar('rule_name', { length: 200 }).notNull(),
    eventType: varchar('event_type', { length: 100 }).notNull(),
    priority: smallint('priority').notNull().default(0),
    conditionExpression: text('condition_expression'),
    journalTemplate: jsonb('journal_template').notNull(),
    targetLedgerId: uuid('target_ledger_id'),
    status: mappingRuleStatusEnum('status').notNull().default('DRAFT'),
    versionId: uuid('version_id'),
    ...timestamps(),
  },
  (t) => [
    index('idx_mapping_rule_company').on(t.tenantId, t.companyId),
    index('idx_mapping_rule_event').on(t.tenantId, t.eventType),
    index('idx_mapping_rule_status').on(t.tenantId, t.status),
  ]
);

// ─── erp.mapping_rule_version ────────────────────────────────────────────
// Mapping version lifecycle: draft → published → deprecated (SLA-05)

export const mappingRuleVersions = erpSchema.table(
  'mapping_rule_version',
  {
    ...pkId(),
    ...tenantCol(),
    ruleId: uuid('rule_id').notNull(),
    versionNumber: smallint('version_number').notNull(),
    status: mappingRuleStatusEnum('status').notNull().default('DRAFT'),
    journalTemplate: jsonb('journal_template').notNull(),
    conditionExpression: text('condition_expression'),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    publishedBy: uuid('published_by'),
    deprecatedAt: timestamp('deprecated_at', { withTimezone: true }),
    ...timestamps(),
  },
  (t) => [
    index('idx_mapping_rule_version_rule').on(t.tenantId, t.ruleId),
    uniqueIndex('uq_mapping_rule_version').on(t.tenantId, t.ruleId, t.versionNumber),
  ]
);

// ─── erp.fair_value_measurement ──────────────────────────────────────────
// Fair value hierarchy records (FI-03)

export const fairValueMeasurements = erpSchema.table(
  'fair_value_measurement',
  {
    ...pkId(),
    ...tenantCol(),
    instrumentId: uuid('instrument_id').notNull(),
    measurementDate: timestamp('measurement_date', { withTimezone: true }).notNull(),
    fairValueLevel: fairValueLevelEnum('fair_value_level').notNull(),
    fairValue: moneyBigint('fair_value').notNull(),
    previousFairValue: moneyBigint('previous_fair_value'),
    valuationMethod: varchar('valuation_method', { length: 100 }),
    currencyCode: varchar('currency_code', { length: 3 }).notNull(),
    gainOrLoss: moneyBigint('gain_or_loss'),
    isRecognizedInPL: boolean('is_recognized_in_pl').notNull().default(true),
    journalId: uuid('journal_id'),
    ...timestamps(),
  },
  (t) => [
    index('idx_fvm_instrument').on(t.tenantId, t.instrumentId),
    index('idx_fvm_date').on(t.tenantId, t.measurementDate),
    index('idx_fvm_level').on(t.tenantId, t.fairValueLevel),
  ]
);

// ─── erp.hedge_effectiveness_test ────────────────────────────────────────
// Hedge effectiveness testing records (HA-02)

export const hedgeEffectivenessTests = erpSchema.table(
  'hedge_effectiveness_test',
  {
    ...pkId(),
    ...tenantCol(),
    hedgeRelationshipId: uuid('hedge_relationship_id').notNull(),
    testDate: timestamp('test_date', { withTimezone: true }).notNull(),
    testMethod: hedgeTestMethodEnum('test_method').notNull(),
    result: hedgeTestResultEnum('result').notNull(),
    effectivenessRatioBps: integer('effectiveness_ratio_bps').notNull(),
    hedgedItemFairValueChange: moneyBigint('hedged_item_fv_change').notNull(),
    hedgingInstrumentFairValueChange: moneyBigint('hedging_instrument_fv_change').notNull(),
    ineffectivePortionAmount: moneyBigint('ineffective_portion_amount').notNull().default(0n),
    currencyCode: varchar('currency_code', { length: 3 }).notNull(),
    notes: text('notes'),
    journalId: uuid('journal_id'),
    ...timestamps(),
  },
  (t) => [
    index('idx_hedge_test_relationship').on(t.tenantId, t.hedgeRelationshipId),
    index('idx_hedge_test_date').on(t.tenantId, t.testDate),
    index('idx_hedge_test_result').on(t.tenantId, t.result),
  ]
);

// ─── erp.tp_benchmark ────────────────────────────────────────────────────
// Transfer pricing benchmarks (TP-02)

export const tpBenchmarks = erpSchema.table(
  'tp_benchmark',
  {
    ...pkId(),
    ...tenantCol(),
    policyId: uuid('policy_id').notNull(),
    benchmarkYear: smallint('benchmark_year').notNull(),
    method: tpMethodEnum('method').notNull(),
    comparableCount: smallint('comparable_count').notNull(),
    interquartileRangeLowBps: integer('interquartile_range_low_bps').notNull(),
    interquartileRangeMedianBps: integer('interquartile_range_median_bps').notNull(),
    interquartileRangeHighBps: integer('interquartile_range_high_bps').notNull(),
    dataSource: varchar('data_source', { length: 200 }),
    notes: text('notes'),
    ...timestamps(),
  },
  (t) => [
    index('idx_tp_benchmark_policy').on(t.tenantId, t.policyId),
    uniqueIndex('uq_tp_benchmark_year').on(t.tenantId, t.policyId, t.benchmarkYear),
  ]
);
