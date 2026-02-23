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
