/**
 * @afenda/contracts — Zod DTOs shared between frontend and backend.
 *
 * Pure schema definitions. No DB, no HTTP handlers, no OpenAPI generation (that lives in tools/).
 */
import { z } from "zod";

// ─── Common Schemas ─────────────────────────────────────────────────────────

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type Pagination = z.infer<typeof PaginationSchema>;

export const IdParamSchema = z.object({
  id: z.string().uuid(),
});
export type IdParam = z.infer<typeof IdParamSchema>;

// ─── Finance Schemas (P0) ───────────────────────────────────────────────────

export const JournalStatusSchema = z.enum([
  "DRAFT",
  "POSTED",
  "REVERSED",
  "VOIDED",
]);
export type JournalStatus = z.infer<typeof JournalStatusSchema>;

export const CreateJournalSchema = z.object({
  companyId: z.string().uuid(),
  ledgerId: z.string().uuid(),
  description: z.string().min(1).max(500),
  date: z.string().date(),
  lines: z
    .array(
      z.object({
        accountCode: z.string().min(1),
        debit: z.coerce.number().nonnegative(),
        credit: z.coerce.number().nonnegative(),
        currency: z.string().length(3),
        description: z.string().optional(),
      }),
    )
    .min(2),
});
export type CreateJournal = z.infer<typeof CreateJournalSchema>;

export const PostJournalSchema = z.object({
  journalId: z.string().uuid(),
  idempotencyKey: z.string().uuid(),
});
export type PostJournal = z.infer<typeof PostJournalSchema>;

export const JournalListQuerySchema = PaginationSchema.extend({
  periodId: z.string().uuid(),
  status: JournalStatusSchema.optional(),
});
export type JournalListQuery = z.infer<typeof JournalListQuerySchema>;

// ─── Recurring Template Schemas (P3) ────────────────────────────────────────

export const RecurringFrequencySchema = z.enum(["MONTHLY", "QUARTERLY", "YEARLY"]);
export type RecurringFrequency = z.infer<typeof RecurringFrequencySchema>;

export const CreateRecurringTemplateSchema = z.object({
  companyId: z.string().uuid(),
  ledgerId: z.string().uuid(),
  description: z.string().min(1).max(500),
  lines: z
    .array(
      z.object({
        accountCode: z.string().min(1),
        debit: z.coerce.number().nonnegative(),
        credit: z.coerce.number().nonnegative(),
        description: z.string().optional(),
      }),
    )
    .min(2),
  frequency: RecurringFrequencySchema,
  nextRunDate: z.coerce.date(),
});
export type CreateRecurringTemplate = z.infer<typeof CreateRecurringTemplateSchema>;

// ─── Budget Schemas (P3) ────────────────────────────────────────────────────

export const UpsertBudgetEntrySchema = z.object({
  companyId: z.string().uuid(),
  ledgerId: z.string().uuid(),
  accountId: z.string().uuid(),
  periodId: z.string().uuid(),
  budgetAmount: z.coerce.number().nonnegative(),
});
export type UpsertBudgetEntry = z.infer<typeof UpsertBudgetEntrySchema>;

// ─── Reason Body Schema (AIS A-09) ─────────────────────────────────────────

export const ReasonBodySchema = z.object({
  reason: z.string().min(1, "reason is required").max(1000),
});
export type ReasonBody = z.infer<typeof ReasonBodySchema>;

export const OptionalReasonBodySchema = z.object({
  reason: z.string().max(1000).optional(),
});
export type OptionalReasonBody = z.infer<typeof OptionalReasonBodySchema>;

export const BudgetVarianceQuerySchema = z.object({
  ledgerId: z.string().uuid(),
  periodId: z.string().uuid(),
});
export type BudgetVarianceQuery = z.infer<typeof BudgetVarianceQuerySchema>;

// ─── IC Transaction Schemas (GAP-07) ────────────────────────────────────────

const JournalLineInputSchema = z.object({
  accountId: z.string().uuid(),
  debit: z.string().regex(/^\d+$/, "debit must be a non-negative integer string"),
  credit: z.string().regex(/^\d+$/, "credit must be a non-negative integer string"),
});

export const CreateIcTransactionSchema = z.object({
  agreementId: z.string().uuid(),
  sourceLedgerId: z.string().uuid(),
  mirrorLedgerId: z.string().uuid(),
  fiscalPeriodId: z.string().uuid(),
  description: z.string().min(1).max(500),
  postingDate: z.string().date(),
  currency: z.string().length(3),
  sourceLines: z.array(JournalLineInputSchema).min(1),
  mirrorLines: z.array(JournalLineInputSchema).min(1),
});
export type CreateIcTransaction = z.infer<typeof CreateIcTransactionSchema>;

// ─── IC Settlement Schemas (GAP-07) ─────────────────────────────────────────

export const SettlementMethodSchema = z.enum(["NETTING", "CASH", "JOURNAL"]);

export const CreateIcSettlementSchema = z.object({
  sellerCompanyId: z.string().uuid(),
  buyerCompanyId: z.string().uuid(),
  documentIds: z.array(z.string().uuid()).min(1),
  settlementMethod: SettlementMethodSchema,
  settlementAmount: z.string().regex(/^\d+$/, "settlementAmount must be a non-negative integer string"),
  currency: z.string().length(3),
  fxGainLoss: z.string().regex(/^-?\d+$/, "fxGainLoss must be an integer string"),
  reason: z.string().max(1000).optional(),
});
export type CreateIcSettlement = z.infer<typeof CreateIcSettlementSchema>;

// ─── Revenue Contract Schemas (GAP-07) ──────────────────────────────────────

export const RecognitionMethodSchema = z.enum(["STRAIGHT_LINE", "MILESTONE", "PERCENTAGE_OF_COMPLETION"]);

export const CreateRevenueContractSchema = z.object({
  companyId: z.string().uuid(),
  contractNumber: z.string().min(1).max(50),
  customerName: z.string().min(1).max(200),
  totalAmount: z.string().regex(/^\d+$/, "totalAmount must be a non-negative integer string"),
  currency: z.string().length(3),
  recognitionMethod: RecognitionMethodSchema,
  startDate: z.string().date(),
  endDate: z.string().date(),
  deferredAccountId: z.string().uuid(),
  revenueAccountId: z.string().uuid(),
});
export type CreateRevenueContract = z.infer<typeof CreateRevenueContractSchema>;

export const RecognizeRevenueSchema = z.object({
  periodId: z.string().uuid(),
  ledgerId: z.string().uuid(),
});
export type RecognizeRevenue = z.infer<typeof RecognizeRevenueSchema>;

// ─── Year-End Close Schema (GAP-07) ─────────────────────────────────────────

export const CloseYearSchema = z.object({
  ledgerId: z.string().uuid(),
  fiscalYear: z.string().min(4).max(4),
  retainedEarningsAccountId: z.string().uuid(),
  periodIds: z.array(z.string().uuid()).min(1),
});
export type CloseYear = z.infer<typeof CloseYearSchema>;

// ─── Report Query Schemas (GAP-07) ──────────────────────────────────────────

export const BalanceSheetQuerySchema = z.object({
  ledgerId: z.string().uuid(),
  periodId: z.string().uuid(),
});
export type BalanceSheetQuery = z.infer<typeof BalanceSheetQuerySchema>;

export const IncomeStatementQuerySchema = z.object({
  ledgerId: z.string().uuid(),
  fromPeriodId: z.string().uuid(),
  toPeriodId: z.string().uuid(),
});
export type IncomeStatementQuery = z.infer<typeof IncomeStatementQuerySchema>;

export const CashFlowQuerySchema = z.object({
  ledgerId: z.string().uuid(),
  fromPeriodId: z.string().uuid(),
  toPeriodId: z.string().uuid(),
});
export type CashFlowQuery = z.infer<typeof CashFlowQuerySchema>;

export const VarianceAlertsQuerySchema = z.object({
  ledgerId: z.string().uuid(),
  periodId: z.string().uuid(),
  warningPct: z.coerce.number().nonnegative().default(10),
  criticalPct: z.coerce.number().nonnegative().default(25),
});
export type VarianceAlertsQuery = z.infer<typeof VarianceAlertsQuerySchema>;

export const ComparativeBalanceSheetQuerySchema = z.object({
  ledgerId: z.string().uuid(),
  currentPeriodId: z.string().uuid(),
  priorPeriodId: z.string().uuid(),
});
export type ComparativeBalanceSheetQuery = z.infer<typeof ComparativeBalanceSheetQuerySchema>;

export const ComparativeIncomeStatementQuerySchema = z.object({
  ledgerId: z.string().uuid(),
  currentFromPeriodId: z.string().uuid(),
  currentToPeriodId: z.string().uuid(),
  priorFromPeriodId: z.string().uuid(),
  priorToPeriodId: z.string().uuid(),
});
export type ComparativeIncomeStatementQuery = z.infer<typeof ComparativeIncomeStatementQuerySchema>;

export const IcAgingQuerySchema = z.object({
  currency: z.string().length(3).default("USD"),
  asOfDate: z.string().date().optional(),
});
export type IcAgingQuery = z.infer<typeof IcAgingQuerySchema>;

// ─── Trial Balance Query Schema (GAP-07) ────────────────────────────────────

export const TrialBalanceQuerySchema = z.object({
  ledgerId: z.string().uuid(),
  year: z.string().min(4).max(4),
  period: z.coerce.number().int().min(1).max(13).optional(),
});
export type TrialBalanceQuery = z.infer<typeof TrialBalanceQuerySchema>;

// ─── FX Rate Query Schema (GAP-07) ──────────────────────────────────────────

export const FxRateQuerySchema = z.object({
  from: z.string().length(3),
  to: z.string().length(3),
  date: z.string().date(),
});
export type FxRateQuery = z.infer<typeof FxRateQuerySchema>;

// ─── Classification Rule Query Schema (GAP-07) ─────────────────────────────

export const ReportingStandardSchema = z.enum(["IFRS", "US_GAAP", "LOCAL"]);

export const ClassificationRuleQuerySchema = z.object({
  standard: ReportingStandardSchema.optional(),
  version: z.coerce.number().int().positive().optional(),
});
export type ClassificationRuleQuery = z.infer<typeof ClassificationRuleQuerySchema>;

// ─── Budget Entry List Query Schema (GAP-07) ────────────────────────────────

export const BudgetEntryListQuerySchema = PaginationSchema.extend({
  ledgerId: z.string().uuid(),
  periodId: z.string().uuid(),
});
export type BudgetEntryListQuery = z.infer<typeof BudgetEntryListQuerySchema>;

// ─── Consolidation Schema (GAP-11) ─────────────────────────────────────────

export const ConsolidationQuerySchema = z.object({
  groupLedgerId: z.string().uuid(),
  subsidiaryLedgerIds: z.array(z.string().uuid()).min(1),
  fiscalYear: z.string().min(4).max(4),
  fiscalPeriod: z.coerce.number().int().min(1).max(13).optional(),
  asOfDate: z.string().date(),
});

// ─── AP Schemas (Phase 1a) ─────────────────────────────────────────────────

export const ApInvoiceStatusSchema = z.enum([
  "DRAFT",
  "PENDING_APPROVAL",
  "APPROVED",
  "POSTED",
  "PAID",
  "PARTIALLY_PAID",
  "CANCELLED",
]);
export type ApInvoiceStatus = z.infer<typeof ApInvoiceStatusSchema>;

export const CreateApInvoiceLineSchema = z.object({
  accountId: z.string().uuid(),
  description: z.string().max(500).nullable().optional(),
  quantity: z.coerce.number().int().positive().default(1),
  unitPrice: z.coerce.number().nonnegative(),
  amount: z.coerce.number().nonnegative(),
  taxAmount: z.coerce.number().nonnegative().default(0),
});

export const CreateApInvoiceSchema = z.object({
  companyId: z.string().uuid(),
  supplierId: z.string().uuid(),
  ledgerId: z.string().uuid(),
  invoiceNumber: z.string().min(1).max(50),
  supplierRef: z.string().max(100).nullable().optional(),
  invoiceDate: z.string().date(),
  dueDate: z.string().date(),
  currencyCode: z.string().length(3),
  description: z.string().max(500).nullable().optional(),
  poRef: z.string().max(50).nullable().optional(),
  receiptRef: z.string().max(50).nullable().optional(),
  paymentTermsId: z.string().uuid().nullable().optional(),
  lines: z.array(CreateApInvoiceLineSchema).min(1),
});
export type CreateApInvoice = z.infer<typeof CreateApInvoiceSchema>;

export const PostApInvoiceSchema = z.object({
  fiscalPeriodId: z.string().uuid(),
  apAccountId: z.string().uuid(),
});
export type PostApInvoice = z.infer<typeof PostApInvoiceSchema>;

export const ApInvoiceListQuerySchema = PaginationSchema.extend({
  status: ApInvoiceStatusSchema.optional(),
  supplierId: z.string().uuid().optional(),
});
export type ApInvoiceListQuery = z.infer<typeof ApInvoiceListQuerySchema>;

export const ApAgingQuerySchema = z.object({
  asOfDate: z.string().date().optional(),
});
export type ApAgingQuery = z.infer<typeof ApAgingQuerySchema>;

export const CreateDebitMemoSchema = z.object({
  originalInvoiceId: z.string().uuid(),
  reason: z.string().min(1).max(500),
});
export type CreateDebitMemo = z.infer<typeof CreateDebitMemoSchema>;

export const PaymentRunStatusSchema = z.enum([
  "DRAFT",
  "APPROVED",
  "EXECUTED",
  "CANCELLED",
]);
export type PaymentRunStatus = z.infer<typeof PaymentRunStatusSchema>;

export const CreatePaymentRunSchema = z.object({
  companyId: z.string().uuid(),
  runDate: z.string().date(),
  cutoffDate: z.string().date(),
  currencyCode: z.string().length(3),
});
export type CreatePaymentRun = z.infer<typeof CreatePaymentRunSchema>;

export const AddPaymentRunItemSchema = z.object({
  invoiceId: z.string().uuid(),
  supplierId: z.string().uuid(),
  amount: z.coerce.number().nonnegative(),
  discountAmount: z.coerce.number().nonnegative().default(0),
  netAmount: z.coerce.number().nonnegative(),
});
export type AddPaymentRunItem = z.infer<typeof AddPaymentRunItemSchema>;

export const PaymentRunListQuerySchema = PaginationSchema.extend({
  status: PaymentRunStatusSchema.optional(),
});
export type PaymentRunListQuery = z.infer<typeof PaymentRunListQuerySchema>;

// ─── AR Schemas ─────────────────────────────────────────────────────────────

export const ArInvoiceStatusSchema = z.enum([
  "DRAFT",
  "PENDING_APPROVAL",
  "APPROVED",
  "POSTED",
  "PAID",
  "PARTIALLY_PAID",
  "WRITTEN_OFF",
  "CANCELLED",
]);
export type ArInvoiceStatus = z.infer<typeof ArInvoiceStatusSchema>;

export const CreateArInvoiceLineSchema = z.object({
  accountId: z.string().uuid(),
  description: z.string().max(500).nullable().optional(),
  quantity: z.coerce.number().int().positive().default(1),
  unitPrice: z.coerce.number().nonnegative(),
  amount: z.coerce.number().nonnegative(),
  taxAmount: z.coerce.number().nonnegative().default(0),
});

export const CreateArInvoiceSchema = z.object({
  companyId: z.string().uuid(),
  customerId: z.string().uuid(),
  ledgerId: z.string().uuid(),
  invoiceNumber: z.string().min(1).max(50),
  customerRef: z.string().max(100).nullable().optional(),
  invoiceDate: z.string().date(),
  dueDate: z.string().date(),
  currencyCode: z.string().length(3),
  description: z.string().max(500).nullable().optional(),
  paymentTermsId: z.string().uuid().nullable().optional(),
  lines: z.array(CreateArInvoiceLineSchema).min(1),
});
export type CreateArInvoice = z.infer<typeof CreateArInvoiceSchema>;

export const PostArInvoiceSchema = z.object({
  fiscalPeriodId: z.string().uuid(),
  arAccountId: z.string().uuid(),
});
export type PostArInvoice = z.infer<typeof PostArInvoiceSchema>;

export const ArInvoiceListQuerySchema = PaginationSchema.extend({
  status: ArInvoiceStatusSchema.optional(),
  customerId: z.string().uuid().optional(),
});
export type ArInvoiceListQuery = z.infer<typeof ArInvoiceListQuerySchema>;

export const ArAgingQuerySchema = z.object({
  asOfDate: z.string().date().optional(),
});
export type ArAgingQuery = z.infer<typeof ArAgingQuerySchema>;

export const CreateCreditNoteSchema = z.object({
  originalInvoiceId: z.string().uuid(),
  reason: z.string().min(1).max(500),
});
export type CreateCreditNote = z.infer<typeof CreateCreditNoteSchema>;

export const WriteOffInvoiceSchema = z.object({
  reason: z.string().min(1).max(500),
});
export type WriteOffInvoice = z.infer<typeof WriteOffInvoiceSchema>;

export const AllocatePaymentSchema = z.object({
  customerId: z.string().uuid(),
  paymentDate: z.string().date(),
  paymentRef: z.string().min(1).max(100),
  paymentAmount: z.coerce.number().positive(),
  currencyCode: z.string().length(3),
});
export type AllocatePayment = z.infer<typeof AllocatePaymentSchema>;

export const RunDunningSchema = z.object({
  runDate: z.string().date(),
});
export type RunDunning = z.infer<typeof RunDunningSchema>;

// ─── Phase 7: Financial Instruments (IFRS 9) ───────────────────────────────
export const InstrumentTypeSchema = z.enum([
  "DEBT_HELD",
  "DEBT_ISSUED",
  "EQUITY_INVESTMENT",
  "DERIVATIVE",
  "LOAN_RECEIVABLE",
  "TRADE_RECEIVABLE",
]);
export type InstrumentType = z.infer<typeof InstrumentTypeSchema>;

export const InstrumentClassificationSchema = z.enum([
  "AMORTIZED_COST",
  "FVOCI",
  "FVTPL",
]);
export type InstrumentClassification = z.infer<typeof InstrumentClassificationSchema>;

export const FairValueLevelSchema = z.enum(["LEVEL_1", "LEVEL_2", "LEVEL_3"]);
export type FairValueLevel = z.infer<typeof FairValueLevelSchema>;

export const CreateFinancialInstrumentSchema = z.object({
  companyId: z.string().uuid(),
  instrumentType: InstrumentTypeSchema,
  classification: InstrumentClassificationSchema,
  fairValueLevel: FairValueLevelSchema.nullable().optional(),
  nominalAmount: z.string().regex(/^\d+$/, "nominalAmount must be a non-negative integer string"),
  carryingAmount: z.string().regex(/^\d+$/, "carryingAmount must be a non-negative integer string"),
  fairValue: z.string().regex(/^-?\d+$/, "fairValue must be an integer string").nullable().optional(),
  effectiveInterestRateBps: z.coerce.number().int().nonnegative(),
  contractualRateBps: z.coerce.number().int().nonnegative(),
  currencyCode: z.string().length(3),
  maturityDate: z.string().date().nullable().optional(),
  counterpartyId: z.string().uuid(),
  glAccountId: z.string().uuid(),
});
export type CreateFinancialInstrument = z.infer<typeof CreateFinancialInstrumentSchema>;

export const FinInstrumentListQuerySchema = PaginationSchema.extend({
  classification: InstrumentClassificationSchema.optional(),
  companyId: z.string().uuid().optional(),
});
export type FinInstrumentListQuery = z.infer<typeof FinInstrumentListQuerySchema>;

// ─── Phase 7: Hedge Accounting (IFRS 9 §6) ─────────────────────────────────
export const HedgeTypeSchema = z.enum(["FAIR_VALUE", "CASH_FLOW", "NET_INVESTMENT"]);
export type HedgeType = z.infer<typeof HedgeTypeSchema>;

export const HedgeStatusSchema = z.enum(["DESIGNATED", "ACTIVE", "DISCONTINUED", "REBALANCED"]);
export type HedgeStatus = z.infer<typeof HedgeStatusSchema>;

export const CreateHedgeRelationshipSchema = z.object({
  companyId: z.string().uuid(),
  hedgeType: HedgeTypeSchema,
  hedgingInstrumentId: z.string().uuid(),
  hedgedItemId: z.string().uuid(),
  hedgedRisk: z.string().min(1).max(100),
  hedgeRatio: z.coerce.number().int().positive().default(10000),
  designationDate: z.string().date(),
  ociReserveBalance: z.string().regex(/^-?\d+$/, "ociReserveBalance must be an integer string").default("0"),
  currencyCode: z.string().length(3),
});
export type CreateHedgeRelationship = z.infer<typeof CreateHedgeRelationshipSchema>;

export const HedgeTestMethodSchema = z.enum(["DOLLAR_OFFSET", "REGRESSION", "CRITICAL_TERMS"]);
export type HedgeTestMethod = z.infer<typeof HedgeTestMethodSchema>;

export const HedgeTestResultSchema = z.enum(["HIGHLY_EFFECTIVE", "EFFECTIVE", "INEFFECTIVE"]);
export type HedgeTestResult = z.infer<typeof HedgeTestResultSchema>;

export const CreateHedgeEffectivenessTestSchema = z.object({
  testDate: z.string().date(),
  testMethod: HedgeTestMethodSchema,
  result: HedgeTestResultSchema,
  effectivenessRatioBps: z.coerce.number().int().nonnegative(),
  hedgedItemFairValueChange: z.string().regex(/^-?\d+$/, "hedgedItemFairValueChange must be an integer string"),
  hedgingInstrumentFairValueChange: z.string().regex(/^-?\d+$/, "hedgingInstrumentFairValueChange must be an integer string"),
  ineffectivePortionAmount: z.string().regex(/^-?\d+$/, "ineffectivePortionAmount must be an integer string").default("0"),
  currencyCode: z.string().length(3),
  notes: z.string().max(2000).nullable().optional(),
  journalId: z.string().uuid().nullable().optional(),
});
export type CreateHedgeEffectivenessTest = z.infer<typeof CreateHedgeEffectivenessTestSchema>;

// ─── Phase 7: Intangible Assets (IAS 38) ────────────────────────────────────
export const IntangibleCategorySchema = z.enum([
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
export type IntangibleCategory = z.infer<typeof IntangibleCategorySchema>;

export const IntangibleAssetStatusSchema = z.enum([
  "ACTIVE",
  "DISPOSED",
  "FULLY_AMORTIZED",
  "IMPAIRED",
  "IN_DEVELOPMENT",
]);
export type IntangibleAssetStatus = z.infer<typeof IntangibleAssetStatusSchema>;

export const UsefulLifeTypeSchema = z.enum(["FINITE", "INDEFINITE"]);
export type UsefulLifeType = z.infer<typeof UsefulLifeTypeSchema>;

export const CreateIntangibleAssetSchema = z.object({
  companyId: z.string().uuid(),
  assetNumber: z.string().min(1).max(30),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).nullable().optional(),
  category: IntangibleCategorySchema,
  usefulLifeType: UsefulLifeTypeSchema,
  acquisitionDate: z.string().date(),
  acquisitionCost: z.string().regex(/^\d+$/, "acquisitionCost must be a non-negative integer string"),
  residualValue: z.string().regex(/^\d+$/, "residualValue must be a non-negative integer string").default("0"),
  usefulLifeMonths: z.coerce.number().int().positive().nullable().optional(),
  netBookValue: z.string().regex(/^\d+$/, "netBookValue must be a non-negative integer string"),
  currencyCode: z.string().length(3),
  glAccountId: z.string().uuid(),
  amortizationAccountId: z.string().uuid(),
  accumulatedAmortizationAccountId: z.string().uuid(),
  isInternallyGenerated: z.boolean().default(false),
});
export type CreateIntangibleAsset = z.infer<typeof CreateIntangibleAssetSchema>;

// ─── Phase 7: Deferred Tax (IAS 12) ────────────────────────────────────────
export const CreateDeferredTaxItemSchema = z.object({
  companyId: z.string().uuid(),
  itemName: z.string().min(1).max(200),
  origin: z.string().min(1).max(50),
  carryingAmount: z.string().regex(/^-?\d+$/, "carryingAmount must be an integer string"),
  taxBase: z.string().regex(/^-?\d+$/, "taxBase must be an integer string"),
  temporaryDifference: z.string().regex(/^-?\d+$/, "temporaryDifference must be an integer string"),
  taxRateBps: z.coerce.number().int().nonnegative(),
  deferredTaxAsset: z.string().regex(/^\d+$/, "deferredTaxAsset must be a non-negative integer string").default("0"),
  deferredTaxLiability: z.string().regex(/^\d+$/, "deferredTaxLiability must be a non-negative integer string").default("0"),
  isRecognized: z.boolean().default(true),
  currencyCode: z.string().length(3),
  periodId: z.string().uuid(),
});
export type CreateDeferredTaxItem = z.infer<typeof CreateDeferredTaxItemSchema>;

// ─── Phase 7: Transfer Pricing (OECD Guidelines) ───────────────────────────
export const TpMethodSchema = z.enum(["CUP", "RESALE_PRICE", "COST_PLUS", "TNMM", "PROFIT_SPLIT"]);
export type TpMethodContract = z.infer<typeof TpMethodSchema>;

export const CreateTpPolicySchema = z.object({
  companyId: z.string().uuid(),
  policyName: z.string().min(1).max(200),
  method: z.string().min(1).max(30),
  benchmarkLowBps: z.coerce.number().int().nonnegative(),
  benchmarkMedianBps: z.coerce.number().int().nonnegative(),
  benchmarkHighBps: z.coerce.number().int().nonnegative(),
});
export type CreateTpPolicy = z.infer<typeof CreateTpPolicySchema>;

export const CreateTpBenchmarkSchema = z.object({
  benchmarkYear: z.coerce.number().int().min(1900).max(2200),
  method: TpMethodSchema,
  comparableCount: z.coerce.number().int().nonnegative(),
  interquartileRangeLowBps: z.coerce.number().int().nonnegative(),
  interquartileRangeMedianBps: z.coerce.number().int().nonnegative(),
  interquartileRangeHighBps: z.coerce.number().int().nonnegative(),
  dataSource: z.string().max(200).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
});
export type CreateTpBenchmark = z.infer<typeof CreateTpBenchmarkSchema>;
