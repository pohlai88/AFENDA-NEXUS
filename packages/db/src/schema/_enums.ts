import { pgEnum } from "drizzle-orm/pg-core";

export const tenantStatusEnum = pgEnum("tenant_status", [
  "ACTIVE",
  "SUSPENDED",
  "DEACTIVATED",
]);

export const journalStatusEnum = pgEnum("journal_status", [
  "DRAFT",
  "POSTED",
  "REVERSED",
  "VOIDED",
]);

export const accountTypeEnum = pgEnum("account_type", [
  "ASSET",
  "LIABILITY",
  "EQUITY",
  "REVENUE",
  "EXPENSE",
]);

export const periodStatusEnum = pgEnum("period_status", [
  "OPEN",
  "CLOSED",
  "LOCKED",
]);

export const documentTypeEnum = pgEnum("document_type", [
  "JOURNAL",
  "INVOICE",
  "PAYMENT",
  "CREDIT_NOTE",
  "DEBIT_NOTE",
  "TRANSFER",
]);

export const icPricingEnum = pgEnum("ic_pricing", [
  "COST",
  "MARKET",
  "TRANSFER_PRICE",
  "AGREED",
]);

export const icSettlementStatusEnum = pgEnum("ic_settlement_status", [
  "PENDING",
  "SETTLED",
  "CANCELLED",
]);

export const icLegSideEnum = pgEnum("ic_leg_side", ["SELLER", "BUYER"]);

export const counterpartyTypeEnum = pgEnum("counterparty_type", [
  "CUSTOMER",
  "VENDOR",
  "BOTH",
]);

export const recurringFrequencyEnum = pgEnum("recurring_frequency", [
  "MONTHLY",
  "QUARTERLY",
  "YEARLY",
]);

export const settlementMethodEnum = pgEnum("settlement_method", [
  "NETTING",
  "CASH",
  "JOURNAL",
]);

export const settlementStatusEnum = pgEnum("settlement_status", [
  "DRAFT",
  "CONFIRMED",
  "CANCELLED",
]);

export const recognitionMethodEnum = pgEnum("recognition_method", [
  "STRAIGHT_LINE",
  "MILESTONE",
  "PERCENTAGE_OF_COMPLETION",
]);

export const contractStatusEnum = pgEnum("contract_status", [
  "ACTIVE",
  "COMPLETED",
  "CANCELLED",
]);

export const reportingStandardEnum = pgEnum("reporting_standard", [
  "IFRS",
  "US_GAAP",
  "LOCAL",
]);

export const apInvoiceStatusEnum = pgEnum("ap_invoice_status", [
  "DRAFT",
  "PENDING_APPROVAL",
  "APPROVED",
  "POSTED",
  "PAID",
  "PARTIALLY_PAID",
  "CANCELLED",
]);

export const paymentRunStatusEnum = pgEnum("payment_run_status", [
  "DRAFT",
  "APPROVED",
  "EXECUTED",
  "CANCELLED",
]);

export const arInvoiceStatusEnum = pgEnum("ar_invoice_status", [
  "DRAFT",
  "PENDING_APPROVAL",
  "APPROVED",
  "POSTED",
  "PAID",
  "PARTIALLY_PAID",
  "WRITTEN_OFF",
  "CANCELLED",
]);

export const dunningRunStatusEnum = pgEnum("dunning_run_status", [
  "DRAFT",
  "APPROVED",
  "SENT",
  "CANCELLED",
]);

export const taxRateTypeEnum = pgEnum("tax_rate_type", [
  "VAT",
  "GST",
  "SALES_TAX",
  "WHT",
  "EXCISE",
  "CUSTOM",
]);

export const jurisdictionLevelEnum = pgEnum("jurisdiction_level", [
  "COUNTRY",
  "STATE",
  "CITY",
  "SPECIAL",
]);

export const taxReturnStatusEnum = pgEnum("tax_return_status", [
  "DRAFT",
  "CALCULATED",
  "FILED",
  "AMENDED",
]);

export const whtCertificateStatusEnum = pgEnum("wht_certificate_status", [
  "DRAFT",
  "ISSUED",
  "CANCELLED",
]);

export const assetStatusEnum = pgEnum("asset_status", [
  "ACTIVE",
  "DISPOSED",
  "FULLY_DEPRECIATED",
  "IMPAIRED",
  "CWIP",
]);

export const depreciationMethodEnum = pgEnum("depreciation_method", [
  "STRAIGHT_LINE",
  "DECLINING_BALANCE",
  "UNITS_OF_PRODUCTION",
]);

export const assetMovementTypeEnum = pgEnum("asset_movement_type", [
  "ACQUISITION",
  "DEPRECIATION",
  "REVALUATION",
  "IMPAIRMENT",
  "DISPOSAL",
  "TRANSFER",
  "CAPITALIZATION",
]);

export const statementFormatEnum = pgEnum("statement_format", [
  "OFX",
  "MT940",
  "CAMT053",
  "CSV",
  "MANUAL",
]);

export const bankLineMatchStatusEnum = pgEnum("bank_line_match_status", [
  "UNMATCHED",
  "AUTO_MATCHED",
  "MANUAL_MATCHED",
  "CONFIRMED",
  "INVESTIGATING",
]);

export const bankMatchTypeEnum = pgEnum("bank_match_type", [
  "AUTO",
  "MANUAL",
]);

export const bankMatchConfidenceEnum = pgEnum("bank_match_confidence", [
  "HIGH",
  "MEDIUM",
  "LOW",
]);

export const reconciliationStatusEnum = pgEnum("reconciliation_status", [
  "IN_PROGRESS",
  "COMPLETED",
  "SIGNED_OFF",
]);

export const creditStatusEnum = pgEnum("credit_status", [
  "ACTIVE",
  "ON_HOLD",
  "SUSPENDED",
  "CLOSED",
]);

export const reviewOutcomeEnum = pgEnum("review_outcome", [
  "APPROVED",
  "REDUCED",
  "SUSPENDED",
  "UNCHANGED",
]);

export const expenseClaimStatusEnum = pgEnum("expense_claim_status", [
  "DRAFT",
  "SUBMITTED",
  "APPROVED",
  "REJECTED",
  "REIMBURSED",
  "CANCELLED",
]);

export const expenseCategoryEnum = pgEnum("expense_category", [
  "TRAVEL",
  "MEALS",
  "ACCOMMODATION",
  "TRANSPORT",
  "SUPPLIES",
  "COMMUNICATION",
  "ENTERTAINMENT",
  "OTHER",
]);

export const projectStatusEnum = pgEnum("project_status", [
  "PLANNING",
  "ACTIVE",
  "ON_HOLD",
  "COMPLETED",
  "CANCELLED",
]);

export const billingTypeEnum = pgEnum("billing_type", [
  "FIXED_FEE",
  "TIME_AND_MATERIALS",
  "MILESTONE",
  "COST_PLUS",
]);

export const costCategoryEnum = pgEnum("cost_category", [
  "LABOR",
  "MATERIALS",
  "SUBCONTRACT",
  "TRAVEL",
  "EQUIPMENT",
  "OVERHEAD",
  "OTHER",
]);

export const billingStatusEnum = pgEnum("billing_status", [
  "DRAFT",
  "INVOICED",
  "PAID",
]);

// ─── Phase 4: Lease enums ─────────────────────────────────────────────────

export const leaseTypeEnum = pgEnum("lease_type", [
  "FINANCE",
  "OPERATING",
]);

export const leaseStatusEnum = pgEnum("lease_status", [
  "DRAFT",
  "ACTIVE",
  "MODIFIED",
  "TERMINATED",
  "EXPIRED",
]);

export const lesseeOrLessorEnum = pgEnum("lessee_or_lessor", [
  "LESSEE",
  "LESSOR",
]);

export const leaseModificationTypeEnum = pgEnum("lease_modification_type", [
  "TERM_EXTENSION",
  "TERM_REDUCTION",
  "PAYMENT_CHANGE",
  "SCOPE_CHANGE",
  "RATE_CHANGE",
]);

// ─── Phase 4: Provision enums ─────────────────────────────────────────────

export const provisionTypeEnum = pgEnum("provision_type", [
  "WARRANTY",
  "RESTRUCTURING",
  "ONEROUS_CONTRACT",
  "DECOMMISSIONING",
  "LEGAL",
  "OTHER",
]);

export const provisionStatusEnum = pgEnum("provision_status", [
  "ACTIVE",
  "PARTIALLY_UTILISED",
  "FULLY_UTILISED",
  "REVERSED",
]);

export const provisionMovementTypeEnum = pgEnum("provision_movement_type", [
  "INITIAL_RECOGNITION",
  "UNWINDING_DISCOUNT",
  "UTILISATION",
  "REVERSAL",
  "REMEASUREMENT",
]);

// ─── Phase 4: Treasury enums ──────────────────────────────────────────────

export const forecastTypeEnum = pgEnum("forecast_type", [
  "RECEIPTS",
  "PAYMENTS",
  "FINANCING",
  "INVESTING",
]);

export const covenantTypeEnum = pgEnum("covenant_type", [
  "DEBT_TO_EQUITY",
  "INTEREST_COVERAGE",
  "CURRENT_RATIO",
  "DEBT_SERVICE_COVERAGE",
  "LEVERAGE",
  "CUSTOM",
]);

export const covenantStatusEnum = pgEnum("covenant_status", [
  "COMPLIANT",
  "WARNING",
  "BREACHED",
]);

export const icLoanStatusEnum = pgEnum("ic_loan_status", [
  "ACTIVE",
  "REPAID",
  "WRITTEN_OFF",
]);

// ─── Phase 5: Cost Accounting enums ───────────────────────────────────────

export const costCenterStatusEnum = pgEnum("cost_center_status", [
  "ACTIVE",
  "INACTIVE",
  "CLOSED",
]);

export const driverTypeEnum = pgEnum("driver_type", [
  "HEADCOUNT",
  "MACHINE_HOURS",
  "DIRECT_LABOR",
  "FLOOR_AREA",
  "REVENUE",
  "UNITS_PRODUCED",
  "CUSTOM",
]);

export const allocationMethodEnum = pgEnum("allocation_method", [
  "DIRECT",
  "STEP_DOWN",
  "RECIPROCAL",
]);

export const allocationRunStatusEnum = pgEnum("allocation_run_status", [
  "DRAFT",
  "RUNNING",
  "COMPLETED",
  "FAILED",
  "REVERSED",
]);

// ─── Phase 6: Consolidation enums ────────────────────────────────────────

export const groupEntityTypeEnum = pgEnum("group_entity_type", [
  "PARENT",
  "SUBSIDIARY",
  "ASSOCIATE",
  "JOINT_VENTURE",
]);

export const goodwillStatusEnum = pgEnum("goodwill_status", [
  "ACTIVE",
  "IMPAIRED",
  "DERECOGNIZED",
]);

// ─── Phase 7: IFRS Specialist enums ──────────────────────────────────────

export const intangibleAssetStatusEnum = pgEnum("intangible_asset_status", [
  "ACTIVE",
  "DISPOSED",
  "FULLY_AMORTIZED",
  "IMPAIRED",
  "IN_DEVELOPMENT",
]);

export const intangibleCategoryEnum = pgEnum("intangible_category", [
  "SOFTWARE",
  "PATENT",
  "TRADEMARK",
  "COPYRIGHT",
  "LICENCE",
  "CUSTOMER_RELATIONSHIP",
  "GOODWILL_RELATED",
  "DEVELOPMENT_COST",
  "OTHER",
]);

export const usefulLifeTypeEnum = pgEnum("useful_life_type", [
  "FINITE",
  "INDEFINITE",
]);

export const instrumentClassificationEnum = pgEnum("instrument_classification", [
  "AMORTIZED_COST",
  "FVOCI",
  "FVTPL",
]);

export const instrumentTypeEnum = pgEnum("instrument_type", [
  "DEBT_HELD",
  "DEBT_ISSUED",
  "EQUITY_INVESTMENT",
  "DERIVATIVE",
  "LOAN_RECEIVABLE",
  "TRADE_RECEIVABLE",
]);

export const fairValueLevelEnum = pgEnum("fair_value_level", [
  "LEVEL_1",
  "LEVEL_2",
  "LEVEL_3",
]);

export const hedgeTypeEnum = pgEnum("hedge_type", [
  "FAIR_VALUE",
  "CASH_FLOW",
  "NET_INVESTMENT",
]);

export const hedgeStatusEnum = pgEnum("hedge_status", [
  "DESIGNATED",
  "ACTIVE",
  "DISCONTINUED",
  "REBALANCED",
]);

// ─── Gap remediation enums ─────────────────────────────────────────────────

export const accountingEventStatusEnum = pgEnum("accounting_event_status", [
  "PENDING",
  "PROCESSED",
  "FAILED",
  "SKIPPED",
]);

export const mappingRuleStatusEnum = pgEnum("mapping_rule_status", [
  "DRAFT",
  "PUBLISHED",
  "DEPRECATED",
]);

export const hedgeTestMethodEnum = pgEnum("hedge_test_method", [
  "DOLLAR_OFFSET",
  "REGRESSION",
  "CRITICAL_TERMS",
]);

export const hedgeTestResultEnum = pgEnum("hedge_test_result", [
  "HIGHLY_EFFECTIVE",
  "EFFECTIVE",
  "INEFFECTIVE",
]);

export const tpMethodEnum = pgEnum("tp_method", [
  "CUP",
  "RESALE_PRICE",
  "COST_PLUS",
  "TNMM",
  "PROFIT_SPLIT",
]);
