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

// ─── Supplier Schemas ──────────────────────────────────────────────────────

export const SupplierStatusSchema = z.enum([
  'ACTIVE',
  'ON_HOLD',
  'INACTIVE',
  'BLOCKED',
  'BLACKLISTED',
]);
export type SupplierStatus = z.infer<typeof SupplierStatusSchema>;

export const SupplierOnboardingStatusSchema = z.enum([
  'PROSPECT',
  'PENDING_APPROVAL',
  'ACTIVE',
  'SUSPENDED',
  'INACTIVE',
]);
export type SupplierOnboardingStatus = z.infer<typeof SupplierOnboardingStatusSchema>;

export const SupplierAccountGroupSchema = z.enum([
  'TRADE',
  'INTERCOMPANY',
  'ONE_TIME',
  'EMPLOYEE',
  'GOVERNMENT',
  'SUBCONTRACTOR',
]);
export type SupplierAccountGroup = z.infer<typeof SupplierAccountGroupSchema>;

export const SupplierCategorySchema = z.enum([
  'GOODS',
  'SERVICES',
  'SUBCONTRACTOR',
  'ONE_TIME',
  'INTERCOMPANY',
  'GOVERNMENT',
  'EMPLOYEE',
]);
export type SupplierCategory = z.infer<typeof SupplierCategorySchema>;

export const PaymentMethodTypeSchema = z.enum([
  'BANK_TRANSFER',
  'CHECK',
  'WIRE',
  'SEPA',
  'LOCAL_TRANSFER',
]);
export type PaymentMethodType = z.infer<typeof PaymentMethodTypeSchema>;

export const CreateSupplierSchema = z.object({
  companyId: z.string().uuid(),
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(200),
  tradingName: z.string().max(200).nullable().optional(),
  registrationNumber: z.string().max(50).nullable().optional(),
  countryOfIncorporation: z.string().length(3).nullable().optional(),
  legalForm: z.string().max(50).nullable().optional(),
  taxId: z.string().max(50).nullable().optional(),
  currencyCode: z.string().length(3),
  defaultPaymentTermsId: z.string().uuid().nullable().optional(),
  defaultPaymentMethod: PaymentMethodTypeSchema.nullable().optional(),
  whtRateId: z.string().uuid().nullable().optional(),
  remittanceEmail: z.string().email().max(255).nullable().optional(),
  accountGroup: SupplierAccountGroupSchema.optional(),
  category: SupplierCategorySchema.optional(),
  industryCode: z.string().max(20).nullable().optional(),
  industryDescription: z.string().max(200).nullable().optional(),
  parentSupplierId: z.string().uuid().nullable().optional(),
  isGroupHeader: z.boolean().optional(),
});
export type CreateSupplier = z.infer<typeof CreateSupplierSchema>;

export const UpdateSupplierSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  tradingName: z.string().max(200).nullable().optional(),
  registrationNumber: z.string().max(50).nullable().optional(),
  countryOfIncorporation: z.string().length(3).nullable().optional(),
  legalForm: z.string().max(50).nullable().optional(),
  taxId: z.string().max(50).nullable().optional(),
  currencyCode: z.string().length(3).optional(),
  defaultPaymentTermsId: z.string().uuid().nullable().optional(),
  defaultPaymentMethod: PaymentMethodTypeSchema.nullable().optional(),
  whtRateId: z.string().uuid().nullable().optional(),
  remittanceEmail: z.string().email().max(255).nullable().optional(),
  status: SupplierStatusSchema.optional(),
  onboardingStatus: SupplierOnboardingStatusSchema.optional(),
  accountGroup: SupplierAccountGroupSchema.optional(),
  category: SupplierCategorySchema.optional(),
  industryCode: z.string().max(20).nullable().optional(),
  industryDescription: z.string().max(200).nullable().optional(),
  parentSupplierId: z.string().uuid().nullable().optional(),
  isGroupHeader: z.boolean().optional(),
});
export type UpdateSupplier = z.infer<typeof UpdateSupplierSchema>;

export const SupplierListQuerySchema = PaginationSchema.extend({
  status: SupplierStatusSchema.optional(),
  accountGroup: SupplierAccountGroupSchema.optional(),
  category: SupplierCategorySchema.optional(),
  onboardingStatus: SupplierOnboardingStatusSchema.optional(),
  industryCode: z.string().max(20).optional(),
  isGroupHeader: z.coerce.boolean().optional(),
});
export type SupplierListQuery = z.infer<typeof SupplierListQuerySchema>;

export const CreateSupplierSiteSchema = z.object({
  siteCode: z.string().min(1).max(20),
  name: z.string().min(1).max(200),
  addressLine1: z.string().min(1).max(500),
  addressLine2: z.string().max(500).nullable().optional(),
  city: z.string().min(1).max(100),
  region: z.string().max(100).nullable().optional(),
  postalCode: z.string().max(20).nullable().optional(),
  countryCode: z.string().length(3),
  isPrimary: z.boolean().default(false),
  isPaySite: z.boolean().default(false),
  isPurchasingSite: z.boolean().default(false),
  isRemitTo: z.boolean().default(false),
  contactName: z.string().max(200).nullable().optional(),
  contactEmail: z.string().email().max(255).nullable().optional(),
  contactPhone: z.string().max(50).nullable().optional(),
});
export type CreateSupplierSite = z.infer<typeof CreateSupplierSiteSchema>;

export const CreateSupplierBankAccountSchema = z.object({
  bankName: z.string().min(1).max(200),
  accountName: z.string().min(1).max(200),
  accountNumber: z.string().min(1).max(50),
  iban: z.string().max(34).nullable().optional(),
  swiftBic: z.string().max(11).nullable().optional(),
  localBankCode: z.string().max(20).nullable().optional(),
  currencyCode: z.string().length(3),
  siteId: z.string().uuid().nullable().optional(),
  isPrimary: z.boolean().default(false),
});
export type CreateSupplierBankAccount = z.infer<typeof CreateSupplierBankAccountSchema>;

// ─── Supplier MDM Schemas ─────────────────────────────────────────────────

export const SupplierBlockTypeSchema = z.enum([
  'PURCHASING_BLOCK',
  'POSTING_BLOCK',
  'PAYMENT_BLOCK',
  'FULL_BLOCK',
]);
export type SupplierBlockType = z.infer<typeof SupplierBlockTypeSchema>;

export const SupplierBlockScopeSchema = z.enum([
  'ALL_COMPANIES',
  'SPECIFIC_COMPANY',
  'SPECIFIC_SITE',
]);
export type SupplierBlockScope = z.infer<typeof SupplierBlockScopeSchema>;

export const CreateSupplierBlockSchema = z.object({
  blockType: SupplierBlockTypeSchema,
  scope: SupplierBlockScopeSchema,
  companyId: z.string().uuid().nullable().optional(),
  siteId: z.string().uuid().nullable().optional(),
  reasonCode: z.string().min(1).max(50),
  reason: z.string().min(1),
  effectiveFrom: z.string().datetime().optional(),
  effectiveUntil: z.string().datetime().nullable().optional(),
});
export type CreateSupplierBlock = z.infer<typeof CreateSupplierBlockSchema>;

export const CreateSupplierBlacklistSchema = z.object({
  justification: z.string().min(1),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().nullable().optional(),
});
export type CreateSupplierBlacklist = z.infer<typeof CreateSupplierBlacklistSchema>;

export const ReverseSupplierBlacklistSchema = z.object({
  reversalReason: z.string().min(1),
});
export type ReverseSupplierBlacklist = z.infer<typeof ReverseSupplierBlacklistSchema>;

export const SupplierTaxTypeSchema = z.enum(['VAT', 'GST', 'SST', 'TIN', 'CIT', 'WHT', 'CUSTOM']);
export type SupplierTaxType = z.infer<typeof SupplierTaxTypeSchema>;

export const CreateSupplierTaxRegistrationSchema = z.object({
  taxType: SupplierTaxTypeSchema,
  registrationNumber: z.string().min(1).max(50),
  issuingCountry: z.string().length(3),
  validFrom: z.string().datetime().nullable().optional(),
  validUntil: z.string().datetime().nullable().optional(),
  isPrimary: z.boolean().default(false),
});
export type CreateSupplierTaxRegistration = z.infer<typeof CreateSupplierTaxRegistrationSchema>;

export const VerifyBankAccountSchema = z.object({
  verificationMethod: z.string().min(1).max(50),
});
export type VerifyBankAccount = z.infer<typeof VerifyBankAccountSchema>;

export const SupplierLegalDocTypeSchema = z.enum([
  'REGISTRATION_CERTIFICATE',
  'TAX_REGISTRATION',
  'ARTICLES_OF_INCORPORATION',
  'POWER_OF_ATTORNEY',
  'BANK_CONFIRMATION_LETTER',
  'INSURANCE_CERTIFICATE',
  'TRADE_LICENSE',
  'GOOD_STANDING_CERTIFICATE',
  'BENEFICIAL_OWNERSHIP',
  'OTHER',
]);
export type SupplierLegalDocType = z.infer<typeof SupplierLegalDocTypeSchema>;

export const SupplierLegalDocStatusSchema = z.enum(['PENDING', 'VERIFIED', 'EXPIRED', 'REJECTED']);
export type SupplierLegalDocStatus = z.infer<typeof SupplierLegalDocStatusSchema>;

export const CreateSupplierLegalDocSchema = z.object({
  docType: SupplierLegalDocTypeSchema,
  documentNumber: z.string().max(100).nullable().optional(),
  issuingAuthority: z.string().max(200).nullable().optional(),
  issueDate: z.string().datetime().nullable().optional(),
  expiryDate: z.string().datetime().nullable().optional(),
  storageKey: z.string().nullable().optional(),
  checksumSha256: z.string().max(64).nullable().optional(),
});
export type CreateSupplierLegalDoc = z.infer<typeof CreateSupplierLegalDocSchema>;

export const RejectSupplierLegalDocSchema = z.object({
  rejectionReason: z.string().min(1),
});
export type RejectSupplierLegalDoc = z.infer<typeof RejectSupplierLegalDocSchema>;

export const UpsertSupplierDocRequirementSchema = z.object({
  accountGroup: SupplierAccountGroupSchema,
  docType: SupplierLegalDocTypeSchema,
  isMandatory: z.boolean(),
  countryCode: z.string().length(3).nullable().optional(),
  isActive: z.boolean().default(true),
});
export type UpsertSupplierDocRequirement = z.infer<typeof UpsertSupplierDocRequirementSchema>;

export const SupplierEvalStatusSchema = z.enum(['DRAFT', 'SUBMITTED', 'APPROVED']);
export type SupplierEvalStatus = z.infer<typeof SupplierEvalStatusSchema>;

export const CreateSupplierEvalCriteriaSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  description: z.string().nullable().optional(),
  weight: z.number().int().min(0).max(100),
  maxScore: z.number().int().min(1).max(10).default(5),
});
export type CreateSupplierEvalCriteria = z.infer<typeof CreateSupplierEvalCriteriaSchema>;

export const CreateSupplierEvalTemplateSchema = z.object({
  companyId: z.string().uuid().nullable().optional(),
  criteria: z.array(CreateSupplierEvalCriteriaSchema).min(1),
});
export type CreateSupplierEvalTemplate = z.infer<typeof CreateSupplierEvalTemplateSchema>;

export const CreateSupplierEvaluationSchema = z.object({
  templateVersionId: z.string().uuid(),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  scores: z
    .array(
      z.object({
        criteriaId: z.string().uuid(),
        score: z.number().int().min(1),
        notes: z.string().nullable().optional(),
      })
    )
    .min(1),
  notes: z.string().nullable().optional(),
});
export type CreateSupplierEvaluation = z.infer<typeof CreateSupplierEvaluationSchema>;

export const SupplierRiskRatingSchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
export type SupplierRiskRating = z.infer<typeof SupplierRiskRatingSchema>;

export const SupplierRiskCategorySchema = z.enum([
  'FINANCIAL',
  'QUALITY',
  'COMPLIANCE',
  'FRAUD',
  'DELIVERY',
  'OTHER',
]);
export type SupplierRiskCategory = z.infer<typeof SupplierRiskCategorySchema>;

export const CreateSupplierRiskIndicatorSchema = z.object({
  riskRating: SupplierRiskRatingSchema,
  riskCategory: SupplierRiskCategorySchema,
  description: z.string().min(1),
  incidentDate: z.string().datetime().nullable().optional(),
  documentId: z.string().uuid().nullable().optional(),
});
export type CreateSupplierRiskIndicator = z.infer<typeof CreateSupplierRiskIndicatorSchema>;

export const SupplierDiversityCodeSchema = z.enum([
  'SMALL_BUSINESS',
  'MINORITY_OWNED',
  'WOMEN_OWNED',
  'VETERAN_OWNED',
  'DISABLED_OWNED',
  'INDIGENOUS_OWNED',
  'LARGE_ENTERPRISE',
  'NONE',
]);
export type SupplierDiversityCode = z.infer<typeof SupplierDiversityCodeSchema>;

export const CreateSupplierDiversitySchema = z.object({
  diversityCode: SupplierDiversityCodeSchema,
  certificateNumber: z.string().max(100).nullable().optional(),
  validFrom: z.string().datetime().nullable().optional(),
  validUntil: z.string().datetime().nullable().optional(),
  documentId: z.string().uuid().nullable().optional(),
});
export type CreateSupplierDiversity = z.infer<typeof CreateSupplierDiversitySchema>;

export const SupplierContactRoleSchema = z.enum([
  'AP_CONTACT',
  'SALES_REP',
  'COMPLIANCE_OFFICER',
  'LOGISTICS',
  'EXECUTIVE',
  'OTHER',
]);
export type SupplierContactRole = z.infer<typeof SupplierContactRoleSchema>;

export const CreateSupplierContactSchema = z.object({
  siteId: z.string().uuid().nullable().optional(),
  role: SupplierContactRoleSchema,
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().max(255),
  phone: z.string().max(50).nullable().optional(),
  jobTitle: z.string().max(200).nullable().optional(),
  isPrimary: z.boolean().default(false),
});
export type CreateSupplierContact = z.infer<typeof CreateSupplierContactSchema>;

export const UpdateSupplierContactSchema = z.object({
  role: SupplierContactRoleSchema.optional(),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  email: z.string().email().max(255).optional(),
  phone: z.string().max(50).nullable().optional(),
  jobTitle: z.string().max(200).nullable().optional(),
  isPrimary: z.boolean().optional(),
  isActive: z.boolean().optional(),
});
export type UpdateSupplierContact = z.infer<typeof UpdateSupplierContactSchema>;

export const UpsertSupplierCompanyOverrideSchema = z.object({
  defaultPaymentTermsId: z.string().uuid().nullable().optional(),
  defaultPaymentMethod: PaymentMethodTypeSchema.nullable().optional(),
  defaultCurrencyId: z.string().uuid().nullable().optional(),
  tolerancePercent: z.coerce.number().min(0).max(100).nullable().optional(),
  isActive: z.boolean().default(true),
});
export type UpsertSupplierCompanyOverride = z.infer<typeof UpsertSupplierCompanyOverrideSchema>;

export const UpsertSupplierAccountGroupConfigSchema = z.object({
  label: z.string().min(1).max(100),
  requiresApproval: z.boolean().default(false),
  requiresTaxVerification: z.boolean().default(false),
  requiresBankVerification: z.boolean().default(false),
  allowOneTimeUse: z.boolean().default(false),
  isActive: z.boolean().default(true),
});
export type UpsertSupplierAccountGroupConfig = z.infer<
  typeof UpsertSupplierAccountGroupConfigSchema
>;

// ─── AP Supplier Recon Schema ──────────────────────────────────────────────

export const SupplierStatementLineSchema = z.object({
  lineRef: z.string().min(1).max(100),
  date: z.string().date(),
  description: z.string().max(500),
  amount: z.coerce.number(),
  currencyCode: z.string().length(3),
});

export const SupplierReconRequestSchema = z.object({
  supplierId: z.string().uuid(),
  asOfDate: z.string().date(),
  statementLines: z.array(SupplierStatementLineSchema).min(1),
  dateTolerance: z.coerce.number().int().min(0).max(30).default(3),
});
export type SupplierReconRequest = z.infer<typeof SupplierReconRequestSchema>;

// ─── AP Hold Schemas ───────────────────────────────────────────────────────

export const ApHoldTypeSchema = z.enum([
  'DUPLICATE',
  'MATCH_EXCEPTION',
  'VALIDATION',
  'SUPPLIER',
  'FX_RATE',
  'MANUAL',
]);
export type ApHoldType = z.infer<typeof ApHoldTypeSchema>;

export const ApHoldStatusSchema = z.enum(['ACTIVE', 'RELEASED']);
export type ApHoldStatus = z.infer<typeof ApHoldStatusSchema>;

export const CreateApHoldSchema = z.object({
  invoiceId: z.string().uuid(),
  holdType: ApHoldTypeSchema,
  holdReason: z.string().min(1).max(500),
});
export type CreateApHold = z.infer<typeof CreateApHoldSchema>;

export const ReleaseApHoldSchema = z.object({
  releaseReason: z.string().min(1).max(500),
});
export type ReleaseApHold = z.infer<typeof ReleaseApHoldSchema>;

export const ApHoldListQuerySchema = PaginationSchema.extend({
  status: ApHoldStatusSchema.optional(),
  holdType: ApHoldTypeSchema.optional(),
  supplierId: z.string().uuid().optional(),
});
export type ApHoldListQuery = z.infer<typeof ApHoldListQuerySchema>;

// ─── AP Schemas (Phase 1a) ─────────────────────────────────────────────────

export const ApInvoiceStatusSchema = z.enum([
  'DRAFT',
  'INCOMPLETE',
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

export const RecordApPaymentSchema = z.object({
  amount: z.coerce.number().positive('Payment amount must be positive'),
  paymentDate: z.string().date('Invalid payment date'),
  paymentRef: z.string().min(1, 'Payment reference is required').max(100),
});
export type RecordApPayment = z.infer<typeof RecordApPaymentSchema>;

export const AssetRegisterQuerySchema = z.object({
  asOfDate: z.string().date().optional(),
});
export type AssetRegisterQuery = z.infer<typeof AssetRegisterQuerySchema>;

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

export const ReversePaymentRunSchema = z.object({
  reason: z.string().min(1).max(500),
});
export type ReversePaymentRun = z.infer<typeof ReversePaymentRunSchema>;

export const PaymentRunListQuerySchema = PaginationSchema.extend({
  status: PaymentRunStatusSchema.optional(),
});
export type PaymentRunListQuery = z.infer<typeof PaymentRunListQuerySchema>;

// ─── AP Wave 3: Reporting & Proposal Schemas ────────────────────────────────

export const ApPeriodCloseChecklistQuerySchema = z.object({});
export type ApPeriodCloseChecklistQuery = z.infer<typeof ApPeriodCloseChecklistQuerySchema>;

export const WhtReportQuerySchema = z.object({
  fromDate: z.string().date(),
  toDate: z.string().date(),
  supplierId: z.string().uuid().optional(),
  incomeType: z.string().max(100).optional(),
});
export type WhtReportQuery = z.infer<typeof WhtReportQuerySchema>;

export const InvoiceAuditTimelineQuerySchema = z.object({});
export type InvoiceAuditTimelineQuery = z.infer<typeof InvoiceAuditTimelineQuerySchema>;

export const ApHoldListQueryWithDateRangeSchema = PaginationSchema.extend({
  status: ApHoldStatusSchema.optional(),
  holdType: ApHoldTypeSchema.optional(),
  supplierId: z.string().uuid().optional(),
  fromDate: z.string().date().optional(),
  toDate: z.string().date().optional(),
});
export type ApHoldListQueryWithDateRange = z.infer<typeof ApHoldListQueryWithDateRangeSchema>;

export const PaymentProposalRequestSchema = z.object({
  paymentDate: z.string().date(),
  cutoffDate: z.string().date(),
  includeDiscountOpportunities: z.boolean().default(false),
  supplierFilter: z.array(z.string().uuid()).optional(),
  paymentMethodFilter: PaymentMethodTypeSchema.optional(),
  currencyFilter: z.string().length(3).optional(),
});
export type PaymentProposalRequest = z.infer<typeof PaymentProposalRequestSchema>;

export const ToleranceScopeSchema = z.enum(['ORG', 'COMPANY', 'SITE']);
export type ToleranceScope = z.infer<typeof ToleranceScopeSchema>;

export const CreateMatchToleranceSchema = z.object({
  scope: ToleranceScopeSchema,
  scopeEntityId: z.string().uuid().nullable().optional(),
  companyId: z.string().uuid().nullable().optional(),
  toleranceBps: z.coerce.number().int().min(0).max(10000),
  quantityTolerancePercent: z.coerce.number().nonnegative().default(0),
  autoHold: z.boolean().default(true),
});
export type CreateMatchTolerance = z.infer<typeof CreateMatchToleranceSchema>;

export const UpdateMatchToleranceSchema = z.object({
  toleranceBps: z.coerce.number().int().min(0).max(10000).optional(),
  quantityTolerancePercent: z.coerce.number().nonnegative().optional(),
  autoHold: z.boolean().optional(),
  isActive: z.boolean().optional(),
});
export type UpdateMatchTolerance = z.infer<typeof UpdateMatchToleranceSchema>;

// ─── AP Wave 4: Capture, Integration & Feedback ─────────────────────────────

export const ApInvoiceTypeSchema = z.enum(['STANDARD', 'DEBIT_MEMO', 'CREDIT_MEMO', 'PREPAYMENT']);
export type ApInvoiceType = z.infer<typeof ApInvoiceTypeSchema>;

export const CreateCreditMemoSchema = z.object({
  originalInvoiceId: z.string().uuid(),
  reason: z.string().min(1).max(500),
});
export type CreateCreditMemo = z.infer<typeof CreateCreditMemoSchema>;

export const BatchInvoiceImportSchema = z.object({
  rows: z
    .array(
      z.object({
        companyId: z.string().uuid(),
        supplierId: z.string().uuid(),
        ledgerId: z.string().uuid(),
        invoiceNumber: z.string().min(1).max(100),
        supplierRef: z.string().max(200).nullable().optional(),
        invoiceDate: z.string().date(),
        dueDate: z.string().date(),
        currencyCode: z.string().length(3),
        description: z.string().max(500).nullable().optional(),
        poRef: z.string().max(100).nullable().optional(),
        receiptRef: z.string().max(100).nullable().optional(),
        paymentTermsId: z.string().uuid().nullable().optional(),
        lines: z
          .array(
            z.object({
              accountId: z.string().uuid(),
              description: z.string().max(500).nullable().optional(),
              quantity: z.coerce.number().int().positive().default(1),
              unitPrice: z.coerce.number().nonnegative(),
              amount: z.coerce.number().nonnegative(),
              taxAmount: z.coerce.number().nonnegative().default(0),
            })
          )
          .min(1),
      })
    )
    .min(1)
    .max(500),
});
export type BatchInvoiceImport = z.infer<typeof BatchInvoiceImportSchema>;

export const BankRejectionSchema = z.object({
  rejectionCode: z.string().min(1).max(50),
  rejectionReason: z.string().min(1).max(500),
  rejectedItemIds: z.array(z.string().uuid()).optional(),
});
export type BankRejection = z.infer<typeof BankRejectionSchema>;

export const ApplyPrepaymentSchema = z.object({
  prepaymentId: z.string().uuid(),
  targetInvoiceId: z.string().uuid(),
  amount: z.coerce.number().nonnegative(),
});
export type ApplyPrepaymentDto = z.infer<typeof ApplyPrepaymentSchema>;

export const WhtCertificateTypeSchema = z.enum(['STANDARD', 'EXEMPTION']);
export type WhtCertificateType = z.infer<typeof WhtCertificateTypeSchema>;

export const CreateWhtExemptionSchema = z.object({
  supplierId: z.string().uuid(),
  incomeType: z.string().min(1).max(100),
  exemptionReason: z.string().min(1).max(500),
  effectiveFrom: z.string().date(),
  effectiveTo: z.string().date(),
});
export type CreateWhtExemption = z.infer<typeof CreateWhtExemptionSchema>;

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

// ─── Phase 8: Expense Claims ────────────────────────────────────────────────
export const ExpenseCategorySchema = z.enum([
  'TRAVEL',
  'MEALS',
  'ACCOMMODATION',
  'TRANSPORT',
  'OFFICE_SUPPLIES',
  'COMMUNICATION',
  'PROFESSIONAL_DEVELOPMENT',
  'ENTERTAINMENT',
  'OTHER',
]);
export type ExpenseCategory = z.infer<typeof ExpenseCategorySchema>;

export const CreateExpenseClaimSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  currency: z.string().length(3),
  periodFrom: z.string().date(),
  periodTo: z.string().date(),
});
export type CreateExpenseClaim = z.infer<typeof CreateExpenseClaimSchema>;

export const AddExpenseLineItemSchema = z.object({
  expenseDate: z.string().date(),
  category: ExpenseCategorySchema,
  description: z.string().min(1).max(500),
  merchantName: z.string().min(1).max(200),
  amount: z.coerce.number().positive(),
  currency: z.string().length(3),
  glAccountId: z.string().uuid(),
  costCenterId: z.string().uuid().optional(),
});
export type AddExpenseLineItem = z.infer<typeof AddExpenseLineItemSchema>;

// ─── Phase 8: Fixed Assets ──────────────────────────────────────────────────
export const AssetCategorySchema = z.enum([
  'LAND',
  'BUILDINGS',
  'PLANT_MACHINERY',
  'VEHICLES',
  'FURNITURE_FIXTURES',
  'IT_EQUIPMENT',
  'LEASEHOLD_IMPROVEMENTS',
  'OTHER',
]);
export type AssetCategory = z.infer<typeof AssetCategorySchema>;

export const DepreciationMethodSchema = z.enum([
  'STRAIGHT_LINE',
  'DECLINING_BALANCE',
  'UNITS_OF_PRODUCTION',
  'SUM_OF_YEARS_DIGITS',
]);
export type DepreciationMethod = z.infer<typeof DepreciationMethodSchema>;

export const CreateFixedAssetSchema = z.object({
  companyId: z.string().uuid(),
  assetNumber: z.string().min(1).max(30),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  category: AssetCategorySchema,
  acquisitionDate: z.string().date(),
  acquisitionCost: z.coerce.number().nonnegative(),
  residualValue: z.coerce.number().nonnegative().default(0),
  usefulLifeMonths: z.coerce.number().int().positive(),
  depreciationMethod: DepreciationMethodSchema,
  currencyCode: z.string().length(3),
  location: z.string().max(200).optional(),
  department: z.string().max(200).optional(),
  responsiblePerson: z.string().max(200).optional(),
  glAccountAsset: z.string().uuid(),
  glAccountDepreciation: z.string().uuid(),
  glAccountAccumulated: z.string().uuid(),
  costCenterId: z.string().uuid().optional(),
});
export type CreateFixedAsset = z.infer<typeof CreateFixedAssetSchema>;

// ─── Phase 8: Tax Codes & Returns ───────────────────────────────────────────
export const TaxTypeSchema = z.enum([
  'VAT',
  'GST',
  'SALES_TAX',
  'SERVICE_TAX',
  'WITHHOLDING',
  'EXCISE',
  'OTHER',
]);
export type TaxType = z.infer<typeof TaxTypeSchema>;

export const CreateTaxCodeSchema = z.object({
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  taxType: TaxTypeSchema,
  rate: z.coerce.number().min(0).max(100),
  effectiveFrom: z.string().date(),
  effectiveTo: z.string().date().optional(),
  isReverseCharge: z.boolean().default(false),
  glAccountCollected: z.string().uuid(),
  glAccountPaid: z.string().uuid(),
});
export type CreateTaxCode = z.infer<typeof CreateTaxCodeSchema>;

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
  'SUPPLIER',
  'SUPPLIER_CONTRACT',
  'SUPPLIER_STATEMENT',
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

// ═══════════════════════════════════════════════════════════════════════════
// Frontend Server Action Schemas (W04 compliance)
// ═══════════════════════════════════════════════════════════════════════════

// ─── Chart of Accounts ──────────────────────────────────────────────────────

export const AccountTypeSchema = z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']);
export const NormalBalanceSchema = z.enum(['DEBIT', 'CREDIT']);

export const CreateAccountPayloadSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  type: AccountTypeSchema,
  normalBalance: NormalBalanceSchema,
  isActive: z.boolean(),
});
export type CreateAccountPayload = z.infer<typeof CreateAccountPayloadSchema>;

export const UpdateAccountPayloadSchema = z.object({
  name: z.string().min(1).optional(),
  type: AccountTypeSchema.optional(),
  normalBalance: NormalBalanceSchema.optional(),
});
export type UpdateAccountPayload = z.infer<typeof UpdateAccountPayloadSchema>;

// ─── Approvals ──────────────────────────────────────────────────────────────

export const ApproveItemsInputSchema = z.object({
  itemIds: z.array(z.string()).min(1),
  comment: z.string().max(1000).optional(),
});
export type ApproveItemsInput = z.infer<typeof ApproveItemsInputSchema>;

export const RejectItemsInputSchema = z.object({
  itemIds: z.array(z.string()).min(1),
  comment: z.string().min(1).max(1000),
});
export type RejectItemsInput = z.infer<typeof RejectItemsInputSchema>;

export const DelegateItemsInputSchema = z.object({
  itemIds: z.array(z.string()).min(1),
  delegateTo: z.string().min(1),
  comment: z.string().max(1000).optional(),
});
export type DelegateItemsInput = z.infer<typeof DelegateItemsInputSchema>;

// ─── Consolidation ──────────────────────────────────────────────────────────

export const EntityTypeEnum = z.enum(['subsidiary', 'associate', 'joint_venture', 'branch']);
export const ConsolidationMethodEnum = z.enum(['full', 'proportional', 'equity_method']);

export const AddEntityInputSchema = z.object({
  entityCode: z.string().min(1),
  name: z.string().min(1),
  country: z.string().min(1),
  currency: z.string().length(3),
  entityType: EntityTypeEnum,
  consolidationMethod: ConsolidationMethodEnum,
  parentId: z.string().uuid(),
  ownershipPercent: z.coerce.number().min(0).max(100),
  votingRightsPercent: z.coerce.number().min(0).max(100),
  acquisitionDate: z.coerce.date(),
});
export type AddEntityInput = z.infer<typeof AddEntityInputSchema>;

// ─── Cost Accounting ────────────────────────────────────────────────────────

export const CostCenterTypeEnum = z.enum(['production', 'service', 'administration', 'selling']);
export const DriverTypeEnum = z.enum([
  'headcount',
  'square_footage',
  'machine_hours',
  'revenue',
  'custom',
]);
export const AllocationMethodEnum = z.enum(['direct', 'step_down', 'reciprocal', 'activity_based']);

export const CreateCostCenterInputSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  type: CostCenterTypeEnum,
  parentId: z.string().uuid().optional(),
  managerId: z.string().uuid().optional(),
  budgetAmount: z.coerce.number().nonnegative(),
  currency: z.string().length(3),
});
export type CreateCostCenterInput = z.infer<typeof CreateCostCenterInputSchema>;

export const UpdateCostCenterInputSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  managerId: z.string().uuid().optional(),
  budgetAmount: z.coerce.number().nonnegative().optional(),
});
export type UpdateCostCenterInput = z.infer<typeof UpdateCostCenterInputSchema>;

export const CreateDriverInputSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  type: DriverTypeEnum,
  unit: z.string().min(1),
  effectiveFrom: z.coerce.date(),
});
export type CreateDriverInput = z.infer<typeof CreateDriverInputSchema>;

export const AllocationTargetSchema = z.object({
  costCenterId: z.string().uuid(),
  percentage: z.coerce.number().min(0).max(100),
});

export const CreateRuleInputSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  sourceCostCenterId: z.string().uuid(),
  driverId: z.string().uuid(),
  method: AllocationMethodEnum,
  targets: z.array(AllocationTargetSchema).min(1),
});
export type CreateRuleInput = z.infer<typeof CreateRuleInputSchema>;

export const CreateAllocationRunInputSchema = z.object({
  period: z.string().min(1),
  method: AllocationMethodEnum,
  ruleIds: z.array(z.string().uuid()).optional(),
});
export type CreateAllocationRunInput = z.infer<typeof CreateAllocationRunInputSchema>;

// ─── Credit ─────────────────────────────────────────────────────────────────

export const ReviewFrequencyEnum = z.enum(['monthly', 'quarterly', 'annually']);
export const CreditReviewTypeEnum = z.enum([
  'periodic',
  'limit_increase',
  'new_customer',
  'risk_triggered',
]);
export const CreditRiskRatingEnum = z.enum(['low', 'medium', 'high', 'very_high']);
export const CreditHoldTypeEnum = z.enum(['credit_limit', 'overdue', 'manual', 'payment_terms']);

export const SetCreditLimitInputSchema = z.object({
  customerId: z.string().uuid(),
  creditLimit: z.coerce.number().nonnegative(),
  currency: z.string().length(3),
  paymentTermsDays: z.coerce.number().int().positive(),
  reviewFrequency: ReviewFrequencyEnum,
  notes: z.string().max(2000).optional(),
});
export type SetCreditLimitInput = z.infer<typeof SetCreditLimitInputSchema>;

export const CreateReviewInputSchema = z.object({
  customerId: z.string().uuid(),
  reviewType: CreditReviewTypeEnum,
  proposedLimit: z.coerce.number().nonnegative(),
  proposedRating: CreditRiskRatingEnum,
  justification: z.string().min(1),
});
export type CreateReviewInput = z.infer<typeof CreateReviewInputSchema>;

export const UpdateReviewInputSchema = z.object({
  reviewId: z.string().uuid(),
  financialAnalysis: z.string().optional(),
  paymentHistory: z.string().optional(),
  recommendation: z.string().optional(),
  proposedLimit: z.coerce.number().nonnegative().optional(),
  proposedRating: CreditRiskRatingEnum.optional(),
});
export type UpdateReviewInput = z.infer<typeof UpdateReviewInputSchema>;

export const PlaceHoldInputSchema = z.object({
  customerId: z.string().uuid(),
  holdType: CreditHoldTypeEnum,
  reason: z.string().min(1),
  amount: z.coerce.number().nonnegative().optional(),
});
export type PlaceHoldInput = z.infer<typeof PlaceHoldInputSchema>;

// ─── Deferred Tax ───────────────────────────────────────────────────────────

export const DeferredTaxTypeEnum = z.enum(['asset', 'liability']);
export const OriginTypeEnum = z.enum([
  'temporary_difference',
  'tax_loss_carryforward',
  'tax_credit',
]);

export const CreateDTItemInputSchema = z.object({
  description: z.string().min(1),
  type: DeferredTaxTypeEnum,
  originType: OriginTypeEnum,
  bookBasis: z.coerce.number(),
  taxBasis: z.coerce.number(),
  taxRate: z.coerce.number().min(0).max(100),
  jurisdiction: z.string().min(1),
  glAccountId: z.string().uuid(),
});
export type CreateDTItemInput = z.infer<typeof CreateDTItemInputSchema>;

// ─── Hedging ────────────────────────────────────────────────────────────────

export const DesignateHedgeInputSchema = z.object({
  name: z.string().min(1),
  hedgeType: HedgeTypeSchema,
  hedgedItemId: z.string().uuid(),
  hedgingInstrumentId: z.string().uuid(),
  hedgeRatio: z.coerce.number().positive(),
  hedgedRisk: z.string().min(1),
  designationDate: z.coerce.date(),
});
export type DesignateHedgeInput = z.infer<typeof DesignateHedgeInputSchema>;

// ─── Financial Instruments ──────────────────────────────────────────────────

export const InstrumentCategoryEnum = z.enum(['debt', 'equity', 'derivative', 'hybrid']);

export const CreateInstrumentInputSchema = z.object({
  name: z.string().min(1),
  type: InstrumentTypeSchema,
  category: InstrumentCategoryEnum,
  issuer: z.string().min(1),
  currency: z.string().length(3),
  faceValue: z.coerce.number().nonnegative(),
  acquisitionCost: z.coerce.number().nonnegative(),
  acquisitionDate: z.coerce.date(),
  interestRate: z.coerce.number().nonnegative().optional(),
  maturityDate: z.coerce.date().optional(),
  glAccountId: z.string().uuid(),
});
export type CreateInstrumentInput = z.infer<typeof CreateInstrumentInputSchema>;

// ─── Leases ─────────────────────────────────────────────────────────────────

export const LeaseTypeEnum = z.enum(['finance', 'operating', 'short_term', 'low_value']);
export const AssetClassEnum = z.enum(['property', 'vehicle', 'equipment', 'it_equipment', 'other']);
export const PaymentFrequencyEnum = z.enum(['monthly', 'quarterly', 'semi_annual', 'annual']);
export const ModificationTypeEnum = z.enum([
  'scope_change',
  'term_extension',
  'payment_change',
  'index_adjustment',
]);

export const CreateLeaseInputSchema = z.object({
  description: z.string().min(1),
  lessorId: z.string().uuid(),
  assetClass: AssetClassEnum,
  assetDescription: z.string().min(1),
  leaseType: LeaseTypeEnum,
  commencementDate: z.coerce.date(),
  endDate: z.coerce.date(),
  paymentAmount: z.coerce.number().nonnegative(),
  paymentFrequency: PaymentFrequencyEnum,
  currency: z.string().length(3),
  incrementalBorrowingRate: z.coerce.number().nonnegative(),
  hasExtensionOption: z.boolean().optional(),
  extensionPeriod: z.coerce.number().int().positive().optional(),
  hasTerminationOption: z.boolean().optional(),
  terminationPenalty: z.coerce.number().nonnegative().optional(),
  hasPurchaseOption: z.boolean().optional(),
  purchasePrice: z.coerce.number().nonnegative().optional(),
  costCenterId: z.string().uuid().optional(),
  glAccountAsset: z.string().uuid(),
  glAccountLiability: z.string().uuid(),
  glAccountInterest: z.string().uuid(),
  glAccountDepreciation: z.string().uuid(),
});
export type CreateLeaseInput = z.infer<typeof CreateLeaseInputSchema>;

export const CreateModificationInputSchema = z.object({
  leaseId: z.string().uuid(),
  effectiveDate: z.coerce.date(),
  modificationType: ModificationTypeEnum,
  description: z.string().min(1),
  revisedPaymentAmount: z.coerce.number().nonnegative().optional(),
  revisedEndDate: z.coerce.date().optional(),
  revisedIBR: z.coerce.number().nonnegative().optional(),
});
export type CreateModificationInput = z.infer<typeof CreateModificationInputSchema>;

// ─── Ledgers ────────────────────────────────────────────────────────────────

export const CreateLedgerPayloadSchema = z.object({
  name: z.string().min(1),
  companyId: z.string().uuid(),
  baseCurrencyCode: z.string().length(3),
});
export type CreateLedgerPayload = z.infer<typeof CreateLedgerPayloadSchema>;

// ─── Projects ───────────────────────────────────────────────────────────────

export const ProjectTypeEnum = z.enum([
  'fixed_price',
  'time_materials',
  'cost_plus',
  'retainer',
  'internal',
]);
export const BillingMethodEnum = z.enum(['milestone', 'progress', 'time_materials', 'fixed_fee']);
export const RevenueRecognitionEnum = z.enum([
  'percentage_completion',
  'completed_contract',
  'milestone',
  'straight_line',
]);
export const CostTypeEnum = z.enum([
  'labor',
  'material',
  'subcontractor',
  'travel',
  'equipment',
  'overhead',
  'other',
]);

export const CreateProjectInputSchema = z.object({
  projectNumber: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  customerId: z.string().uuid().optional(),
  projectType: ProjectTypeEnum,
  billingMethod: BillingMethodEnum,
  revenueRecognition: RevenueRecognitionEnum,
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  projectManager: z.string().min(1),
  department: z.string().min(1),
  contractValue: z.coerce.number().nonnegative(),
  budgetedCost: z.coerce.number().nonnegative(),
  currency: z.string().length(3),
  costCenterId: z.string().uuid().optional(),
});
export type CreateProjectInput = z.infer<typeof CreateProjectInputSchema>;

export const UpdateProjectInputSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  projectManager: z.string().min(1).optional(),
  endDate: z.coerce.date().optional(),
  budgetedCost: z.coerce.number().nonnegative().optional(),
});
export type UpdateProjectInput = z.infer<typeof UpdateProjectInputSchema>;

export const AddCostInputSchema = z.object({
  projectId: z.string().uuid(),
  costType: CostTypeEnum,
  date: z.coerce.date(),
  description: z.string().min(1),
  quantity: z.coerce.number().positive(),
  unitCost: z.coerce.number().nonnegative(),
  glAccountId: z.string().uuid(),
  isBillable: z.boolean(),
  employeeId: z.string().uuid().optional(),
  vendorId: z.string().uuid().optional(),
});
export type AddCostInput = z.infer<typeof AddCostInputSchema>;

export const CreateBillingInputSchema = z.object({
  projectId: z.string().uuid(),
  description: z.string().min(1),
  billingDate: z.coerce.date(),
  amount: z.coerce.number().nonnegative(),
  milestoneId: z.string().uuid().optional(),
  percentageComplete: z.coerce.number().min(0).max(100).optional(),
});
export type CreateBillingInput = z.infer<typeof CreateBillingInputSchema>;

export const CreateMilestoneInputSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(1),
  description: z.string(),
  dueDate: z.coerce.date(),
  billingAmount: z.coerce.number().nonnegative(),
  percentageWeight: z.coerce.number().min(0).max(100),
  deliverables: z.array(z.string().min(1)),
});
export type CreateMilestoneInput = z.infer<typeof CreateMilestoneInputSchema>;

export const BillingWizardInputSchema = z.object({
  projectId: z.string().uuid(),
  billingType: z.enum(['milestone', 'progress', 'time_materials', 'final']),
  selectedMilestones: z.array(z.string().uuid()).optional(),
  progressPercentage: z.coerce.number().min(0).max(100).optional(),
  dateRange: z.object({ from: z.coerce.date(), to: z.coerce.date() }).optional(),
  customAmount: z.coerce.number().nonnegative().optional(),
  notes: z.string().max(2000).optional(),
});
export type BillingWizardInput = z.infer<typeof BillingWizardInputSchema>;

// ─── Provisions ─────────────────────────────────────────────────────────────

export const ProvisionTypeEnum = z.enum([
  'warranty',
  'restructuring',
  'legal',
  'decommissioning',
  'onerous_contract',
  'other',
]);

export const CreateProvisionInputSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  type: ProvisionTypeEnum,
  recognitionDate: z.coerce.date(),
  expectedSettlementDate: z.coerce.date().optional(),
  initialAmount: z.coerce.number().nonnegative(),
  currency: z.string().length(3),
  discountRate: z.coerce.number().nonnegative().optional(),
  glAccountId: z.string().uuid(),
  costCenterId: z.string().uuid().optional(),
});
export type CreateProvisionInput = z.infer<typeof CreateProvisionInputSchema>;

// ─── Transfer Pricing ───────────────────────────────────────────────────────

export const TpTransactionTypeEnum = z.enum([
  'goods',
  'services',
  'royalties',
  'financing',
  'cost_sharing',
]);
export const TpPricingMethodEnum = z.enum([
  'cup',
  'resale_price',
  'cost_plus',
  'tnmm',
  'profit_split',
]);

export const CreatePolicyInputSchema = z.object({
  name: z.string().min(1),
  transactionType: TpTransactionTypeEnum,
  pricingMethod: TpPricingMethodEnum,
  entities: z.array(z.string().min(1)).min(1),
  armLengthRange: z.object({ min: z.coerce.number(), max: z.coerce.number() }),
  targetMargin: z.coerce.number(),
  effectiveFrom: z.coerce.date(),
});
export type CreatePolicyInput = z.infer<typeof CreatePolicyInputSchema>;

// ─── Treasury ───────────────────────────────────────────────────────────────

export const ForecastPeriodTypeEnum = z.enum(['daily', 'weekly', 'monthly', 'quarterly']);
export const ICLoanTypeEnum = z.enum(['term_loan', 'revolving', 'demand_loan', 'subordinated']);

export const CreateForecastInputSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  periodType: ForecastPeriodTypeEnum,
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  currency: z.string().length(3),
  openingBalance: z.coerce.number(),
});
export type CreateForecastInput = z.infer<typeof CreateForecastInputSchema>;

export const CreateCovenantInputSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  type: z.enum(['financial', 'reporting', 'operational']),
  facilityId: z.string().min(1),
  metric: z.string().min(1),
  operator: z.string().min(1),
  threshold: z.coerce.number(),
  thresholdMax: z.coerce.number().optional(),
  testingFrequency: z.enum(['monthly', 'quarterly', 'annually']),
  gracePeriodDays: z.coerce.number().int().nonnegative(),
  consequences: z.string().min(1),
});
export type CreateCovenantInput = z.infer<typeof CreateCovenantInputSchema>;

export const TestCovenantInputSchema = z.object({
  covenantId: z.string().uuid(),
  periodEnd: z.coerce.date(),
  actualValue: z.coerce.number(),
  notes: z.string(),
});
export type TestCovenantInput = z.infer<typeof TestCovenantInputSchema>;

export const CreateICLoanInputSchema = z.object({
  lenderEntityId: z.string().uuid(),
  borrowerEntityId: z.string().uuid(),
  type: ICLoanTypeEnum,
  principal: z.coerce.number().positive(),
  currency: z.string().length(3),
  interestRate: z.coerce.number().nonnegative(),
  rateType: z.enum(['fixed', 'floating']),
  referenceRate: z.string().optional(),
  spread: z.coerce.number().optional(),
  startDate: z.coerce.date(),
  maturityDate: z.coerce.date(),
});
export type CreateICLoanInput = z.infer<typeof CreateICLoanInputSchema>;

// ─── Supplier Portal Schemas ──────────────────────────────────────────────

export const SupplierPortalInvoiceLineSchema = z.object({
  accountId: z.string().uuid(),
  description: z.string().max(500).nullable().optional(),
  quantity: z.coerce.number().positive(),
  unitPrice: z.coerce.bigint(),
  amount: z.coerce.bigint(),
  taxAmount: z.coerce.bigint(),
});

export const SupplierPortalInvoiceRowSchema = z.object({
  companyId: z.string().uuid(),
  ledgerId: z.string().uuid(),
  invoiceNumber: z.string().min(1).max(50),
  supplierRef: z.string().max(100).nullable().optional(),
  invoiceDate: z.string().date(),
  dueDate: z.string().date(),
  currencyCode: z.string().length(3),
  description: z.string().max(500).nullable().optional(),
  poRef: z.string().max(100).nullable().optional(),
  receiptRef: z.string().max(100).nullable().optional(),
  paymentTermsId: z.string().uuid().nullable().optional(),
  lines: z.array(SupplierPortalInvoiceLineSchema).min(1),
});

export const SupplierPortalInvoiceSubmitSchema = z.object({
  rows: z.array(SupplierPortalInvoiceRowSchema).min(1),
  correlationId: z.string().uuid().optional(),
});
export type SupplierPortalInvoiceSubmit = z.infer<typeof SupplierPortalInvoiceSubmitSchema>;

export const SupplierPortalProfileUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  taxId: z.string().max(50).nullable().optional(),
  remittanceEmail: z.string().email().max(255).nullable().optional(),
});
export type SupplierPortalProfileUpdate = z.infer<typeof SupplierPortalProfileUpdateSchema>;

export const SupplierPortalAgingQuerySchema = z.object({
  asOfDate: z.string().date().optional(),
});
export type SupplierPortalAgingQuery = z.infer<typeof SupplierPortalAgingQuerySchema>;

export const SupplierPortalWhtQuerySchema = PaginationSchema.extend({
  taxYear: z.coerce.number().int().min(2000).max(2100).optional(),
});
export type SupplierPortalWhtQuery = z.infer<typeof SupplierPortalWhtQuerySchema>;

// ── N7: Supplier Portal Statement Recon ───────────────────────────────────
export const SupplierPortalStatementLineSchema = z.object({
  lineRef: z.string().min(1).max(100),
  date: z.string().date(),
  description: z.string().min(1).max(500),
  amount: z.coerce.bigint(),
  currencyCode: z.string().length(3),
});

export const SupplierPortalStatementReconSchema = z.object({
  asOfDate: z.string().date(),
  statementLines: z.array(SupplierPortalStatementLineSchema).min(1),
  dateTolerance: z.coerce.number().int().min(0).max(30).optional(),
});
export type SupplierPortalStatementRecon = z.infer<typeof SupplierPortalStatementReconSchema>;

// ── N8: Supplier Document Vault ───────────────────────────────────────────
export const SupplierDocumentCategorySchema = z.enum([
  'CONTRACT',
  'TAX_NOTICE',
  'INSURANCE_POLICY',
  'CORRESPONDENCE',
  'OTHER',
]);

export const SupplierPortalDocumentUploadSchema = z.object({
  category: SupplierDocumentCategorySchema,
  title: z.string().min(1).max(255),
  description: z.string().max(1000).nullable().optional(),
  fileName: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(100),
  expiresAt: z.string().date().nullable().optional(),
});
export type SupplierPortalDocumentUpload = z.infer<typeof SupplierPortalDocumentUploadSchema>;

export const SupplierPortalDocumentListQuerySchema = z.object({
  category: SupplierDocumentCategorySchema.optional(),
});
export type SupplierPortalDocumentListQuery = z.infer<typeof SupplierPortalDocumentListQuerySchema>;

// ── N9: Supplier Dispute ──────────────────────────────────────────────────
export const SupplierDisputeCategorySchema = z.enum([
  'INCORRECT_AMOUNT',
  'MISSING_PAYMENT',
  'DUPLICATE_CHARGE',
  'PRICING_DISCREPANCY',
  'DELIVERY_ISSUE',
  'QUALITY_ISSUE',
  'OTHER',
]);

export const SupplierPortalCreateDisputeSchema = z.object({
  invoiceId: z.string().uuid().nullable().optional(),
  paymentRunId: z.string().uuid().nullable().optional(),
  category: SupplierDisputeCategorySchema,
  subject: z.string().min(1).max(255),
  description: z.string().min(1).max(5000),
});
export type SupplierPortalCreateDispute = z.infer<typeof SupplierPortalCreateDisputeSchema>;

// ── N10: Supplier Notification Preferences ────────────────────────────────
export const SupplierNotificationEventTypeSchema = z.enum([
  'INVOICE_POSTED',
  'INVOICE_APPROVED',
  'PAYMENT_EXECUTED',
  'PAYMENT_REJECTED',
  'HOLD_PLACED',
  'HOLD_RELEASED',
  'REMITTANCE_READY',
  'DISPUTE_UPDATED',
]);

export const SupplierNotificationChannelSchema = z.enum(['EMAIL', 'WEBHOOK']);

export const SupplierNotificationPrefItemSchema = z.object({
  eventType: SupplierNotificationEventTypeSchema,
  channel: SupplierNotificationChannelSchema,
  enabled: z.boolean(),
  webhookUrl: z.string().url().nullable().optional(),
});

export const SupplierPortalUpdateNotificationPrefsSchema = z.object({
  preferences: z.array(SupplierNotificationPrefItemSchema).min(1),
});
export type SupplierPortalUpdateNotificationPrefs = z.infer<
  typeof SupplierPortalUpdateNotificationPrefsSchema
>;

// ─── OCR Pipeline Schemas ─────────────────────────────────────────────────

export const OcrConfidenceLevelSchema = z.enum(['HIGH', 'MEDIUM', 'LOW']);
export type OcrConfidenceLevel = z.infer<typeof OcrConfidenceLevelSchema>;

export const OcrJobStatusSchema = z.enum([
  'CLAIMED',
  'UPLOADED',
  'EXTRACTING',
  'SCORED',
  'INVOICE_CREATING',
  'COMPLETED',
  'FAILED',
]);
export type OcrJobStatus = z.infer<typeof OcrJobStatusSchema>;

export const OcrUploadContextSchema = z.object({
  companyId: z.string().uuid(),
  ledgerId: z.string().uuid(),
  defaultAccountId: z.string().uuid(),
  forceRetry: z.boolean().optional(),
});
export type OcrUploadContext = z.infer<typeof OcrUploadContextSchema>;

export const OcrUploadResponseSchema = z.object({
  jobId: z.string().uuid(),
  invoiceId: z.string().uuid().nullable(),
  status: OcrJobStatusSchema,
  confidence: OcrConfidenceLevelSchema.nullable(),
  errorReason: z.string().nullable(),
});
export type OcrUploadResponse = z.infer<typeof OcrUploadResponseSchema>;

// ─── Response View-Model Schemas (auto-generated) ─────────────────────────
// Generated by: node tools/scripts/gen-response-schemas.mjs
// These schemas provide contract coverage for response types used in query files.

// ── Finance Response Schemas ──

// account
export const AccountListItemSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  type: AccountTypeSchema,
  normalBalance: NormalBalanceSchema,
  parentId: z.string().nullable(),
  isActive: z.boolean(),
});
export type AccountListItem = z.infer<typeof AccountListItemSchema>;

export const AccountDetailSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  type: AccountTypeSchema,
  normalBalance: NormalBalanceSchema,
  parentId: z.string().nullable(),
  isActive: z.boolean(),
  companyId: z.string(),
});
export type AccountDetail = z.infer<typeof AccountDetailSchema>;

// approvals
export const GetApprovalsParamsSchema = z.object({
  status: z.union([z.string(), z.string(), z.string(), z.string()]).optional(),
  documentType: z.string().optional(),
  slaStatus: z.union([z.string(), z.string(), z.string()]).optional(),
  page: z.number().optional(),
  limit: z.number().optional(),
});
export type GetApprovalsParams = z.infer<typeof GetApprovalsParamsSchema>;

// budget
export const BudgetEntryListItemSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  accountCode: z.string(),
  accountName: z.string().optional(),
  periodId: z.string(),
  periodName: z.string().optional(),
  budgetAmount: z.string(),
  version: z.number(),
  versionNote: z.string().optional(),
});
export type BudgetEntryListItem = z.infer<typeof BudgetEntryListItemSchema>;

export const BudgetVarianceRowSchema = z.object({
  accountId: z.string(),
  accountCode: z.string(),
  accountName: z.string(),
  budgetAmount: z.string(),
  actualAmount: z.string(),
  variance: z.string(),
  variancePct: z.number(),
});
export type BudgetVarianceRow = z.infer<typeof BudgetVarianceRowSchema>;

export const BudgetVarianceResultSchema = z.object({
  ledgerId: z.string(),
  periodId: z.string(),
  rows: z.array(BudgetVarianceRowSchema),
  totalBudget: z.string(),
  totalActual: z.string(),
  totalVariance: z.string(),
});
export type BudgetVarianceResult = z.infer<typeof BudgetVarianceResultSchema>;

export const VarianceAlertSchema = z.object({
  accountCode: z.string(),
  accountName: z.string(),
  budgetAmount: z.string(),
  actualAmount: z.string(),
  variance: z.string(),
  variancePct: z.number(),
  severity: z.enum(['WARNING', 'CRITICAL']),
});
export type VarianceAlert = z.infer<typeof VarianceAlertSchema>;

export const VarianceAlertsResultSchema = z.object({
  alerts: z.array(VarianceAlertSchema),
  ledgerId: z.string(),
  periodId: z.string(),
  warningPct: z.number(),
  criticalPct: z.number(),
});
export type VarianceAlertsResult = z.infer<typeof VarianceAlertsResultSchema>;

// consolidation
export type GroupEntityView = {
  id: string;
  entityCode: string;
  name: string;
  country: string;
  currency: string;
  entityType: string;
  consolidationMethod: string;
  status: string;
  parentId: string | null;
  ownershipPercent: number;
  votingRightsPercent: number;
  acquisitionDate: string | null;
  divestmentDate: string | null;
  functionalCurrency: string;
  reportingCurrency: string;
  fxRate: number;
  children?: GroupEntityView[];
};
export const GroupEntityViewSchema: z.ZodType<GroupEntityView> = z.lazy(() =>
  z.object({
    id: z.string(),
    entityCode: z.string(),
    name: z.string(),
    country: z.string(),
    currency: z.string(),
    entityType: z.string(),
    consolidationMethod: z.string(),
    status: z.string(),
    parentId: z.string().nullable(),
    ownershipPercent: z.number(),
    votingRightsPercent: z.number(),
    acquisitionDate: z.string().nullable(),
    divestmentDate: z.string().nullable(),
    functionalCurrency: z.string(),
    reportingCurrency: z.string(),
    fxRate: z.number(),
    children: z.array(GroupEntityViewSchema).optional(),
  })
);

export const GoodwillAllocationViewSchema = z.object({
  id: z.string(),
  entityId: z.string(),
  entityName: z.string(),
  acquisitionDate: z.string(),
  initialGoodwill: z.number(),
  accumulatedImpairment: z.number(),
  carryingAmount: z.number(),
  cguId: z.string(),
  cguName: z.string(),
  lastImpairmentTest: z.string(),
  currency: z.string(),
});
export type GoodwillAllocationView = z.infer<typeof GoodwillAllocationViewSchema>;

export const OwnershipRecordViewSchema = z.object({
  id: z.string(),
  entityId: z.string(),
  effectiveDate: z.string(),
  previousOwnership: z.number(),
  newOwnership: z.number(),
  changeType: z.string(),
  consideration: z.number(),
  nciAdjustment: z.number(),
  goodwillImpact: z.number(),
  journalEntryId: z.string().nullable(),
});
export type OwnershipRecordView = z.infer<typeof OwnershipRecordViewSchema>;

export const ConsolidationSummaryViewSchema = z.object({
  totalEntities: z.number(),
  subsidiaries: z.number(),
  associates: z.number(),
  jointVentures: z.number(),
  totalGoodwill: z.number(),
  nciEquity: z.number(),
  eliminationEntries: z.number(),
});
export type ConsolidationSummaryView = z.infer<typeof ConsolidationSummaryViewSchema>;

// cost-accounting
export type CostCenterListItem = {
  id: string;
  code: string;
  name: string;
  parentId: string | null;
  level: number;
  status: string;
  managerId: string | null;
  managerName: string | null;
  companyId: string;
  currencyCode: string;
  budgetAmount: string;
  actualAmount: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  createdAt: string;
  updatedAt: string;
  children?: CostCenterListItem[];
};
export const CostCenterListItemSchema: z.ZodType<CostCenterListItem> = z.lazy(() =>
  z.object({
    id: z.string(),
    code: z.string(),
    name: z.string(),
    parentId: z.string().nullable(),
    level: z.number(),
    status: z.string(),
    managerId: z.string().nullable(),
    managerName: z.string().nullable(),
    companyId: z.string(),
    currencyCode: z.string(),
    budgetAmount: z.string(),
    actualAmount: z.string(),
    effectiveFrom: z.string(),
    effectiveTo: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
    children: z.array(CostCenterListItemSchema).optional(),
  })
);

export const CostCenterDetailSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  parentId: z.string().nullable(),
  level: z.number(),
  status: z.string(),
  managerId: z.string().nullable(),
  managerName: z.string().nullable(),
  companyId: z.string(),
  currencyCode: z.string(),
  budgetAmount: z.string(),
  actualAmount: z.string(),
  effectiveFrom: z.string(),
  effectiveTo: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  children: z.array(CostCenterListItemSchema).optional(),
  description: z.string(),
  parentCode: z.string().nullable(),
  parentName: z.string().nullable(),
  path: z.array(z.string()),
  type: z.string(),
});
export type CostCenterDetail = z.infer<typeof CostCenterDetailSchema>;

export const CostDriverListItemSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  description: z.string(),
  driverType: z.string(),
  unitOfMeasure: z.string(),
  status: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type CostDriverListItem = z.infer<typeof CostDriverListItemSchema>;

export const CostDriverValueViewSchema = z.object({
  id: z.string(),
  driverId: z.string(),
  costCenterId: z.string(),
  costCenterCode: z.string(),
  costCenterName: z.string(),
  period: z.string(),
  value: z.number(),
  percentage: z.number(),
  updatedAt: z.string(),
});
export type CostDriverValueView = z.infer<typeof CostDriverValueViewSchema>;

export const AllocationRuleViewSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  sourceCostCenterId: z.string(),
  sourceCostCenterCode: z.string(),
  sourceCostCenterName: z.string(),
  driverId: z.string(),
  driverCode: z.string(),
  driverName: z.string(),
  method: z.string(),
  isActive: z.boolean(),
  order: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type AllocationRuleView = z.infer<typeof AllocationRuleViewSchema>;

export const AllocationRunViewSchema = z.object({
  id: z.string(),
  runNumber: z.string(),
  period: z.string(),
  method: z.string(),
  status: z.string(),
  totalAllocated: z.string(),
  currency: z.string(),
  rulesApplied: z.number(),
  costCentersAffected: z.number(),
  journalEntryId: z.string().nullable(),
  journalEntryNumber: z.string().nullable(),
  initiatedBy: z.string(),
  initiatedAt: z.string(),
  completedAt: z.string().nullable(),
  reversedAt: z.string().nullable(),
  reversedBy: z.string().nullable(),
});
export type AllocationRunView = z.infer<typeof AllocationRunViewSchema>;

export const AllocationLineViewSchema = z.object({
  id: z.string(),
  runId: z.string(),
  ruleId: z.string(),
  ruleName: z.string(),
  fromCostCenterId: z.string(),
  fromCostCenterCode: z.string(),
  fromCostCenterName: z.string(),
  toCostCenterId: z.string(),
  toCostCenterCode: z.string(),
  toCostCenterName: z.string(),
  amount: z.string(),
  percentage: z.number(),
  driverValue: z.number(),
});
export type AllocationLineView = z.infer<typeof AllocationLineViewSchema>;

export const AllocationRunDetailViewSchema = AllocationRunViewSchema.extend({
  lines: z.array(AllocationLineViewSchema),
});
export type AllocationRunDetailView = z.infer<typeof AllocationRunDetailViewSchema>;

export const CostAccountingSummaryViewSchema = z.object({
  totalCostCenters: z.number(),
  activeCostCenters: z.number(),
  totalDrivers: z.number(),
  totalRules: z.number(),
  lastAllocationRun: z.string().nullable(),
  totalAllocatedYTD: z.string(),
  budgetVariancePercent: z.number(),
  pendingAllocations: z.number(),
});
export type CostAccountingSummaryView = z.infer<typeof CostAccountingSummaryViewSchema>;

export const PostingPreviewLineSchema = z.object({
  accountId: z.string(),
  accountCode: z.string(),
  accountName: z.string(),
  debit: z.string(),
  credit: z.string(),
  description: z.string(),
});
export type PostingPreviewLine = z.infer<typeof PostingPreviewLineSchema>;

export const PostingPreviewResultSchema = z.object({
  ledgerName: z.string(),
  periodName: z.string(),
  currency: z.string(),
  lines: z.array(PostingPreviewLineSchema),
  warnings: z.array(z.string()),
});
export type PostingPreviewResult = z.infer<typeof PostingPreviewResultSchema>;

// credit
export const CustomerCreditViewSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  customerCode: z.string(),
  customerName: z.string(),
  creditLimit: z.number(),
  currentBalance: z.number(),
  availableCredit: z.number(),
  utilizationPercent: z.number(),
  overdueAmount: z.number(),
  currency: z.string(),
  paymentTermsDays: z.number(),
  avgPaymentDays: z.number(),
  riskRating: z.string(),
  status: z.string(),
  lastReviewDate: z.string(),
  nextReviewDate: z.string(),
  reviewFrequency: z.string(),
  creditScoreExternal: z.number().nullable(),
  creditScoreInternal: z.number().nullable(),
  isOnHold: z.boolean(),
  holdReason: z.string().nullable(),
  holdDate: z.string().nullable(),
  holdBy: z.string().nullable(),
  approvedBy: z.string().nullable(),
  approvedDate: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type CustomerCreditView = z.infer<typeof CustomerCreditViewSchema>;

export const CreditReviewViewSchema = z.object({
  id: z.string(),
  reviewNumber: z.string(),
  customerId: z.string(),
  customerCode: z.string(),
  customerName: z.string(),
  reviewType: z.string(),
  status: z.string(),
  currentLimit: z.number(),
  proposedLimit: z.number(),
  currentRating: z.string(),
  proposedRating: z.string(),
  currency: z.string(),
  requestedBy: z.string(),
  requestedAt: z.string(),
  assignedTo: z.string().nullable(),
  financialAnalysis: z.string().nullable(),
  paymentHistory: z.string().nullable(),
  recommendation: z.string().nullable(),
  approvedBy: z.string().nullable(),
  approvedAt: z.string().nullable(),
  rejectionReason: z.string().nullable(),
  dueDate: z.string(),
  completedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type CreditReviewView = z.infer<typeof CreditReviewViewSchema>;

export const CreditHoldViewSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  customerCode: z.string(),
  customerName: z.string(),
  holdType: z.string(),
  status: z.string(),
  reason: z.string(),
  amount: z.number(),
  currency: z.string(),
  blockedOrders: z.number(),
  blockedOrderValue: z.number(),
  holdDate: z.string(),
  holdBy: z.string(),
  releaseDate: z.string().nullable(),
  releaseBy: z.string().nullable(),
  releaseNotes: z.string().nullable(),
  escalatedTo: z.string().nullable(),
  escalatedAt: z.string().nullable(),
  autoRelease: z.boolean(),
  autoReleaseCondition: z.string().nullable(),
});
export type CreditHoldView = z.infer<typeof CreditHoldViewSchema>;

export const CreditSummaryViewSchema = z.object({
  totalCustomers: z.number(),
  totalCreditLimit: z.number(),
  totalOutstanding: z.number(),
  totalOverdue: z.number(),
  avgUtilization: z.number(),
  customersOnHold: z.number(),
  pendingReviews: z.number(),
  overdueReviews: z.number(),
  highRiskCustomers: z.number(),
});
export type CreditSummaryView = z.infer<typeof CreditSummaryViewSchema>;

// dashboard
export const DashboardSummarySchema = z.object({
  cashBalance: z.number(),
  openAr: z.record(z.unknown()),
  openAp: z.record(z.unknown()),
  currentPeriod: z.record(z.unknown()).nullable(),
  recentActivity: z.array(z.record(z.unknown())),
});
export type DashboardSummary = z.infer<typeof DashboardSummarySchema>;

// deferred-tax
export const DeferredTaxItemViewSchema = z.object({
  id: z.string(),
  itemNumber: z.string(),
  description: z.string(),
  type: z.union([z.string(), z.string()]),
  originType: z.string(),
  status: z.union([z.string(), z.string(), z.string()]),
  bookBasis: z.number(),
  taxBasis: z.number(),
  temporaryDifference: z.number(),
  taxRate: z.number(),
  deferredTaxAmount: z.number(),
  currency: z.string(),
  jurisdiction: z.string(),
  originatingPeriod: z.string(),
  expectedReversalPeriod: z.string().nullable(),
  sourceId: z.string().nullable(),
  sourceType: z.string().nullable(),
  glAccountId: z.string(),
  glAccountCode: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type DeferredTaxItemView = z.infer<typeof DeferredTaxItemViewSchema>;

export const DeferredTaxMovementViewSchema = z.object({
  id: z.string(),
  itemId: z.string(),
  periodEnd: z.string(),
  openingBalance: z.number(),
  additions: z.number(),
  reversals: z.number(),
  rateChange: z.number(),
  fxAdjustment: z.number(),
  closingBalance: z.number(),
  journalEntryId: z.string().nullable(),
});
export type DeferredTaxMovementView = z.infer<typeof DeferredTaxMovementViewSchema>;

export const DeferredTaxSummaryViewSchema = z.object({
  totalDTA: z.number(),
  totalDTL: z.number(),
  netPosition: z.number(),
  valuationAllowance: z.number(),
  movementYTD: z.number(),
  dtaByOrigin: z.record(z.unknown()),
  dtlByOrigin: z.record(z.unknown()),
});
export type DeferredTaxSummaryView = z.infer<typeof DeferredTaxSummaryViewSchema>;

// expenses
export const ExpenseClaimListItemSchema = z.object({
  id: z.string(),
  claimNumber: z.string(),
  employeeId: z.string(),
  employeeName: z.string(),
  department: z.string(),
  title: z.string(),
  status: z.string(),
  totalAmount: z.number(),
  currency: z.string(),
  lineCount: z.number(),
  submittedDate: z.string().nullable(),
  createdAt: z.string(),
});
export type ExpenseClaimListItem = z.infer<typeof ExpenseClaimListItemSchema>;

export const ExpenseLineViewSchema = z.object({
  id: z.string(),
  expenseDate: z.string(),
  category: z.string(),
  description: z.string(),
  merchantName: z.string(),
  amount: z.number(),
  currency: z.string(),
  taxAmount: z.number(),
  glAccountCode: z.string(),
  costCenterCode: z.string().nullable(),
  receiptAttached: z.boolean(),
});
export type ExpenseLineView = z.infer<typeof ExpenseLineViewSchema>;

export const ExpenseClaimDetailSchema = z.object({
  id: z.string(),
  claimNumber: z.string(),
  employeeId: z.string(),
  employeeName: z.string(),
  department: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  status: z.string(),
  totalAmount: z.number(),
  currency: z.string(),
  lineCount: z.number(),
  approvedAmount: z.number().nullable(),
  approvedBy: z.string().nullable(),
  approvedAt: z.string().nullable(),
  paidDate: z.string().nullable(),
  paymentReference: z.string().nullable(),
  rejectionReason: z.string().nullable(),
  submittedDate: z.string().nullable(),
  periodFrom: z.string(),
  periodTo: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type ExpenseClaimDetail = z.infer<typeof ExpenseClaimDetailSchema>;

export const ExpensePolicyViewSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  categoryLimits: z.record(z.unknown()),
  dailyLimit: z.number(),
  monthlyLimit: z.number(),
  requiresReceipt: z.boolean(),
  receiptThreshold: z.number(),
  requiresPreApproval: z.boolean(),
  preApprovalThreshold: z.number(),
  allowedCurrencies: z.array(z.string()),
  isDefault: z.boolean(),
});
export type ExpensePolicyView = z.infer<typeof ExpensePolicyViewSchema>;

export const ExpenseSummarySchema = z.object({
  totalClaims: z.number(),
  pendingClaims: z.number(),
  approvedThisMonth: z.number(),
  pendingAmount: z.number(),
  approvedAmount: z.number(),
  paidThisMonth: z.number(),
  rejectionRate: z.number(),
  averageProcessingDays: z.number(),
});
export type ExpenseSummary = z.infer<typeof ExpenseSummarySchema>;

// fx
export const FxRateListItemSchema = z.object({
  id: z.string(),
  fromCurrency: z.string(),
  toCurrency: z.string(),
  rate: z.string(),
  effectiveDate: z.string(),
  expiresAt: z.string().optional(),
  source: z.string(),
});
export type FxRateListItem = z.infer<typeof FxRateListItemSchema>;

export const FxRateDetailSchema = z.object({
  id: z.string(),
  fromCurrency: z.string(),
  toCurrency: z.string(),
  rate: z.string(),
  effectiveDate: z.string(),
  expiresAt: z.string().optional(),
  source: z.string(),
  createdAt: z.string(),
});
export type FxRateDetail = z.infer<typeof FxRateDetailSchema>;

// hedging
export const HedgeRelationshipViewSchema = z.object({
  id: z.string(),
  relationshipNumber: z.string(),
  name: z.string(),
  description: z.string(),
  hedgeType: z.string(),
  status: z.string(),
  hedgedItemId: z.string(),
  hedgedItemDescription: z.string(),
  hedgingInstrumentId: z.string(),
  hedgingInstrumentDescription: z.string(),
  hedgeRatio: z.number(),
  designationDate: z.string(),
  terminationDate: z.string().nullable(),
  currency: z.string(),
  hedgedRisk: z.string(),
  lastEffectivenessTest: z.string().nullable(),
  effectivenessResult: z.string().nullable(),
  ineffectivenessAmount: z.number(),
  cashFlowReserve: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type HedgeRelationshipView = z.infer<typeof HedgeRelationshipViewSchema>;

export const EffectivenessTestViewSchema = z.object({
  id: z.string(),
  relationshipId: z.string(),
  testDate: z.string(),
  periodEnd: z.string(),
  method: z.string(),
  hedgedItemChange: z.number(),
  hedgingInstrumentChange: z.number(),
  effectivenessRatio: z.number(),
  result: z.string(),
  ineffectivenessAmount: z.number(),
  journalEntryId: z.string().nullable(),
  testedBy: z.string(),
  createdAt: z.string(),
});
export type EffectivenessTestView = z.infer<typeof EffectivenessTestViewSchema>;

export const HedgingSummaryViewSchema = z.object({
  activeRelationships: z.number(),
  fairValueHedges: z.number(),
  cashFlowHedges: z.number(),
  netInvestmentHedges: z.number(),
  totalCashFlowReserve: z.number(),
  totalIneffectiveness: z.number(),
});
export type HedgingSummaryView = z.infer<typeof HedgingSummaryViewSchema>;

// instruments
export const InstrumentViewSchema = z.object({
  id: z.string(),
  instrumentNumber: z.string(),
  name: z.string(),
  description: z.string(),
  type: z.string(),
  category: z.string(),
  status: z.string(),
  issuer: z.string(),
  currency: z.string(),
  faceValue: z.number(),
  carryingAmount: z.number(),
  fairValue: z.number(),
  fairValueLevel: z.string(),
  unrealizedGainLoss: z.number(),
  accruedInterest: z.number(),
  interestRate: z.number().nullable(),
  maturityDate: z.string().nullable(),
  acquisitionDate: z.string(),
  acquisitionCost: z.number(),
  lastValuationDate: z.string(),
  ecl: z.number(),
  eclStage: z.number(),
  glAccountId: z.string(),
  glAccountCode: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type InstrumentView = z.infer<typeof InstrumentViewSchema>;

export const FairValueMeasurementViewSchema = z.object({
  id: z.string(),
  instrumentId: z.string(),
  measurementDate: z.string(),
  fairValue: z.number(),
  fairValueLevel: z.string(),
  valuationMethod: z.string(),
  unrealizedGainLoss: z.number(),
  journalEntryId: z.string().nullable(),
  journalEntryNumber: z.string().nullable(),
  createdAt: z.string(),
});
export type FairValueMeasurementView = z.infer<typeof FairValueMeasurementViewSchema>;

export const InstrumentSummaryViewSchema = z.object({
  totalInstruments: z.number(),
  totalCarryingAmount: z.number(),
  totalFairValue: z.number(),
  unrealizedGainLoss: z.number(),
  ecl: z.number(),
  byCategory: z.record(z.unknown()),
});
export type InstrumentSummaryView = z.infer<typeof InstrumentSummaryViewSchema>;

// ic
export const IcSettlementStatusSchema = z.record(z.unknown());
export type IcSettlementStatus = z.infer<typeof IcSettlementStatusSchema>;

export const IcTransactionListItemSchema = z.object({
  id: z.string(),
  agreementId: z.string(),
  description: z.string(),
  amount: z.string(),
  currency: z.string(),
  transactionDate: z.string(),
  settlementStatus: IcSettlementStatusSchema,
  sourceCompanyName: z.string(),
  mirrorCompanyName: z.string(),
  sourceJournalRef: z.string().optional(),
  mirrorJournalRef: z.string().optional(),
});
export type IcTransactionListItem = z.infer<typeof IcTransactionListItemSchema>;

export const IcTransactionDetailSchema = z.object({
  id: z.string(),
  agreementId: z.string(),
  description: z.string(),
  amount: z.string(),
  currency: z.string(),
  transactionDate: z.string(),
  settlementStatus: IcSettlementStatusSchema,
  sourceCompanyId: z.string(),
  sourceCompanyName: z.string(),
  mirrorCompanyId: z.string(),
  mirrorCompanyName: z.string(),
  sourceJournalId: z.string().optional(),
  sourceJournalRef: z.string().optional(),
  mirrorJournalId: z.string().optional(),
  mirrorJournalRef: z.string().optional(),
  sourceLines: z.array(z.string()),
  mirrorLines: z.array(z.string()),
  createdAt: z.string(),
});
export type IcTransactionDetail = z.infer<typeof IcTransactionDetailSchema>;

export const IcJournalLineViewSchema = z.object({
  accountId: z.string(),
  accountCode: z.string(),
  accountName: z.string().optional(),
  debit: z.string(),
  credit: z.string(),
});
export type IcJournalLineView = z.infer<typeof IcJournalLineViewSchema>;

export const IcAgreementListItemSchema = z.object({
  id: z.string(),
  sellerCompanyId: z.string(),
  sellerCompanyName: z.string(),
  buyerCompanyId: z.string(),
  buyerCompanyName: z.string(),
  pricingRule: z.string(),
  markupPercent: z.number().optional(),
  isActive: z.boolean(),
});
export type IcAgreementListItem = z.infer<typeof IcAgreementListItemSchema>;

export const IcAgingRowSchema = z.object({
  companyId: z.string(),
  companyName: z.string(),
  counterpartyId: z.string(),
  counterpartyName: z.string(),
  currency: z.string(),
  current: z.string(),
  days30: z.string(),
  days60: z.string(),
  days90Plus: z.string(),
  total: z.string(),
});
export type IcAgingRow = z.infer<typeof IcAgingRowSchema>;

export const IcAgingResultSchema = z.object({
  rows: z.array(IcAgingRowSchema),
  asOfDate: z.string(),
  currency: z.string(),
  grandTotal: z.string(),
});
export type IcAgingResult = z.infer<typeof IcAgingResultSchema>;

export const IcTransactionPreviewResultSchema = z.object({
  sourceJournal: PostingPreviewResultSchema,
  mirrorJournal: PostingPreviewResultSchema,
});
export type IcTransactionPreviewResult = z.infer<typeof IcTransactionPreviewResultSchema>;

// journal
export const JournalListItemSchema = z.object({
  id: z.string(),
  documentNumber: z.string(),
  description: z.string(),
  status: JournalStatusSchema,
  postingDate: z.string(),
  totalDebit: z.string(),
  totalCredit: z.string(),
  currency: z.string(),
  createdAt: z.string(),
});
export type JournalListItem = z.infer<typeof JournalListItemSchema>;

export const JournalDetailSchema = z.object({
  id: z.string(),
  documentNumber: z.string(),
  description: z.string(),
  status: JournalStatusSchema,
  postingDate: z.string(),
  companyId: z.string(),
  ledgerId: z.string(),
  lines: z.array(z.string()),
  totalDebit: z.string(),
  totalCredit: z.string(),
  currency: z.string(),
  createdAt: z.string(),
  postedAt: z.string().optional(),
  reversedById: z.string().optional(),
  voidedAt: z.string().optional(),
  voidReason: z.string().optional(),
});
export type JournalDetail = z.infer<typeof JournalDetailSchema>;

export const JournalLineViewSchema = z.object({
  id: z.string(),
  accountCode: z.string(),
  accountName: z.string().optional(),
  description: z.string().optional(),
  debit: z.string(),
  credit: z.string(),
  currency: z.string(),
});
export type JournalLineView = z.infer<typeof JournalLineViewSchema>;

// ledger
export const LedgerListItemSchema = z.object({
  id: z.string(),
  companyId: z.string(),
  name: z.string(),
  baseCurrency: z.string(),
  companyName: z.string().optional(),
});
export type LedgerListItem = z.infer<typeof LedgerListItemSchema>;

export const LedgerDetailSchema = z.object({
  id: z.string(),
  companyId: z.string(),
  companyName: z.string().optional(),
  name: z.string(),
  baseCurrency: z.string(),
});
export type LedgerDetail = z.infer<typeof LedgerDetailSchema>;

// ap-close
export const CloseChecklistItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string(),
  status: z.union([z.string(), z.string(), z.string(), z.string()]),
  details: z.string().optional(),
  count: z.number().optional(),
});
export type CloseChecklistItem = z.infer<typeof CloseChecklistItemSchema>;

export const ApCloseChecklistSchema = z.object({
  periodName: z.string(),
  periodId: z.string(),
  asOfDate: z.string(),
  items: z.array(CloseChecklistItemSchema),
  passCount: z.number(),
  failCount: z.number(),
  warningCount: z.number(),
});
export type ApCloseChecklist = z.infer<typeof ApCloseChecklistSchema>;

// ap-hold
export const ApHoldListItemSchema = z.object({
  id: z.string(),
  invoiceId: z.string(),
  invoiceNumber: z.string(),
  supplierName: z.string(),
  supplierId: z.string(),
  holdType: ApHoldTypeSchema,
  holdReason: z.string(),
  status: ApHoldStatusSchema,
  createdAt: z.string(),
  releasedAt: z.string().optional(),
  releaseReason: z.string().optional(),
});
export type ApHoldListItem = z.infer<typeof ApHoldListItemSchema>;

export const InvoiceTimelineEntrySchema = z.object({
  id: z.string(),
  action: z.string(),
  userId: z.string(),
  userName: z.string().optional(),
  timestamp: z.string(),
  details: z.string().optional(),
});
export type InvoiceTimelineEntry = z.infer<typeof InvoiceTimelineEntrySchema>;

// ap-payment-run
export const PaymentRunListItemSchema = z.object({
  id: z.string(),
  runNumber: z.string(),
  status: PaymentRunStatusSchema,
  runDate: z.string(),
  cutoffDate: z.string(),
  currencyCode: z.string(),
  totalAmount: z.string(),
  itemCount: z.number(),
  createdAt: z.string(),
});
export type PaymentRunListItem = z.infer<typeof PaymentRunListItemSchema>;

export const PaymentRunItemViewSchema = z.object({
  id: z.string(),
  invoiceId: z.string(),
  invoiceNumber: z.string(),
  supplierName: z.string(),
  supplierId: z.string(),
  amount: z.string(),
  discountAmount: z.string(),
  netAmount: z.string(),
  currencyCode: z.string(),
  dueDate: z.string(),
});
export type PaymentRunItemView = z.infer<typeof PaymentRunItemViewSchema>;

export const PaymentRunDetailSchema = z.object({
  id: z.string(),
  runNumber: z.string(),
  status: PaymentRunStatusSchema,
  runDate: z.string(),
  cutoffDate: z.string(),
  currencyCode: z.string(),
  companyId: z.string(),
  companyName: z.string(),
  totalAmount: z.string(),
  totalDiscount: z.string(),
  totalNet: z.string(),
  itemCount: z.number(),
  items: z.array(PaymentRunItemViewSchema),
  createdAt: z.string(),
  executedAt: z.string().optional(),
  cancelledAt: z.string().optional(),
  cancelReason: z.string().optional(),
});
export type PaymentRunDetail = z.infer<typeof PaymentRunDetailSchema>;

export const RemittanceAdviceViewSchema = z.object({
  runNumber: z.string(),
  runDate: z.string(),
  supplierName: z.string(),
  currencyCode: z.string(),
  totalGross: z.string(),
  totalDiscount: z.string(),
  totalNet: z.string(),
});
export type RemittanceAdviceView = z.infer<typeof RemittanceAdviceViewSchema>;

export const PaymentProposalGroupSchema = z.object({
  groupKey: z.string(),
  supplierId: z.string(),
  supplierName: z.string(),
  paymentMethod: z.string(),
  bankAccountId: z.string().nullable(),
  currencyCode: z.string(),
  totalGross: z.string(),
  totalDiscount: z.string(),
  totalNet: z.string(),
});
export type PaymentProposalGroup = z.infer<typeof PaymentProposalGroupSchema>;

export const PaymentProposalResponseSchema = z.object({
  paymentDate: z.string(),
  cutoffDate: z.string(),
  groups: z.array(PaymentProposalGroupSchema),
});
export type PaymentProposalResponse = z.infer<typeof PaymentProposalResponseSchema>;

// ap-supplier
export const SupplierListItemSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  status: SupplierStatusSchema,
  taxId: z.string().optional(),
  currencyCode: z.string(),
  defaultPaymentMethod: z.string().optional(),
  createdAt: z.string(),
});
export type SupplierListItem = z.infer<typeof SupplierListItemSchema>;

export const SupplierSiteViewSchema = z.object({
  id: z.string(),
  siteCode: z.string(),
  name: z.string(),
  addressLine1: z.string(),
  addressLine2: z.string().optional(),
  city: z.string(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  countryCode: z.string(),
  isPrimary: z.boolean(),
});
export type SupplierSiteView = z.infer<typeof SupplierSiteViewSchema>;

export const SupplierBankAccountViewSchema = z.object({
  id: z.string(),
  bankName: z.string(),
  accountName: z.string(),
  accountNumber: z.string(),
  swiftBic: z.string().optional(),
  iban: z.string().optional(),
  routingNumber: z.string().optional(),
  currencyCode: z.string(),
  isPrimary: z.boolean(),
});
export type SupplierBankAccountView = z.infer<typeof SupplierBankAccountViewSchema>;

export const SupplierDetailSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  status: SupplierStatusSchema,
  taxId: z.string().optional(),
  currencyCode: z.string(),
  defaultPaymentMethod: z.string().optional(),
  paymentTerms: z.string().optional(),
  whtRateId: z.string().optional(),
  remittanceEmail: z.string().optional(),
  companyId: z.string(),
  companyName: z.string(),
  sites: z.array(SupplierSiteViewSchema),
  bankAccounts: z.array(SupplierBankAccountViewSchema),
  invoiceCount: z.number(),
  openBalance: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type SupplierDetail = z.infer<typeof SupplierDetailSchema>;

// ap-wht
export const WhtCertificateListItemSchema = z.object({
  id: z.string(),
  supplierId: z.string(),
  supplierName: z.string(),
  supplierCode: z.string(),
  certificateNumber: z.string(),
  taxYear: z.number(),
  incomeType: z.string(),
  grossAmount: z.string(),
  whtAmount: z.string(),
  whtRate: z.string(),
  currencyCode: z.string(),
  issueDate: z.string(),
  status: z.enum(['ISSUED', 'VOIDED']),
});
export type WhtCertificateListItem = z.infer<typeof WhtCertificateListItemSchema>;

export const WhtReportSummarySchema = z.object({
  totalGross: z.string(),
  totalWht: z.string(),
  currencyCode: z.string(),
  certificateCount: z.number(),
});
export type WhtReportSummary = z.infer<typeof WhtReportSummarySchema>;

// ap
export const ApInvoiceListItemSchema = z.object({
  id: z.string(),
  invoiceNumber: z.string(),
  supplierName: z.string(),
  supplierId: z.string(),
  status: ApInvoiceStatusSchema,
  invoiceDate: z.string(),
  dueDate: z.string(),
  totalAmount: z.string(),
  amountPaid: z.string(),
  balanceDue: z.string(),
  currencyCode: z.string(),
  createdAt: z.string(),
});
export type ApInvoiceListItem = z.infer<typeof ApInvoiceListItemSchema>;

export const ApInvoiceLineViewSchema = z.object({
  id: z.string(),
  accountCode: z.string(),
  accountName: z.string().optional(),
  description: z.string().optional(),
  quantity: z.number(),
  unitPrice: z.string(),
  amount: z.string(),
  taxAmount: z.string(),
});
export type ApInvoiceLineView = z.infer<typeof ApInvoiceLineViewSchema>;

export const ApInvoiceDetailSchema = z.object({
  id: z.string(),
  invoiceNumber: z.string(),
  supplierName: z.string(),
  supplierId: z.string(),
  supplierRef: z.string().optional(),
  status: ApInvoiceStatusSchema,
  invoiceDate: z.string(),
  dueDate: z.string(),
  currencyCode: z.string(),
  description: z.string().optional(),
  poRef: z.string().optional(),
  receiptRef: z.string().optional(),
  companyId: z.string(),
  ledgerId: z.string(),
  lines: z.array(ApInvoiceLineViewSchema),
  totalAmount: z.string(),
  totalTax: z.string(),
  amountPaid: z.string(),
  balanceDue: z.string(),
  createdAt: z.string(),
  postedAt: z.string().optional(),
  cancelledAt: z.string().optional(),
  cancelReason: z.string().optional(),
});
export type ApInvoiceDetail = z.infer<typeof ApInvoiceDetailSchema>;

export const InvoiceEarlyDiscountSchema = z.object({
  eligible: z.boolean(),
  discountDeadline: z.string().nullable(),
  savingsPercent: z.number(),
  discountAmount: z.string(),
  netPayable: z.string(),
  currencyCode: z.string(),
});
export type InvoiceEarlyDiscount = z.infer<typeof InvoiceEarlyDiscountSchema>;

export const ApDiscountSummarySchema = z.object({
  totalDiscount: z.string(),
  currencyCode: z.string(),
  days: z.number(),
});
export type ApDiscountSummary = z.infer<typeof ApDiscountSummarySchema>;

// match-tolerance
export const MatchToleranceListItemSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  scope: ToleranceScopeSchema,
  scopeEntityId: z.string().nullable(),
  companyId: z.string().nullable(),
  toleranceBps: z.number(),
  quantityTolerancePercent: z.number(),
  autoHold: z.boolean(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type MatchToleranceListItem = z.infer<typeof MatchToleranceListItemSchema>;

// prepayment
export const PrepaymentListItemSchema = z.object({
  id: z.string(),
  invoiceNumber: z.string(),
  supplierName: z.string(),
  supplierId: z.string(),
  status: z.string(),
  totalAmount: z.string(),
  appliedAmount: z.string(),
  remainingAmount: z.string(),
  currencyCode: z.string(),
  invoiceDate: z.string(),
  createdAt: z.string(),
});
export type PrepaymentListItem = z.infer<typeof PrepaymentListItemSchema>;

export const PrepaymentApplicationViewSchema = z.object({
  id: z.string(),
  targetInvoiceId: z.string(),
  targetInvoiceNumber: z.string(),
  amount: z.string(),
  appliedAt: z.string(),
});
export type PrepaymentApplicationView = z.infer<typeof PrepaymentApplicationViewSchema>;

export const PrepaymentDetailSchema = PrepaymentListItemSchema.extend({
  applications: z.array(PrepaymentApplicationViewSchema),
});
export type PrepaymentDetail = z.infer<typeof PrepaymentDetailSchema>;

// supplier-mdm
export const SupplierBlockViewSchema = z.object({
  id: z.string(),
  blockType: z.string(),
  blockScope: z.string(),
  reason: z.string(),
  effectiveFrom: z.string(),
  effectiveTo: z.string().nullable(),
  isActive: z.boolean(),
  createdBy: z.string(),
  createdAt: z.string(),
});
export type SupplierBlockView = z.infer<typeof SupplierBlockViewSchema>;

export const SupplierTaxRegistrationViewSchema = z.object({
  id: z.string(),
  taxType: z.string(),
  registrationNumber: z.string(),
  countryCode: z.string(),
  issuingAuthority: z.string().nullable(),
  validFrom: z.string(),
  validTo: z.string().nullable(),
  verified: z.boolean(),
  verifiedAt: z.string().nullable(),
  verifiedBy: z.string().nullable(),
});
export type SupplierTaxRegistrationView = z.infer<typeof SupplierTaxRegistrationViewSchema>;

export const SupplierLegalDocViewSchema = z.object({
  id: z.string(),
  docType: z.string(),
  documentName: z.string(),
  fileUrl: z.string().nullable(),
  status: z.string(),
  expiryDate: z.string().nullable(),
  verifiedAt: z.string().nullable(),
  verifiedBy: z.string().nullable(),
  rejectionReason: z.string().nullable(),
  uploadedAt: z.string(),
});
export type SupplierLegalDocView = z.infer<typeof SupplierLegalDocViewSchema>;

export const SupplierEvaluationViewSchema = z.object({
  id: z.string(),
  templateName: z.string(),
  evaluatorName: z.string(),
  status: z.string(),
  overallScore: z.number().nullable(),
  period: z.string(),
  completedAt: z.string().nullable(),
  createdAt: z.string(),
});
export type SupplierEvaluationView = z.infer<typeof SupplierEvaluationViewSchema>;

export const SupplierRiskIndicatorViewSchema = z.object({
  id: z.string(),
  riskCategory: z.string(),
  riskRating: z.string(),
  description: z.string(),
  mitigationPlan: z.string().nullable(),
  isActive: z.boolean(),
  resolvedAt: z.string().nullable(),
  resolvedBy: z.string().nullable(),
  createdAt: z.string(),
});
export type SupplierRiskIndicatorView = z.infer<typeof SupplierRiskIndicatorViewSchema>;

export const SupplierDiversityViewSchema = z.object({
  id: z.string(),
  diversityCode: z.string(),
  certificationBody: z.string().nullable(),
  certificationNumber: z.string().nullable(),
  validFrom: z.string(),
  validTo: z.string().nullable(),
  verified: z.boolean(),
});
export type SupplierDiversityView = z.infer<typeof SupplierDiversityViewSchema>;

export const SupplierContactViewSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  role: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
  isPrimary: z.boolean(),
  createdAt: z.string(),
});
export type SupplierContactView = z.infer<typeof SupplierContactViewSchema>;

export const SupplierCompanyOverrideViewSchema = z.object({
  id: z.string(),
  companyId: z.string(),
  companyName: z.string(),
  paymentTermsOverride: z.string().nullable(),
  paymentMethodOverride: z.string().nullable(),
  currencyOverride: z.string().nullable(),
  whtRateOverride: z.string().nullable(),
  updatedAt: z.string(),
});
export type SupplierCompanyOverrideView = z.infer<typeof SupplierCompanyOverrideViewSchema>;

export const SupplierActivationReadinessSchema = z.object({
  ready: z.boolean(),
});
export type SupplierActivationReadiness = z.infer<typeof SupplierActivationReadinessSchema>;

// period
export const PeriodStatusSchema = z.record(z.unknown());
export type PeriodStatus = z.infer<typeof PeriodStatusSchema>;

export const PeriodListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  year: z.number(),
  period: z.number(),
  startDate: z.string(),
  endDate: z.string(),
  status: PeriodStatusSchema,
});
export type PeriodListItem = z.infer<typeof PeriodListItemSchema>;

export const PeriodDetailSchema = z.object({
  id: z.string(),
  companyId: z.string(),
  name: z.string(),
  year: z.number(),
  period: z.number(),
  startDate: z.string(),
  endDate: z.string(),
  status: PeriodStatusSchema,
});
export type PeriodDetail = z.infer<typeof PeriodDetailSchema>;

// provisions
export const ProvisionViewSchema = z.object({
  id: z.string(),
  provisionNumber: z.string(),
  name: z.string(),
  description: z.string(),
  type: z.string(),
  status: z.string(),
  recognitionDate: z.string(),
  expectedSettlementDate: z.string().nullable(),
  initialAmount: z.number(),
  currentBalance: z.number(),
  currency: z.string(),
  discountRate: z.number().nullable(),
  presentValue: z.number().nullable(),
  isDiscounted: z.boolean(),
  utilizationYTD: z.number(),
  additionsYTD: z.number(),
  reversalsYTD: z.number(),
  unwinding: z.number(),
  glAccountId: z.string(),
  glAccountCode: z.string(),
  costCenterId: z.string().nullable(),
  costCenterCode: z.string().nullable(),
  contingentLiability: z.boolean(),
  contingencyNote: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type ProvisionView = z.infer<typeof ProvisionViewSchema>;

export const ProvisionMovementViewSchema = z.object({
  id: z.string(),
  provisionId: z.string(),
  movementDate: z.string(),
  movementType: z.string(),
  amount: z.number(),
  currency: z.string(),
  description: z.string(),
  reference: z.string().nullable(),
  journalEntryId: z.string().nullable(),
  journalEntryNumber: z.string().nullable(),
  createdBy: z.string(),
  createdAt: z.string(),
});
export type ProvisionMovementView = z.infer<typeof ProvisionMovementViewSchema>;

export const ProvisionSummaryViewSchema = z.object({
  totalProvisions: z.number(),
  activeProvisions: z.number(),
  totalBalance: z.number(),
  utilizationYTD: z.number(),
  additionsYTD: z.number(),
  reversalsYTD: z.number(),
  contingentLiabilities: z.number(),
  provisionsToReview: z.number(),
});
export type ProvisionSummaryView = z.infer<typeof ProvisionSummaryViewSchema>;

// ar
export const ArInvoiceListItemSchema = z.object({
  id: z.string(),
  invoiceNumber: z.string(),
  customerName: z.string(),
  customerId: z.string(),
  status: ArInvoiceStatusSchema,
  invoiceDate: z.string(),
  dueDate: z.string(),
  totalAmount: z.string(),
  amountPaid: z.string(),
  balanceDue: z.string(),
  currencyCode: z.string(),
  createdAt: z.string(),
});
export type ArInvoiceListItem = z.infer<typeof ArInvoiceListItemSchema>;

export const ArInvoiceLineViewSchema = z.object({
  id: z.string(),
  accountCode: z.string(),
  accountName: z.string().optional(),
  description: z.string().optional(),
  quantity: z.number(),
  unitPrice: z.string(),
  amount: z.string(),
  taxAmount: z.string(),
});
export type ArInvoiceLineView = z.infer<typeof ArInvoiceLineViewSchema>;

export const ArInvoiceDetailSchema = z.object({
  id: z.string(),
  invoiceNumber: z.string(),
  customerName: z.string(),
  customerId: z.string(),
  customerRef: z.string().optional(),
  status: ArInvoiceStatusSchema,
  invoiceDate: z.string(),
  dueDate: z.string(),
  currencyCode: z.string(),
  description: z.string().optional(),
  companyId: z.string(),
  ledgerId: z.string(),
  lines: z.array(ArInvoiceLineViewSchema),
  totalAmount: z.string(),
  totalTax: z.string(),
  amountPaid: z.string(),
  balanceDue: z.string(),
  createdAt: z.string(),
  postedAt: z.string().optional(),
  cancelledAt: z.string().optional(),
  cancelReason: z.string().optional(),
  writtenOffAt: z.string().optional(),
  writeOffReason: z.string().optional(),
});
export type ArInvoiceDetail = z.infer<typeof ArInvoiceDetailSchema>;

// dunning
export const DunningRunListItemSchema = z.object({
  id: z.string(),
  runDate: z.string(),
  status: z.string(),
  lettersGenerated: z.number(),
  totalOutstanding: z.string(),
  currencyCode: z.string(),
  createdBy: z.string(),
  createdAt: z.string(),
});
export type DunningRunListItem = z.infer<typeof DunningRunListItemSchema>;

export const DunningLetterViewSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  customerName: z.string(),
  dunningLevel: z.number(),
  totalOverdue: z.string(),
  currencyCode: z.string(),
  invoiceCount: z.number(),
  status: z.string(),
  sentAt: z.string().nullable(),
});
export type DunningLetterView = z.infer<typeof DunningLetterViewSchema>;

export const DunningRunDetailSchema = z.object({
  id: z.string(),
  runDate: z.string(),
  status: z.string(),
  lettersGenerated: z.number(),
  totalOutstanding: z.string(),
  currencyCode: z.string(),
  createdBy: z.string(),
  createdAt: z.string(),
  letters: z.array(DunningLetterViewSchema),
});
export type DunningRunDetail = z.infer<typeof DunningRunDetailSchema>;

// recurring
export const RecurringTemplateLineSchema = z.object({
  accountCode: z.string(),
  debit: z.number(),
  credit: z.number(),
  description: z.string().optional(),
});
export type RecurringTemplateLine = z.infer<typeof RecurringTemplateLineSchema>;

export const RecurringTemplateListItemSchema = z.object({
  id: z.string(),
  companyId: z.string(),
  companyName: z.string().optional(),
  ledgerId: z.string(),
  description: z.string(),
  frequency: RecurringFrequencySchema,
  nextRunDate: z.string(),
  isActive: z.boolean(),
  lineCount: z.number(),
  createdAt: z.string(),
});
export type RecurringTemplateListItem = z.infer<typeof RecurringTemplateListItemSchema>;

export const RecurringTemplateDetailSchema = z.object({
  id: z.string(),
  companyId: z.string(),
  companyName: z.string().optional(),
  ledgerId: z.string(),
  ledgerName: z.string().optional(),
  description: z.string(),
  frequency: RecurringFrequencySchema,
  nextRunDate: z.string(),
  isActive: z.boolean(),
  lines: z.array(RecurringTemplateLineSchema),
  createdAt: z.string(),
});
export type RecurringTemplateDetail = z.infer<typeof RecurringTemplateDetailSchema>;

// report
export const AgingBucketSchema = z.object({
  current: z.string(),
  days30: z.string(),
  days60: z.string(),
  days90: z.string(),
  over90: z.string(),
  total: z.string(),
});
export type AgingBucket = z.infer<typeof AgingBucketSchema>;

export const ApAgingRowSchema = AgingBucketSchema.extend({
  supplierId: z.string(),
  supplierName: z.string(),
  invoiceCount: z.number(),
});
export type ApAgingRow = z.infer<typeof ApAgingRowSchema>;

export const ApAgingResultSchema = z.object({
  asOfDate: z.string(),
  rows: z.array(ApAgingRowSchema),
  totals: AgingBucketSchema,
  currency: z.string(),
});
export type ApAgingResult = z.infer<typeof ApAgingResultSchema>;

export const ArAgingRowSchema = AgingBucketSchema.extend({
  customerId: z.string(),
  customerName: z.string(),
  invoiceCount: z.number(),
  creditLimit: z.string(),
});
export type ArAgingRow = z.infer<typeof ArAgingRowSchema>;

export const ArAgingResultSchema = z.object({
  asOfDate: z.string(),
  rows: z.array(ArAgingRowSchema),
  totals: AgingBucketSchema,
  currency: z.string(),
});
export type ArAgingResult = z.infer<typeof ArAgingResultSchema>;

export const AssetRegisterRowSchema = z.object({
  assetId: z.string(),
  assetCode: z.string(),
  description: z.string(),
  category: z.string(),
  acquisitionDate: z.string(),
  costAmount: z.string(),
  accumulatedDepreciation: z.string(),
  netBookValue: z.string(),
  status: z.string(),
});
export type AssetRegisterRow = z.infer<typeof AssetRegisterRowSchema>;

export const AssetRegisterResultSchema = z.object({
  asOfDate: z.string(),
  rows: z.array(AssetRegisterRowSchema),
  totalCost: z.string(),
  totalDepreciation: z.string(),
  totalNBV: z.string(),
  currency: z.string(),
});
export type AssetRegisterResult = z.infer<typeof AssetRegisterResultSchema>;

export const ConsolidationEntityRowSchema = z.object({
  entityCode: z.string(),
  entityName: z.string(),
  currency: z.string(),
  ownershipPercent: z.number(),
  method: z.string(),
  assets: z.string(),
  liabilities: z.string(),
  equity: z.string(),
});
export type ConsolidationEntityRow = z.infer<typeof ConsolidationEntityRowSchema>;

export const ConsolidationReportResultSchema = z.object({
  asOfDate: z.string(),
  rows: z.array(ConsolidationEntityRowSchema),
  totalAssets: z.string(),
  totalLiabilities: z.string(),
  totalEquity: z.string(),
  eliminationsTotal: z.string(),
  currency: z.string(),
});
export type ConsolidationReportResult = z.infer<typeof ConsolidationReportResultSchema>;

export const CostAllocationRowSchema = z.object({
  costCenterCode: z.string(),
  costCenterName: z.string(),
  directCosts: z.string(),
  allocatedCosts: z.string(),
  totalCosts: z.string(),
  allocationPercent: z.number(),
});
export type CostAllocationRow = z.infer<typeof CostAllocationRowSchema>;

export const CostAllocationResultSchema = z.object({
  periodRange: z.string(),
  rows: z.array(CostAllocationRowSchema),
  totalDirectCosts: z.string(),
  totalAllocatedCosts: z.string(),
  grandTotal: z.string(),
  currency: z.string(),
});
export type CostAllocationResult = z.infer<typeof CostAllocationResultSchema>;

export const EquityMovementRowSchema = z.object({
  description: z.string(),
  shareCapital: z.string(),
  retainedEarnings: z.string(),
  otherReserves: z.string(),
  nci: z.string(),
  total: z.string(),
});
export type EquityMovementRow = z.infer<typeof EquityMovementRowSchema>;

export const EquityStatementResultSchema = z.object({
  periodRange: z.string(),
  rows: z.array(EquityMovementRowSchema),
  openingBalance: EquityMovementRowSchema,
  closingBalance: EquityMovementRowSchema,
  currency: z.string(),
});
export type EquityStatementResult = z.infer<typeof EquityStatementResultSchema>;

export const TaxSummaryRowSchema = z.object({
  taxCode: z.string(),
  taxName: z.string(),
  taxableBase: z.string(),
  taxAmount: z.string(),
  adjustments: z.string(),
  netTax: z.string(),
});
export type TaxSummaryRow = z.infer<typeof TaxSummaryRowSchema>;

export const TaxSummaryResultSchema = z.object({
  periodRange: z.string(),
  rows: z.array(TaxSummaryRowSchema),
  totalTaxableBase: z.string(),
  totalTaxAmount: z.string(),
  totalAdjustments: z.string(),
  totalNetTax: z.string(),
  currency: z.string(),
});
export type TaxSummaryResult = z.infer<typeof TaxSummaryResultSchema>;

export const TrialBalanceRowSchema = z.object({
  accountCode: z.string(),
  accountName: z.string(),
  debit: z.string(),
  credit: z.string(),
  balance: z.string(),
});
export type TrialBalanceRow = z.infer<typeof TrialBalanceRowSchema>;

export const TrialBalanceResultSchema = z.object({
  rows: z.array(TrialBalanceRowSchema),
  totalDebit: z.string(),
  totalCredit: z.string(),
  asOfDate: z.string(),
});
export type TrialBalanceResult = z.infer<typeof TrialBalanceResultSchema>;

export const ReportRowSchema = z.object({
  accountCode: z.string(),
  accountName: z.string(),
  balance: z.string(),
});
export type ReportRow = z.infer<typeof ReportRowSchema>;

export const ReportSectionSchema = z.object({
  label: z.string(),
  rows: z.array(ReportRowSchema),
  total: z.string(),
});
export type ReportSection = z.infer<typeof ReportSectionSchema>;

export const BalanceSheetResultSchema = z.object({
  ledgerId: z.string(),
  periodId: z.string(),
  assets: ReportSectionSchema,
  liabilities: ReportSectionSchema,
  equity: ReportSectionSchema,
  isBalanced: z.boolean(),
  asOfDate: z.string(),
});
export type BalanceSheetResult = z.infer<typeof BalanceSheetResultSchema>;

export const IncomeStatementResultSchema = z.object({
  ledgerId: z.string(),
  fromPeriodId: z.string(),
  toPeriodId: z.string(),
  revenue: ReportSectionSchema,
  expenses: ReportSectionSchema,
  netIncome: z.string(),
  periodRange: z.string(),
});
export type IncomeStatementResult = z.infer<typeof IncomeStatementResultSchema>;

export const CashFlowResultSchema = z.object({
  ledgerId: z.string(),
  fromPeriodId: z.string(),
  toPeriodId: z.string(),
  operatingActivities: z.string(),
  investingActivities: z.string(),
  financingActivities: z.string(),
  netCashFlow: z.string(),
  periodRange: z.string(),
});
export type CashFlowResult = z.infer<typeof CashFlowResultSchema>;

// revenue
export const RevenueContractListItemSchema = z.object({
  id: z.string(),
  contractNumber: z.string(),
  customerName: z.string(),
  totalAmount: z.string(),
  recognizedAmount: z.string(),
  deferredAmount: z.string(),
  currency: z.string(),
  recognitionMethod: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  status: z.string(),
  createdAt: z.string(),
});
export type RevenueContractListItem = z.infer<typeof RevenueContractListItemSchema>;

export const RecognitionMilestoneViewSchema = z.object({
  id: z.string(),
  milestoneName: z.string(),
  targetDate: z.string(),
  completionPercent: z.number(),
  amount: z.string(),
  isRecognized: z.boolean(),
  recognizedAt: z.string().nullable(),
});
export type RecognitionMilestoneView = z.infer<typeof RecognitionMilestoneViewSchema>;

export const RevenueContractDetailSchema = z.object({
  id: z.string(),
  contractNumber: z.string(),
  customerName: z.string(),
  companyId: z.string(),
  totalAmount: z.string(),
  recognizedAmount: z.string(),
  deferredAmount: z.string(),
  currency: z.string(),
  recognitionMethod: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  deferredAccountId: z.string(),
  revenueAccountId: z.string(),
  status: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type RevenueContractDetail = z.infer<typeof RevenueContractDetailSchema>;

// settings
export const PaymentTermsListItemSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  dueDays: z.number(),
  discountDays: z.number().nullable(),
  discountPercent: z.number().nullable(),
  isActive: z.boolean(),
  createdAt: z.string(),
});
export type PaymentTermsListItem = z.infer<typeof PaymentTermsListItemSchema>;

export const PaymentTermsDetailSchema = PaymentTermsListItemSchema.extend({
  lines: z.array(z.string()),
  updatedAt: z.string(),
});
export type PaymentTermsDetail = z.infer<typeof PaymentTermsDetailSchema>;

export const PaymentTermsLineViewSchema = z.object({
  id: z.string(),
  sequence: z.number(),
  duePercent: z.number(),
  dueDays: z.number(),
  discountDays: z.number().nullable(),
  discountPercent: z.number().nullable(),
});
export type PaymentTermsLineView = z.infer<typeof PaymentTermsLineViewSchema>;

// transfer-pricing
export const TransferPricingPolicyViewSchema = z.object({
  id: z.string(),
  policyNumber: z.string(),
  name: z.string(),
  description: z.string(),
  transactionType: z.string(),
  pricingMethod: z.string(),
  status: z.string(),
  entities: z.array(z.string()),
  entityNames: z.array(z.string()),
  armLengthRange: z.record(z.unknown()),
  targetMargin: z.number(),
  currency: z.string(),
  effectiveFrom: z.string(),
  effectiveTo: z.string().nullable(),
  lastReviewDate: z.string().nullable(),
  nextReviewDate: z.string().nullable(),
  documentationId: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type TransferPricingPolicyView = z.infer<typeof TransferPricingPolicyViewSchema>;

export const BenchmarkStudyViewSchema = z.object({
  id: z.string(),
  studyNumber: z.string(),
  policyId: z.string(),
  fiscalYear: z.string(),
  comparableSetSize: z.number(),
  quartiles: z.record(z.unknown()),
  interquartileRange: z.number(),
  actualResult: z.number(),
  isWithinRange: z.boolean(),
  studyProvider: z.string(),
  studyDate: z.string(),
  documentationId: z.string().nullable(),
});
export type BenchmarkStudyView = z.infer<typeof BenchmarkStudyViewSchema>;

export const TransferPricingSummaryViewSchema = z.object({
  totalPolicies: z.number(),
  activePolicies: z.number(),
  policiesForReview: z.number(),
  transactionsYTD: z.number(),
  adjustmentsYTD: z.number(),
  complianceRate: z.number(),
});
export type TransferPricingSummaryView = z.infer<typeof TransferPricingSummaryViewSchema>;

// treasury
export const CashForecastViewSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  periodType: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  currency: z.string(),
  status: z.string(),
  openingBalance: z.number(),
  closingBalance: z.number(),
  totalInflows: z.number(),
  totalOutflows: z.number(),
  netCashFlow: z.number(),
  createdBy: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type CashForecastView = z.infer<typeof CashForecastViewSchema>;

export const CovenantViewSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  type: z.string(),
  facilityId: z.string(),
  facilityName: z.string(),
  lenderId: z.string(),
  lenderName: z.string(),
  metric: z.string(),
  operator: z.string(),
  threshold: z.number(),
  thresholdMax: z.number().optional(),
  currentValue: z.number(),
  status: z.string(),
  testingFrequency: z.string(),
  nextTestDate: z.string(),
  lastTestDate: z.string(),
  gracePeriodDays: z.number(),
  consequences: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type CovenantView = z.infer<typeof CovenantViewSchema>;

export const CovenantTestViewSchema = z.object({
  id: z.string(),
  covenantId: z.string(),
  testDate: z.string(),
  periodEnd: z.string(),
  actualValue: z.number(),
  threshold: z.number(),
  variance: z.number(),
  variancePercent: z.number(),
  status: z.string(),
  notes: z.string(),
  testedBy: z.string(),
  approvedBy: z.string(),
  approvedAt: z.string(),
});
export type CovenantTestView = z.infer<typeof CovenantTestViewSchema>;

export const IntercompanyLoanViewSchema = z.object({
  id: z.string(),
  loanNumber: z.string(),
  lenderEntityId: z.string(),
  lenderEntityName: z.string(),
  borrowerEntityId: z.string(),
  borrowerEntityName: z.string(),
  type: z.string(),
  principal: z.number(),
  outstandingBalance: z.number(),
  currency: z.string(),
  interestRate: z.number(),
  rateType: z.string(),
  referenceRate: z.string().optional(),
  spread: z.number().optional(),
  startDate: z.string(),
  maturityDate: z.string(),
  accruedInterest: z.number(),
  totalInterestPaid: z.number(),
  status: z.string(),
  armLengthRate: z.number(),
  isArmLength: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type IntercompanyLoanView = z.infer<typeof IntercompanyLoanViewSchema>;

export const ICLoanScheduleEntryViewSchema = z.object({
  id: z.string(),
  loanId: z.string(),
  dueDate: z.string(),
  principalDue: z.number(),
  interestDue: z.number(),
  totalDue: z.number(),
  principalPaid: z.number(),
  interestPaid: z.number(),
  paidDate: z.string().nullable(),
  status: z.string(),
});
export type ICLoanScheduleEntryView = z.infer<typeof ICLoanScheduleEntryViewSchema>;

export const TreasurySummaryViewSchema = z.object({
  totalCashPosition: z.number(),
  forecastedEndOfMonth: z.number(),
  activeLoans: z.number(),
  totalLoanBalance: z.number(),
  covenantsAtRisk: z.number(),
  covenantsBreeched: z.number(),
  upcomingMaturities: z.number(),
  netIntercompanyPosition: z.number(),
});
export type TreasurySummaryView = z.infer<typeof TreasurySummaryViewSchema>;

// ── Portal Response Schemas ──

// portal
export const PortalSupplierSchema = z.object({
  supplierId: z.string(),
  supplierName: z.string(),
  supplierCode: z.string(),
  status: z.union([z.string(), z.string(), z.string()]),
  taxId: z.string().nullable(),
  remittanceEmail: z.string().nullable(),
  currencyCode: z.string(),
});
export type PortalSupplier = z.infer<typeof PortalSupplierSchema>;

export const PortalInvoiceListItemSchema = z.object({
  id: z.string(),
  invoiceNumber: z.string(),
  status: z.string(),
  invoiceDate: z.string(),
  dueDate: z.string(),
  totalAmount: z.string(),
  amountPaid: z.string(),
  balanceDue: z.string(),
  currencyCode: z.string(),
});
export type PortalInvoiceListItem = z.infer<typeof PortalInvoiceListItemSchema>;

export const PortalInvoiceDetailSchema = PortalInvoiceListItemSchema.extend({
  supplierRef: z.string().nullable(),
  description: z.string().nullable(),
  lines: z.array(z.string()),
});
export type PortalInvoiceDetail = z.infer<typeof PortalInvoiceDetailSchema>;

export const PortalInvoiceLineSchema = z.object({
  id: z.string(),
  lineNumber: z.number(),
  description: z.string(),
  quantity: z.string(),
  unitPrice: z.string(),
  amount: z.string(),
  taxCode: z.string().nullable(),
  taxAmount: z.string(),
});
export type PortalInvoiceLine = z.infer<typeof PortalInvoiceLineSchema>;

export const PortalAgingBucketSchema = z.object({
  label: z.string(),
  count: z.number(),
  totalAmount: z.string(),
  currencyCode: z.string(),
});
export type PortalAgingBucket = z.infer<typeof PortalAgingBucketSchema>;

export const PortalPaymentRunListItemSchema = z.object({
  id: z.string(),
  runNumber: z.string(),
  runDate: z.string(),
  status: z.string(),
  totalAmount: z.string(),
  currencyCode: z.string(),
  invoiceCount: z.number(),
});
export type PortalPaymentRunListItem = z.infer<typeof PortalPaymentRunListItemSchema>;

export const PortalRemittanceItemSchema = z.object({
  invoiceId: z.string(),
  invoiceNumber: z.string(),
  grossAmount: z.string(),
  discountAmount: z.string(),
  netAmount: z.string(),
});
export type PortalRemittanceItem = z.infer<typeof PortalRemittanceItemSchema>;

export const PortalRemittanceAdviceSchema = z.object({
  paymentRunId: z.string(),
  runNumber: z.string(),
  runDate: z.string(),
  currencyCode: z.string(),
  supplierName: z.string(),
  items: z.array(PortalRemittanceItemSchema),
  totalGross: z.string(),
  totalDiscount: z.string(),
  totalNet: z.string(),
});
export type PortalRemittanceAdvice = z.infer<typeof PortalRemittanceAdviceSchema>;

export const PortalBankAccountSchema = z.object({
  id: z.string(),
  bankName: z.string(),
  accountName: z.string(),
  accountNumber: z.string(),
  iban: z.string().nullable(),
  swiftBic: z.string().nullable(),
  currencyCode: z.string(),
  isPrimary: z.boolean(),
});
export type PortalBankAccount = z.infer<typeof PortalBankAccountSchema>;

export const PortalDocumentSchema = z.object({
  id: z.string(),
  category: z.string(),
  title: z.string(),
  fileName: z.string(),
  mimeType: z.string(),
  fileSizeBytes: z.number(),
  checksumSha256: z.string(),
  expiresAt: z.string().nullable(),
  createdAt: z.string(),
});
export type PortalDocument = z.infer<typeof PortalDocumentSchema>;

export const PortalDisputeSchema = z.object({
  id: z.string(),
  invoiceId: z.string().nullable(),
  paymentRunId: z.string().nullable(),
  category: z.string(),
  subject: z.string(),
  description: z.string(),
  status: z.string(),
  resolution: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type PortalDispute = z.infer<typeof PortalDisputeSchema>;

export const PortalWhtCertificateSchema = z.object({
  id: z.string(),
  invoiceId: z.string(),
  certificateNumber: z.string(),
  whtAmount: z.string(),
  currencyCode: z.string(),
  periodStart: z.string(),
  periodEnd: z.string(),
  issuedAt: z.string(),
});
export type PortalWhtCertificate = z.infer<typeof PortalWhtCertificateSchema>;

export const PortalComplianceItemSchema = z.object({
  itemType: z.string(),
  status: z.string(),
  expiresAt: z.string().nullable(),
  lastVerifiedAt: z.string().nullable(),
  notes: z.string().nullable(),
});
export type PortalComplianceItem = z.infer<typeof PortalComplianceItemSchema>;

export const PortalComplianceSummarySchema = z.object({
  items: z.array(PortalComplianceItemSchema),
  overallStatus: z.string(),
});
export type PortalComplianceSummary = z.infer<typeof PortalComplianceSummarySchema>;

export const PortalNotificationPrefSchema = z.object({
  eventType: z.string(),
  channel: z.string(),
  enabled: z.boolean(),
  webhookUrl: z.string().nullable(),
});
export type PortalNotificationPref = z.infer<typeof PortalNotificationPrefSchema>;

export const PortalReconResultSchema = z.object({
  matchedCount: z.number(),
  unmatchedCount: z.number(),
  statementOnlyCount: z.number(),
  matched: z.array(z.string()),
  unmatched: z.array(z.string()),
  statementOnly: z.array(z.string()),
});
export type PortalReconResult = z.infer<typeof PortalReconResultSchema>;

export const PortalReconLineSchema = z.object({
  statementRef: z.string(),
  statementAmount: z.string(),
  ledgerRef: z.string().nullable(),
  ledgerAmount: z.string().nullable(),
  status: z.string(),
});
export type PortalReconLine = z.infer<typeof PortalReconLineSchema>;

export const PortalDashboardSummarySchema = z.object({
  openInvoiceCount: z.number(),
  openInvoiceAmount: z.string(),
  overdueInvoiceCount: z.number(),
  overdueInvoiceAmount: z.string(),
  paidLast30Count: z.number(),
  paidLast30Amount: z.string(),
  currencyCode: z.string(),
  aging: z.array(PortalAgingBucketSchema),
  compliance: PortalComplianceSummarySchema,
  recentInvoices: z.array(PortalInvoiceListItemSchema),
  openDisputes: z.array(PortalDisputeSchema),
});
export type PortalDashboardSummary = z.infer<typeof PortalDashboardSummarySchema>;

// ─── Kernel Contracts ─────────────────────────────────────────────────────────
export * from './kernel/index.js';

// ─── Finance Chart Contracts ──────────────────────────────────────────────────
export * from './finance/charts.js';

// ─── Portal 2.0 Contracts (SP-2000 series) ────────────────────────────────────
export * from './portal/index.js';
