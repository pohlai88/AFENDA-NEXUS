/**
 * @afenda/contracts — Zod DTOs shared between frontend and backend.
 *
 * Pure schema definitions. No DB, no HTTP handlers, no OpenAPI generation (that lives in tools/).
 */
import { z } from 'zod';

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

export const JournalStatusSchema = z.enum(['DRAFT', 'POSTED', 'REVERSED', 'VOIDED']);
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
      })
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
  periodId: z.string().uuid().optional(),
  status: JournalStatusSchema.optional(),
});
export type JournalListQuery = z.infer<typeof JournalListQuerySchema>;

// ─── Recurring Template Schemas (P3) ────────────────────────────────────────

export const RecurringFrequencySchema = z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY']);
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
      })
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
  reason: z.string().min(1, 'reason is required').max(1000),
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
  debit: z.string().regex(/^\d+$/, 'debit must be a non-negative integer string'),
  credit: z.string().regex(/^\d+$/, 'credit must be a non-negative integer string'),
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

export const SettlementMethodSchema = z.enum(['NETTING', 'CASH', 'JOURNAL']);

export const CreateIcSettlementSchema = z.object({
  sellerCompanyId: z.string().uuid(),
  buyerCompanyId: z.string().uuid(),
  documentIds: z.array(z.string().uuid()).min(1),
  settlementMethod: SettlementMethodSchema,
  settlementAmount: z
    .string()
    .regex(/^\d+$/, 'settlementAmount must be a non-negative integer string'),
  currency: z.string().length(3),
  fxGainLoss: z.string().regex(/^-?\d+$/, 'fxGainLoss must be an integer string'),
  reason: z.string().max(1000).optional(),
});
export type CreateIcSettlement = z.infer<typeof CreateIcSettlementSchema>;

// ─── Revenue Contract Schemas (GAP-07) ──────────────────────────────────────

export const RecognitionMethodSchema = z.enum([
  'STRAIGHT_LINE',
  'MILESTONE',
  'PERCENTAGE_OF_COMPLETION',
]);

export const CreateRevenueContractSchema = z.object({
  companyId: z.string().uuid(),
  contractNumber: z.string().min(1).max(50),
  customerName: z.string().min(1).max(200),
  totalAmount: z.string().regex(/^\d+$/, 'totalAmount must be a non-negative integer string'),
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

export const EquityComponentEnum = z.enum([
  'SHARE_CAPITAL',
  'SHARE_PREMIUM',
  'RETAINED_EARNINGS',
  'OCI_RESERVE',
  'TRANSLATION_RESERVE',
  'REVALUATION_SURPLUS',
  'HEDGING_RESERVE',
  'TREASURY_SHARES',
  'NCI',
]);

export const EquityMovementSchema = z.object({
  component: EquityComponentEnum,
  openingBalance: z.coerce.bigint(),
  profitOrLoss: z.coerce.bigint(),
  otherComprehensiveIncome: z.coerce.bigint(),
  dividendsDeclared: z.coerce.bigint(),
  sharesIssued: z.coerce.bigint(),
  sharesRepurchased: z.coerce.bigint(),
  transfersBetweenReserves: z.coerce.bigint(),
  otherMovements: z.coerce.bigint(),
});
export type EquityMovementDto = z.infer<typeof EquityMovementSchema>;

export const EquityStatementBodySchema = z.object({
  ledgerId: z.string().uuid(),
  periodId: z.string().uuid(),
  movements: z.array(EquityMovementSchema).min(1),
});
export type EquityStatementBody = z.infer<typeof EquityStatementBodySchema>;

// ─── Fiscal Year Generator Schema (GAP-G2) ──────────────────────────────────

export const PeriodPatternEnum = z.enum(['MONTHLY', '4-4-5', '4-5-4', '5-4-4']);

export const FiscalYearBodySchema = z.object({
  startMonth: z.coerce.number().int().min(1).max(12),
  startYear: z.coerce.number().int().min(1900).max(2200),
  companyId: z.string().uuid(),
  pattern: PeriodPatternEnum.optional(),
  namePrefix: z.string().optional(),
});
export type FiscalYearBody = z.infer<typeof FiscalYearBodySchema>;

// ─── Opening Balance Import Schema (GAP-D3) ─────────────────────────────────

export const OpeningBalanceLineSchema = z.object({
  accountCode: z.string().min(1),
  accountName: z.string().min(1),
  debit: z.coerce.bigint(),
  credit: z.coerce.bigint(),
  sourceSystemRef: z.string().optional(),
});

export const OpeningBalanceBodySchema = z.object({
  ledgerId: z.string().uuid(),
  periodId: z.string().uuid(),
  postingDate: z.string(),
  retainedEarningsAccountCode: z.string().min(1),
  description: z.string().optional(),
  sourceSystem: z.string().optional(),
  lines: z.array(OpeningBalanceLineSchema).min(1),
});
export type OpeningBalanceBody = z.infer<typeof OpeningBalanceBodySchema>;

// ─── Equity Method Schema (GAP-F1) ───────────────────────────────────────────

export const EquityMethodInputSchema = z.object({
  associateEntityId: z.string().min(1),
  ownershipPctBps: z.coerce.number().int().min(0).max(10000),
  investmentCostAtAcquisition: z.coerce.bigint(),
  openingCarryingAmount: z.coerce.bigint(),
  associateProfitOrLoss: z.coerce.bigint(),
  associateOci: z.coerce.bigint(),
  dividendsReceived: z.coerce.bigint(),
  impairmentLoss: z.coerce.bigint(),
  upstreamUnrealizedProfit: z.coerce.bigint(),
  downstreamUnrealizedProfit: z.coerce.bigint(),
  currencyCode: z.string().length(3),
});

export const EquityMethodBodySchema = z.object({
  associates: z.array(EquityMethodInputSchema).min(1),
});
export type EquityMethodBody = z.infer<typeof EquityMethodBodySchema>;

// ─── Going Concern Assessment Schema (GAP-E3) ───────────────────────────────

export const CovenantBreachSchema = z.object({
  covenantName: z.string().min(1),
  isBreached: z.boolean(),
  waiverObtained: z.boolean(),
});

export const SubsequentEventSchema = z.object({
  description: z.string().min(1),
  impactSeverity: z.enum(['HIGH', 'MEDIUM', 'LOW']),
});

export const GoingConcernBodySchema = z.object({
  projectedCashFlow12m: z.coerce.bigint(),
  debtMaturingWithin12m: z.coerce.bigint(),
  cashAndEquivalents: z.coerce.bigint(),
  undrawnFacilities: z.coerce.bigint(),
  currentAssets: z.coerce.bigint(),
  currentLiabilities: z.coerce.bigint(),
  netProfitLoss: z.coerce.bigint(),
  accumulatedLosses: z.coerce.bigint(),
  totalEquity: z.coerce.bigint(),
  totalAssets: z.coerce.bigint(),
  covenantBreaches: z.array(CovenantBreachSchema).optional(),
  subsequentEvents: z.array(SubsequentEventSchema).optional(),
});
export type GoingConcernBody = z.infer<typeof GoingConcernBodySchema>;

// ─── Financial Ratios Schema (GAP-C5) ────────────────────────────────────────

export const FinancialRatiosBodySchema = z.object({
  currentAssets: z.coerce.bigint(),
  currentLiabilities: z.coerce.bigint(),
  inventory: z.coerce.bigint(),
  cash: z.coerce.bigint(),
  totalAssets: z.coerce.bigint(),
  totalLiabilities: z.coerce.bigint(),
  totalEquity: z.coerce.bigint(),
  tradeReceivables: z.coerce.bigint(),
  tradePayables: z.coerce.bigint(),
  revenue: z.coerce.bigint(),
  costOfSales: z.coerce.bigint(),
  grossProfit: z.coerce.bigint(),
  operatingProfit: z.coerce.bigint(),
  netProfit: z.coerce.bigint(),
  interestExpense: z.coerce.bigint(),
  depreciation: z.coerce.bigint(),
  daysInPeriod: z.coerce.number().int().min(1).max(366).optional(),
});
export type FinancialRatiosBody = z.infer<typeof FinancialRatiosBodySchema>;

// ─── EPS Calculator Schemas (GAP-C1) ─────────────────────────────────────────

export const DilutiveInstrumentSchema = z.object({
  name: z.string().min(1),
  potentialShares: z.coerce.bigint(),
  earningsAdjustment: z.coerce.bigint(),
});

export const EpsBodySchema = z.object({
  netProfit: z.coerce.bigint(),
  preferenceDividends: z.coerce.bigint(),
  weightedAverageShares: z.coerce.bigint(),
  dilutivePotentialShares: z.array(DilutiveInstrumentSchema).optional(),
});
export type EpsBody = z.infer<typeof EpsBodySchema>;

// ─── Notes Engine Schemas (GAP-C3) ───────────────────────────────────────────

export const NoteCategoryEnum = z.enum([
  'ACCOUNTING_POLICIES',
  'SIGNIFICANT_JUDGMENTS',
  'REVENUE',
  'PROPERTY_PLANT_EQUIPMENT',
  'INTANGIBLE_ASSETS',
  'FINANCIAL_INSTRUMENTS',
  'LEASES',
  'PROVISIONS',
  'RELATED_PARTY',
  'SUBSEQUENT_EVENTS',
  'OTHER',
]);

export const NoteTemplateSchema = z.object({
  id: z.string().min(1),
  category: NoteCategoryEnum,
  title: z.string().min(1),
  templateText: z.string(),
  requiredFields: z.array(z.string()),
  isRequired: z.boolean(),
});

export const NoteDataSchema = z.object({
  templateId: z.string().min(1),
  fields: z.record(z.union([z.string(), z.number(), z.boolean()])),
});

export const GenerateNotesBodySchema = z.object({
  templates: z.array(NoteTemplateSchema).min(1),
  data: z.array(NoteDataSchema),
});
export type GenerateNotesBody = z.infer<typeof GenerateNotesBodySchema>;

// ─── XBRL Tagger Schemas (GAP-C4) ───────────────────────────────────────────

export const XbrlTaxonomyEnum = z.enum(['IFRS_FULL', 'IFRS_SME', 'US_GAAP']);

export const XbrlTagMappingSchema = z.object({
  accountId: z.string().min(1),
  xbrlElement: z.string().min(1),
  xbrlNamespace: z.string().min(1),
  periodType: z.enum(['instant', 'duration']),
  balanceType: z.enum(['debit', 'credit', 'none']),
});

export const FinancialDataPointSchema = z.object({
  accountId: z.string().min(1),
  label: z.string(),
  value: z.coerce.bigint(),
  currencyCode: z.string().length(3),
  periodStart: z.string(),
  periodEnd: z.string(),
  isInstant: z.boolean(),
});

export const XbrlTagBodySchema = z.object({
  dataPoints: z.array(FinancialDataPointSchema).min(1),
  mappings: z.array(XbrlTagMappingSchema).min(1),
  taxonomy: XbrlTaxonomyEnum,
  entityId: z.string().min(1),
});
export type XbrlTagBody = z.infer<typeof XbrlTagBodySchema>;

export const IcAgingQuerySchema = z.object({
  currency: z.string().length(3).default('USD'),
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

export const ReportingStandardSchema = z.enum(['IFRS', 'US_GAAP', 'LOCAL']);

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
  'DRAFT',
  'PENDING_APPROVAL',
  'APPROVED',
  'POSTED',
  'PAID',
  'PARTIALLY_PAID',
  'CANCELLED',
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

export const PaymentRunStatusSchema = z.enum(['DRAFT', 'APPROVED', 'EXECUTED', 'CANCELLED']);
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
  'DRAFT',
  'PENDING_APPROVAL',
  'APPROVED',
  'POSTED',
  'PAID',
  'PARTIALLY_PAID',
  'WRITTEN_OFF',
  'CANCELLED',
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
  'DEBT_HELD',
  'DEBT_ISSUED',
  'EQUITY_INVESTMENT',
  'DERIVATIVE',
  'LOAN_RECEIVABLE',
  'TRADE_RECEIVABLE',
]);
export type InstrumentType = z.infer<typeof InstrumentTypeSchema>;

export const InstrumentClassificationSchema = z.enum(['AMORTIZED_COST', 'FVOCI', 'FVTPL']);
export type InstrumentClassification = z.infer<typeof InstrumentClassificationSchema>;

export const FairValueLevelSchema = z.enum(['LEVEL_1', 'LEVEL_2', 'LEVEL_3']);
export type FairValueLevel = z.infer<typeof FairValueLevelSchema>;

export const CreateFinancialInstrumentSchema = z.object({
  companyId: z.string().uuid(),
  instrumentType: InstrumentTypeSchema,
  classification: InstrumentClassificationSchema,
  fairValueLevel: FairValueLevelSchema.nullable().optional(),
  nominalAmount: z.string().regex(/^\d+$/, 'nominalAmount must be a non-negative integer string'),
  carryingAmount: z.string().regex(/^\d+$/, 'carryingAmount must be a non-negative integer string'),
  fairValue: z
    .string()
    .regex(/^-?\d+$/, 'fairValue must be an integer string')
    .nullable()
    .optional(),
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
export const HedgeTypeSchema = z.enum(['FAIR_VALUE', 'CASH_FLOW', 'NET_INVESTMENT']);
export type HedgeType = z.infer<typeof HedgeTypeSchema>;

export const HedgeStatusSchema = z.enum(['DESIGNATED', 'ACTIVE', 'DISCONTINUED', 'REBALANCED']);
export type HedgeStatus = z.infer<typeof HedgeStatusSchema>;

export const CreateHedgeRelationshipSchema = z.object({
  companyId: z.string().uuid(),
  hedgeType: HedgeTypeSchema,
  hedgingInstrumentId: z.string().uuid(),
  hedgedItemId: z.string().uuid(),
  hedgedRisk: z.string().min(1).max(100),
  hedgeRatio: z.coerce.number().int().positive().default(10000),
  designationDate: z.string().date(),
  ociReserveBalance: z
    .string()
    .regex(/^-?\d+$/, 'ociReserveBalance must be an integer string')
    .default('0'),
  currencyCode: z.string().length(3),
});
export type CreateHedgeRelationship = z.infer<typeof CreateHedgeRelationshipSchema>;

export const HedgeTestMethodSchema = z.enum(['DOLLAR_OFFSET', 'REGRESSION', 'CRITICAL_TERMS']);
export type HedgeTestMethod = z.infer<typeof HedgeTestMethodSchema>;

export const HedgeTestResultSchema = z.enum(['HIGHLY_EFFECTIVE', 'EFFECTIVE', 'INEFFECTIVE']);
export type HedgeTestResult = z.infer<typeof HedgeTestResultSchema>;

export const CreateHedgeEffectivenessTestSchema = z.object({
  testDate: z.string().date(),
  testMethod: HedgeTestMethodSchema,
  result: HedgeTestResultSchema,
  effectivenessRatioBps: z.coerce.number().int().nonnegative(),
  hedgedItemFairValueChange: z
    .string()
    .regex(/^-?\d+$/, 'hedgedItemFairValueChange must be an integer string'),
  hedgingInstrumentFairValueChange: z
    .string()
    .regex(/^-?\d+$/, 'hedgingInstrumentFairValueChange must be an integer string'),
  ineffectivePortionAmount: z
    .string()
    .regex(/^-?\d+$/, 'ineffectivePortionAmount must be an integer string')
    .default('0'),
  currencyCode: z.string().length(3),
  notes: z.string().max(2000).nullable().optional(),
  journalId: z.string().uuid().nullable().optional(),
});
export type CreateHedgeEffectivenessTest = z.infer<typeof CreateHedgeEffectivenessTestSchema>;

// ─── Phase 7: Intangible Assets (IAS 38) ────────────────────────────────────
export const IntangibleCategorySchema = z.enum([
  'SOFTWARE',
  'PATENT',
  'TRADEMARK',
  'COPYRIGHT',
  'LICENCE',
  'CUSTOMER_RELATIONSHIP',
  'GOODWILL_RELATED',
  'DEVELOPMENT_COST',
  'OTHER',
]);
export type IntangibleCategory = z.infer<typeof IntangibleCategorySchema>;

export const IntangibleAssetStatusSchema = z.enum([
  'ACTIVE',
  'DISPOSED',
  'FULLY_AMORTIZED',
  'IMPAIRED',
  'IN_DEVELOPMENT',
]);
export type IntangibleAssetStatus = z.infer<typeof IntangibleAssetStatusSchema>;

export const UsefulLifeTypeSchema = z.enum(['FINITE', 'INDEFINITE']);
export type UsefulLifeType = z.infer<typeof UsefulLifeTypeSchema>;

export const CreateIntangibleAssetSchema = z.object({
  companyId: z.string().uuid(),
  assetNumber: z.string().min(1).max(30),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).nullable().optional(),
  category: IntangibleCategorySchema,
  usefulLifeType: UsefulLifeTypeSchema,
  acquisitionDate: z.string().date(),
  acquisitionCost: z
    .string()
    .regex(/^\d+$/, 'acquisitionCost must be a non-negative integer string'),
  residualValue: z
    .string()
    .regex(/^\d+$/, 'residualValue must be a non-negative integer string')
    .default('0'),
  usefulLifeMonths: z.coerce.number().int().positive().nullable().optional(),
  netBookValue: z.string().regex(/^\d+$/, 'netBookValue must be a non-negative integer string'),
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
  carryingAmount: z.string().regex(/^-?\d+$/, 'carryingAmount must be an integer string'),
  taxBase: z.string().regex(/^-?\d+$/, 'taxBase must be an integer string'),
  temporaryDifference: z.string().regex(/^-?\d+$/, 'temporaryDifference must be an integer string'),
  taxRateBps: z.coerce.number().int().nonnegative(),
  deferredTaxAsset: z
    .string()
    .regex(/^\d+$/, 'deferredTaxAsset must be a non-negative integer string')
    .default('0'),
  deferredTaxLiability: z
    .string()
    .regex(/^\d+$/, 'deferredTaxLiability must be a non-negative integer string')
    .default('0'),
  isRecognized: z.boolean().default(true),
  currencyCode: z.string().length(3),
  periodId: z.string().uuid(),
});
export type CreateDeferredTaxItem = z.infer<typeof CreateDeferredTaxItemSchema>;

// ─── Phase 7: Transfer Pricing (OECD Guidelines) ───────────────────────────
export const TpMethodSchema = z.enum(['CUP', 'RESALE_PRICE', 'COST_PLUS', 'TNMM', 'PROFIT_SPLIT']);
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

// ─── Approval Workflow Schemas (GAP-A2) ──────────────────────────────────────

export const ApprovalRequestStatusSchema = z.enum([
  'PENDING',
  'APPROVED',
  'REJECTED',
  'CANCELLED',
  'ESCALATED',
]);
export type ApprovalRequestStatusContract = z.infer<typeof ApprovalRequestStatusSchema>;

export const SubmitApprovalSchema = z.object({
  entityType: z.string().min(1).max(50),
  entityId: z.string().uuid(),
  metadata: z.record(z.unknown()).default({}),
});
export type SubmitApproval = z.infer<typeof SubmitApprovalSchema>;

export const ApproveRejectSchema = z.object({
  reason: z.string().max(1000).optional(),
});
export type ApproveReject = z.infer<typeof ApproveRejectSchema>;

export const RejectApprovalSchema = z.object({
  reason: z.string().min(1, 'reason is required').max(1000),
});
export type RejectApproval = z.infer<typeof RejectApprovalSchema>;

export const DelegateApprovalSchema = z.object({
  delegateTo: z.string().min(1),
});
export type DelegateApproval = z.infer<typeof DelegateApprovalSchema>;

export const ApprovalPendingQuerySchema = PaginationSchema.extend({});
export type ApprovalPendingQuery = z.infer<typeof ApprovalPendingQuerySchema>;

export const CreateApprovalPolicySchema = z.object({
  companyId: z.string().uuid().nullable().optional(),
  entityType: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  rules: z
    .array(
      z.object({
        condition: z.object({
          field: z.string().min(1),
          operator: z.enum(['gt', 'gte', 'lt', 'lte', 'eq']),
          value: z.string(),
        }),
        chain: z
          .array(
            z.object({
              approverType: z.enum(['role', 'userId', 'managerOf']),
              approverValue: z.string().min(1),
              mode: z.enum(['sequential', 'parallel']).default('sequential'),
              escalateAfterHours: z.coerce.number().positive().optional(),
            })
          )
          .min(1),
      })
    )
    .min(1),
});
export type CreateApprovalPolicyContract = z.infer<typeof CreateApprovalPolicySchema>;

// ─── GAP-E1: Audit Package Schemas ───────────────────────────────────────────

export const LeadScheduleItemSchema = z.object({
  accountCode: z.string().min(1),
  accountName: z.string().min(1),
  classification: z.enum(['BS', 'IS']),
  subClassification: z.string().min(1),
  openingBalance: z.coerce.bigint(),
  debits: z.coerce.bigint(),
  credits: z.coerce.bigint(),
  closingBalance: z.coerce.bigint(),
  priorYearBalance: z.coerce.bigint(),
  variance: z.coerce.bigint(),
  variancePct: z.coerce.bigint(),
});

export const JournalListingEntrySchema = z.object({
  journalId: z.string().min(1),
  postingDate: z.string(),
  description: z.string(),
  totalAmount: z.coerce.bigint(),
  lineCount: z.coerce.number().int().nonnegative(),
  postedBy: z.string(),
  isManual: z.boolean(),
  isReversing: z.boolean(),
  isYearEnd: z.boolean(),
});

export const RelatedPartyEntrySchema = z.object({
  partyId: z.string().min(1),
  partyName: z.string().min(1),
  relationship: z.string().min(1),
  transactionType: z.string().min(1),
  amount: z.coerce.bigint(),
  outstandingBalance: z.coerce.bigint(),
  currencyCode: z.string().length(3),
});

export const SubsequentEventEntrySchema = z.object({
  eventDate: z.string(),
  description: z.string().min(1),
  eventType: z.enum(['ADJUSTING', 'NON_ADJUSTING']),
  financialImpact: z.coerce.bigint(),
  isDisclosed: z.boolean(),
});

export const AuditPackageBodySchema = z.object({
  companyName: z.string().min(1),
  fiscalYearEnd: z.string(),
  reportingCurrency: z.string().length(3),
  leadScheduleItems: z.array(LeadScheduleItemSchema),
  journalEntries: z.array(JournalListingEntrySchema),
  relatedPartyTransactions: z.array(RelatedPartyEntrySchema),
  subsequentEvents: z.array(SubsequentEventEntrySchema),
  materialityThreshold: z.coerce.bigint(),
  trivialThreshold: z.coerce.bigint(),
});
export type AuditPackageBody = z.infer<typeof AuditPackageBodySchema>;

// ─── GAP-B4: Data Retention Schemas ──────────────────────────────────────────

export const RetentionEntityTypeSchema = z.enum([
  'JOURNAL',
  'AP_INVOICE',
  'AR_INVOICE',
  'BANK_STATEMENT',
  'TAX_RETURN',
  'FIXED_ASSET',
  'PAYROLL',
  'EXPENSE_CLAIM',
  'AUDIT_LOG',
  'USER_DATA',
]);

export const RetentionPolicySchema = z.object({
  entityType: RetentionEntityTypeSchema,
  jurisdiction: z.string().min(1),
  retentionMonths: z.coerce.number().int().positive(),
  gdprApplicable: z.boolean(),
  legalHoldOverride: z.boolean(),
});

export const RetentionRecordSchema = z.object({
  entityId: z.string().min(1),
  entityType: RetentionEntityTypeSchema,
  jurisdiction: z.string().min(1),
  fiscalYearEnd: z.string(),
  createdAt: z.string(),
  containsPii: z.boolean(),
  isOnLegalHold: z.boolean(),
});

export const RetentionBodySchema = z.object({
  evaluationDate: z.string(),
  policies: z.array(RetentionPolicySchema),
  records: z.array(RetentionRecordSchema).min(1),
});
export type RetentionBody = z.infer<typeof RetentionBodySchema>;

// ─── GAP-D4: Petty Cash Schemas ─────────────────────────────────────────────

export const PettyCashVoucherSchema = z.object({
  voucherId: z.string().min(1),
  date: z.string(),
  description: z.string().min(1),
  amount: z.coerce.bigint(),
  category: z.string().min(1),
  approvedBy: z.string().min(1),
  receiptAttached: z.boolean(),
});

export const PettyCashCountSchema = z.object({
  denomination: z.string().min(1),
  quantity: z.coerce.number().int().nonnegative(),
  valuePerUnit: z.coerce.bigint(),
});

export const PettyCashBodySchema = z.object({
  fundName: z.string().min(1),
  authorizedFloat: z.coerce.bigint(),
  openingBalance: z.coerce.bigint(),
  vouchers: z.array(PettyCashVoucherSchema),
  cashCount: z.array(PettyCashCountSchema).optional(),
  iousOutstanding: z.coerce.bigint().optional(),
  advancesOutstanding: z.coerce.bigint().optional(),
  currencyCode: z.string().length(3),
});
export type PettyCashBody = z.infer<typeof PettyCashBodySchema>;

// ─── GAP-E2: Document Attachment Schemas ─────────────────────────────────────

export const DocumentCategorySchema = z.enum([
  'INVOICE',
  'RECEIPT',
  'CONTRACT',
  'BANK_STATEMENT',
  'BOARD_MINUTES',
  'TAX_NOTICE',
  'VALUATION_REPORT',
  'LEGAL_OPINION',
  'INSURANCE_POLICY',
  'CORRESPONDENCE',
  'OTHER',
]);

export const LinkedEntityTypeSchema = z.enum([
  'JOURNAL',
  'AP_INVOICE',
  'AR_INVOICE',
  'FIXED_ASSET',
  'LEASE_CONTRACT',
  'EXPENSE_CLAIM',
  'BANK_RECONCILIATION',
  'TAX_RETURN',
  'PROVISION',
  'IC_TRANSACTION',
]);

export const DocumentAttachmentSchema = z.object({
  documentId: z.string().min(1),
  fileName: z.string().min(1),
  fileSize: z.coerce.number().int().nonnegative(),
  mimeType: z.string().min(1),
  category: DocumentCategorySchema,
  description: z.string(),
  uploadedBy: z.string().min(1),
  uploadedAt: z.string(),
  storageRef: z.string().min(1),
  checksum: z.string().min(1),
});

export const DocumentTraceBodySchema = z.object({
  entityType: LinkedEntityTypeSchema,
  entityId: z.string().min(1),
  attachments: z.array(DocumentAttachmentSchema),
  links: z.array(
    z.object({
      documentId: z.string().min(1),
      entityType: LinkedEntityTypeSchema,
      entityId: z.string().min(1),
      linkedBy: z.string().min(1),
      linkedAt: z.string(),
    })
  ),
});
export type DocumentTraceBody = z.infer<typeof DocumentTraceBodySchema>;

// ─── GAP-F2: Hyperinflation Restatement Schemas ─────────────────────────────

export const PriceIndexSchema = z.object({
  periodId: z.string().min(1),
  periodLabel: z.string().min(1),
  indexValue: z.coerce.bigint(),
});

export const HyperinflationLineItemSchema = z.object({
  accountCode: z.string().min(1),
  accountName: z.string().min(1),
  classification: z.enum(['MONETARY', 'NON_MONETARY']),
  historicalAmount: z.coerce.bigint(),
  originPeriodId: z.string().min(1),
});

export const HyperinflationBodySchema = z.object({
  entityId: z.string().min(1),
  entityName: z.string().min(1),
  localCurrency: z.string().length(3),
  reportingCurrency: z.string().length(3),
  currentPriceIndex: z.coerce.bigint(),
  priceIndices: z.array(PriceIndexSchema).min(1),
  lineItems: z.array(HyperinflationLineItemSchema).min(1),
  isHyperinflationaryEconomy: z.boolean(),
  cumulativeInflationBps: z.coerce.bigint(),
});
export type HyperinflationBody = z.infer<typeof HyperinflationBodySchema>;

// ─── GAP-F3: CbCR Filing Schemas ────────────────────────────────────────────

export const CbcrEntityInputSchema = z.object({
  entityId: z.string().min(1),
  entityName: z.string().min(1),
  taxJurisdiction: z.string().min(1),
  revenue: z.coerce.bigint(),
  relatedPartyRevenue: z.coerce.bigint(),
  unrelatedPartyRevenue: z.coerce.bigint(),
  profitBeforeTax: z.coerce.bigint(),
  incomeTaxPaid: z.coerce.bigint(),
  incomeTaxAccrued: z.coerce.bigint(),
  statedCapital: z.coerce.bigint(),
  accumulatedEarnings: z.coerce.bigint(),
  numberOfEmployees: z.coerce.number().int().nonnegative(),
  tangibleAssets: z.coerce.bigint(),
  currencyCode: z.string().length(3),
});

export const CbcrFilingBodySchema = z.object({
  reportingEntityId: z.string().min(1),
  reportingEntityName: z.string().min(1),
  reportingPeriodStart: z.string(),
  reportingPeriodEnd: z.string(),
  filingJurisdiction: z.string().min(1),
  consolidatedGroupRevenue: z.coerce.bigint(),
  currencyCode: z.string().length(3),
  entities: z.array(CbcrEntityInputSchema).min(1),
  version: z.coerce.number().int().positive(),
  preparedBy: z.string().min(1),
  preparedAt: z.string(),
});
export type CbcrFilingBody = z.infer<typeof CbcrFilingBodySchema>;

// ─── GAP-G3: Currency Redenomination Schemas ─────────────────────────────────

export const RedenominationBalanceSchema = z.object({
  accountCode: z.string().min(1),
  accountName: z.string().min(1),
  originalAmount: z.coerce.bigint(),
  originalCurrency: z.string().length(3),
});

export const RedenominationBodySchema = z.object({
  entityId: z.string().min(1),
  entityName: z.string().min(1),
  originalCurrencyCode: z.string().length(3),
  newCurrencyCode: z.string().length(3),
  conversionFactorBps: z.coerce.bigint(),
  effectiveDate: z.string(),
  balances: z.array(RedenominationBalanceSchema).min(1),
  roundToMinorUnit: z.boolean(),
  transitionEndDate: z.string().optional(),
});
export type RedenominationBody = z.infer<typeof RedenominationBodySchema>;

// ─── GAP-G4: Multilateral IC Netting Schemas ─────────────────────────────────

export const IcNettingPairSchema = z.object({
  fromEntityId: z.string().min(1),
  toEntityId: z.string().min(1),
  grossAmount: z.coerce.bigint(),
  currencyCode: z.string().length(3),
});

export const IcNettingBodySchema = z.object({
  nettingDate: z.string(),
  currencyCode: z.string().length(3),
  pairs: z.array(IcNettingPairSchema).min(1),
});
export type IcNettingBody = z.infer<typeof IcNettingBodySchema>;

// ─── GAP-B1: E-Invoice Schemas ───────────────────────────────────────────────

export const EInvoiceFormatEnum = z.enum([
  'MY_MYINVOIS',
  'SG_PEPPOL',
  'EU_PEPPOL',
  'IN_GST',
  'SA_ZATCA',
]);
export const EInvoiceDocumentTypeEnum = z.enum([
  'INVOICE',
  'CREDIT_NOTE',
  'DEBIT_NOTE',
  'SELF_BILLED',
]);

const EInvoicePartySchema = z.object({
  name: z.string().min(1),
  taxId: z.string(),
  registrationNumber: z.string().optional(),
  address: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    postalCode: z.string().min(1),
    countryCode: z.string().length(2),
    state: z.string().optional(),
  }),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
});

const EInvoiceLineItemSchema = z.object({
  lineNumber: z.number().int().positive(),
  description: z.string().min(1),
  quantity: z.coerce.bigint(),
  unitPrice: z.coerce.bigint(),
  lineTotal: z.coerce.bigint(),
  taxCode: z.string().min(1),
  taxRateBps: z.number().int().min(0),
  taxAmount: z.coerce.bigint(),
  unitOfMeasure: z.string().optional(),
  itemCode: z.string().optional(),
  classificationCode: z.string().optional(),
});

export const EInvoiceBodySchema = z.object({
  format: EInvoiceFormatEnum,
  documentType: EInvoiceDocumentTypeEnum,
  invoiceNumber: z.string().min(1),
  issueDate: z.string(),
  dueDate: z.string().optional(),
  currencyCode: z.string().length(3),
  supplier: EInvoicePartySchema,
  buyer: EInvoicePartySchema,
  lineItems: z.array(EInvoiceLineItemSchema).min(1),
  totalExcludingTax: z.coerce.bigint(),
  totalTax: z.coerce.bigint(),
  totalIncludingTax: z.coerce.bigint(),
  paymentTerms: z.string().optional(),
  referenceNumber: z.string().optional(),
  originalInvoiceRef: z.string().optional(),
});
export type EInvoiceBody = z.infer<typeof EInvoiceBodySchema>;

// ─── GAP-B2: Parallel Ledger Schemas ─────────────────────────────────────────

export const LedgerPurposeEnum = z.enum(['PRIMARY', 'STATUTORY', 'TAX', 'MANAGEMENT']);
export const AdjustmentTypeEnum = z.enum([
  'RECLASSIFICATION',
  'REVALUATION',
  'TIMING',
  'PERMANENT',
]);

const LedgerMappingRuleSchema = z.object({
  ruleId: z.string().min(1),
  sourceAccountCode: z.string().min(1),
  targetAccountCode: z.string().min(1),
  sourceLedgerPurpose: LedgerPurposeEnum,
  targetLedgerPurpose: LedgerPurposeEnum,
  adjustmentType: AdjustmentTypeEnum,
  adjustmentBps: z.number().int().min(0).max(10000),
  description: z.string(),
});

const ParallelLedgerEntrySchema = z.object({
  journalId: z.string().min(1),
  accountCode: z.string().min(1),
  amount: z.coerce.bigint(),
  isDebit: z.boolean(),
  ledgerPurpose: LedgerPurposeEnum,
  periodId: z.string().min(1),
  description: z.string(),
});

export const ParallelLedgerBodySchema = z.object({
  sourceEntries: z.array(ParallelLedgerEntrySchema).min(1),
  mappingRules: z.array(LedgerMappingRuleSchema),
  targetLedgerPurpose: LedgerPurposeEnum,
});
export type ParallelLedgerBody = z.infer<typeof ParallelLedgerBodySchema>;

// ─── GAP-B3: Country Tax Format Pack Schemas ─────────────────────────────────

export const MyFormCBodySchema = z.object({
  companyName: z.string().min(1),
  tinNumber: z.string().min(1),
  yearOfAssessment: z.number().int().positive(),
  grossIncome: z.coerce.bigint(),
  allowableDeductions: z.coerce.bigint(),
  capitalAllowances: z.coerce.bigint(),
  adjustedIncome: z.coerce.bigint(),
  chargeableIncome: z.coerce.bigint(),
  taxPayable: z.coerce.bigint(),
  taxCredits: z.coerce.bigint(),
  instalmentsPaid: z.coerce.bigint(),
  currencyCode: z.string().length(3),
  periodStart: z.string(),
  periodEnd: z.string(),
});
export type MyFormCBody = z.infer<typeof MyFormCBodySchema>;

export const SgFormCsBodySchema = z.object({
  companyName: z.string().min(1),
  uenNumber: z.string().min(1),
  yearOfAssessment: z.number().int().positive(),
  revenue: z.coerce.bigint(),
  adjustedProfit: z.coerce.bigint(),
  chargeableIncome: z.coerce.bigint(),
  taxPayable: z.coerce.bigint(),
  taxCredits: z.coerce.bigint(),
  currencyCode: z.string().length(3),
  periodStart: z.string(),
  periodEnd: z.string(),
});
export type SgFormCsBody = z.infer<typeof SgFormCsBodySchema>;

export const IdPPhBodySchema = z.object({
  format: z.enum(['ID_PPH_21', 'ID_PPH_23', 'ID_PPH_25']),
  npwpNumber: z.string().min(1),
  taxPeriodMonth: z.number().int().min(1).max(12),
  taxPeriodYear: z.number().int().positive(),
  grossAmount: z.coerce.bigint(),
  taxableAmount: z.coerce.bigint(),
  taxRateBps: z.number().int().min(0),
  taxWithheld: z.coerce.bigint(),
  numberOfRecipients: z.number().int().min(0),
  currencyCode: z.string().length(3),
});
export type IdPPhBody = z.infer<typeof IdPPhBodySchema>;

export const ThPP30BodySchema = z.object({
  tinNumber: z.string().min(1),
  taxPeriodMonth: z.number().int().min(1).max(12),
  taxPeriodYear: z.number().int().positive(),
  totalSales: z.coerce.bigint(),
  totalPurchases: z.coerce.bigint(),
  outputVat: z.coerce.bigint(),
  inputVat: z.coerce.bigint(),
  currencyCode: z.string().length(3),
});
export type ThPP30Body = z.infer<typeof ThPP30BodySchema>;

export const InGstr3bBodySchema = z.object({
  gstinNumber: z.string().min(1),
  taxPeriodMonth: z.number().int().min(1).max(12),
  taxPeriodYear: z.number().int().positive(),
  outwardTaxableSupplies: z.coerce.bigint(),
  outwardZeroRated: z.coerce.bigint(),
  outwardExempt: z.coerce.bigint(),
  inwardReverseCharge: z.coerce.bigint(),
  igst: z.coerce.bigint(),
  cgst: z.coerce.bigint(),
  sgst: z.coerce.bigint(),
  inputIgst: z.coerce.bigint(),
  inputCgst: z.coerce.bigint(),
  inputSgst: z.coerce.bigint(),
  currencyCode: z.string().length(3),
});
export type InGstr3bBody = z.infer<typeof InGstr3bBodySchema>;

const Us1099NecRecipientSchema = z.object({
  recipientName: z.string().min(1),
  recipientTin: z.string().min(1),
  nonEmployeeCompensation: z.coerce.bigint(),
  federalTaxWithheld: z.coerce.bigint(),
  stateTaxWithheld: z.coerce.bigint(),
  stateCode: z.string().length(2),
});

export const Us1099NecBodySchema = z.object({
  payerName: z.string().min(1),
  payerTin: z.string().min(1),
  taxYear: z.number().int().positive(),
  recipients: z.array(Us1099NecRecipientSchema).min(1),
  currencyCode: z.string().length(3),
});
export type Us1099NecBody = z.infer<typeof Us1099NecBodySchema>;

const EcSalesEntrySchema = z.object({
  customerVatId: z.string().min(1),
  customerCountry: z.string().length(2),
  supplyType: z.enum(['GOODS', 'SERVICES', 'TRIANGULATION']),
  totalValue: z.coerce.bigint(),
});

export const EcSalesListBodySchema = z.object({
  vatNumber: z.string().min(1),
  memberState: z.string().length(2),
  periodQuarter: z.number().int().min(1).max(4),
  periodYear: z.number().int().positive(),
  entries: z.array(EcSalesEntrySchema).min(1),
  currencyCode: z.string().length(3),
});
export type EcSalesListBody = z.infer<typeof EcSalesListBodySchema>;

// ─── GAP-D1: Payroll Integration Schemas ─────────────────────────────────────

export const PayrollJurisdictionEnum = z.enum(['MY', 'SG', 'ID', 'TH', 'PH', 'IN', 'GENERIC']);

const EmployeePayrollSchema = z.object({
  employeeId: z.string().min(1),
  employeeName: z.string().min(1),
  grossSalary: z.coerce.bigint(),
  allowances: z.coerce.bigint(),
  bonuses: z.coerce.bigint(),
  overtime: z.coerce.bigint(),
  deductions: z.coerce.bigint(),
  jurisdiction: PayrollJurisdictionEnum,
  age: z.number().int().positive().optional(),
  citizenshipStatus: z.enum(['CITIZEN', 'PR', 'FOREIGNER']).optional(),
  annualLeaveDaysAccrued: z.number().int().min(0),
  annualLeaveDaysUsed: z.number().int().min(0),
  dailyRate: z.coerce.bigint(),
  currencyCode: z.string().length(3),
});

export const PayrollBodySchema = z.object({
  employees: z.array(EmployeePayrollSchema).min(1),
});
export type PayrollBody = z.infer<typeof PayrollBodySchema>;

// ─── GAP-D2: Inventory / COGS Schemas ────────────────────────────────────────

export const CostingMethodEnum = z.enum(['WEIGHTED_AVERAGE', 'FIFO', 'SPECIFIC_ID']);

const InventoryMovementSchema = z.object({
  movementId: z.string().min(1),
  date: z.string(),
  type: z.enum(['PURCHASE', 'SALE', 'RETURN_IN', 'RETURN_OUT', 'ADJUSTMENT']),
  quantity: z.coerce.bigint(),
  unitCost: z.coerce.bigint(),
  totalCost: z.coerce.bigint(),
  batchId: z.string().optional(),
  description: z.string().optional(),
});

const InventoryItemSchema = z.object({
  itemCode: z.string().min(1),
  itemName: z.string().min(1),
  costingMethod: CostingMethodEnum,
  openingQuantity: z.coerce.bigint(),
  openingCost: z.coerce.bigint(),
  movements: z.array(InventoryMovementSchema),
  netRealisableValue: z.coerce.bigint(),
  currencyCode: z.string().length(3),
});

const StockCountSchema = z.object({
  itemCode: z.string().min(1),
  countedQuantity: z.coerce.bigint(),
});

export const InventoryBodySchema = z.object({
  valuationDate: z.string(),
  items: z.array(InventoryItemSchema).min(1),
  stockCounts: z.array(StockCountSchema).optional(),
});
export type InventoryBody = z.infer<typeof InventoryBodySchema>;
