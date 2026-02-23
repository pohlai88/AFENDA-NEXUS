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
