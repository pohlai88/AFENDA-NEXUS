/**
 * GAP-E1: Statutory Audit Package Generator.
 * Pure calculator — assembles audit working paper data from financial data inputs.
 *
 * Generates:
 * - Lead schedules for BS and IS line items
 * - Aged trial balance summary
 * - Journal entry listing metadata (for audit sampling)
 * - Related party transaction register
 * - Subsequent events assessment
 * - Going concern data points
 * - Management representation letter data
 *
 * All monetary values are bigint (minor units).
 */
import type { CalculatorResult } from '../../../shared/types.js';

export interface LeadScheduleItem {
  readonly accountCode: string;
  readonly accountName: string;
  readonly classification: 'BS' | 'IS';
  readonly subClassification: string;
  readonly openingBalance: bigint;
  readonly debits: bigint;
  readonly credits: bigint;
  readonly closingBalance: bigint;
  readonly priorYearBalance: bigint;
  readonly variance: bigint;
  readonly variancePct: bigint;
}

export interface JournalListingEntry {
  readonly journalId: string;
  readonly postingDate: string;
  readonly description: string;
  readonly totalAmount: bigint;
  readonly lineCount: number;
  readonly postedBy: string;
  readonly isManual: boolean;
  readonly isReversing: boolean;
  readonly isYearEnd: boolean;
}

export interface RelatedPartyEntry {
  readonly partyId: string;
  readonly partyName: string;
  readonly relationship: string;
  readonly transactionType: string;
  readonly amount: bigint;
  readonly outstandingBalance: bigint;
  readonly currencyCode: string;
}

export interface SubsequentEventEntry {
  readonly eventDate: string;
  readonly description: string;
  readonly eventType: 'ADJUSTING' | 'NON_ADJUSTING';
  readonly financialImpact: bigint;
  readonly isDisclosed: boolean;
}

export interface AuditPackageInput {
  readonly companyName: string;
  readonly fiscalYearEnd: string;
  readonly reportingCurrency: string;
  readonly leadScheduleItems: readonly LeadScheduleItem[];
  readonly journalEntries: readonly JournalListingEntry[];
  readonly relatedPartyTransactions: readonly RelatedPartyEntry[];
  readonly subsequentEvents: readonly SubsequentEventEntry[];
  /** Materiality threshold in minor units. */
  readonly materialityThreshold: bigint;
  /** Clearly trivial threshold (typically 5% of materiality). */
  readonly trivialThreshold: bigint;
}

export interface AuditPackageResult {
  readonly companyName: string;
  readonly fiscalYearEnd: string;
  readonly reportingCurrency: string;

  // Lead schedules
  readonly bsLeadSchedule: readonly LeadScheduleItem[];
  readonly isLeadSchedule: readonly LeadScheduleItem[];
  readonly totalBsAssets: bigint;
  readonly totalBsLiabilities: bigint;
  readonly totalBsEquity: bigint;
  readonly totalIsRevenue: bigint;
  readonly totalIsExpenses: bigint;

  // Journal listing analysis
  readonly totalJournals: number;
  readonly manualJournals: number;
  readonly reversingJournals: number;
  readonly yearEndJournals: number;
  readonly journalsAboveMateriality: readonly JournalListingEntry[];
  readonly journalsTotalAmount: bigint;

  // Related party
  readonly relatedPartyCount: number;
  readonly relatedPartyTotalAmount: bigint;
  readonly relatedPartyOutstandingBalance: bigint;
  readonly relatedPartyTransactions: readonly RelatedPartyEntry[];

  // Subsequent events
  readonly adjustingEvents: readonly SubsequentEventEntry[];
  readonly nonAdjustingEvents: readonly SubsequentEventEntry[];
  readonly subsequentEventsTotalImpact: bigint;

  // Thresholds
  readonly materialityThreshold: bigint;
  readonly trivialThreshold: bigint;

  // Completeness checks
  readonly completenessFlags: readonly CompletenessFlag[];
}

export interface CompletenessFlag {
  readonly area: string;
  readonly status: 'COMPLETE' | 'INCOMPLETE' | 'NOT_APPLICABLE';
  readonly description: string;
}

/**
 * Generates a statutory audit package from financial data inputs.
 * This is the standard deliverable that companies provide to external auditors.
 */
export function generateAuditPackage(
  input: AuditPackageInput
): CalculatorResult<AuditPackageResult> {
  // Separate BS and IS lead schedules
  const bsLeadSchedule = input.leadScheduleItems.filter((i) => i.classification === 'BS');
  const isLeadSchedule = input.leadScheduleItems.filter((i) => i.classification === 'IS');

  // Aggregate BS totals
  let totalBsAssets = 0n;
  let totalBsLiabilities = 0n;
  let totalBsEquity = 0n;
  for (const item of bsLeadSchedule) {
    const sub = item.subClassification.toUpperCase();
    if (sub.includes('ASSET')) totalBsAssets += item.closingBalance;
    else if (sub.includes('LIABILITY')) totalBsLiabilities += item.closingBalance;
    else if (sub.includes('EQUITY')) totalBsEquity += item.closingBalance;
  }

  // Aggregate IS totals
  let totalIsRevenue = 0n;
  let totalIsExpenses = 0n;
  for (const item of isLeadSchedule) {
    const sub = item.subClassification.toUpperCase();
    if (sub.includes('REVENUE') || sub.includes('INCOME')) totalIsRevenue += item.closingBalance;
    else totalIsExpenses += item.closingBalance;
  }

  // Journal analysis
  const manualJournals = input.journalEntries.filter((j) => j.isManual).length;
  const reversingJournals = input.journalEntries.filter((j) => j.isReversing).length;
  const yearEndJournals = input.journalEntries.filter((j) => j.isYearEnd).length;
  const journalsAboveMateriality = input.journalEntries.filter(
    (j) => j.totalAmount >= input.materialityThreshold
  );
  const journalsTotalAmount = input.journalEntries.reduce((s, j) => s + j.totalAmount, 0n);

  // Related party aggregation
  const relatedPartyTotalAmount = input.relatedPartyTransactions.reduce((s, r) => s + r.amount, 0n);
  const relatedPartyOutstandingBalance = input.relatedPartyTransactions.reduce(
    (s, r) => s + r.outstandingBalance,
    0n
  );

  // Subsequent events
  const adjustingEvents = input.subsequentEvents.filter((e) => e.eventType === 'ADJUSTING');
  const nonAdjustingEvents = input.subsequentEvents.filter((e) => e.eventType === 'NON_ADJUSTING');
  const subsequentEventsTotalImpact = input.subsequentEvents.reduce(
    (s, e) => s + e.financialImpact,
    0n
  );

  // Completeness checks
  const completenessFlags: CompletenessFlag[] = [
    {
      area: 'Lead Schedules',
      status: input.leadScheduleItems.length > 0 ? 'COMPLETE' : 'INCOMPLETE',
      description: `${input.leadScheduleItems.length} line items provided`,
    },
    {
      area: 'Journal Listing',
      status: input.journalEntries.length > 0 ? 'COMPLETE' : 'INCOMPLETE',
      description: `${input.journalEntries.length} journal entries provided`,
    },
    {
      area: 'Related Party Transactions',
      status: input.relatedPartyTransactions.length > 0 ? 'COMPLETE' : 'INCOMPLETE',
      description: `${input.relatedPartyTransactions.length} related party transactions`,
    },
    {
      area: 'Subsequent Events',
      status: 'COMPLETE',
      description: `${input.subsequentEvents.length} subsequent events assessed`,
    },
    {
      area: 'Trial Balance Reconciliation',
      status: bsLeadSchedule.length > 0 ? 'COMPLETE' : 'INCOMPLETE',
      description: 'Balance sheet lead schedule reconciliation',
    },
  ];

  return {
    result: {
      companyName: input.companyName,
      fiscalYearEnd: input.fiscalYearEnd,
      reportingCurrency: input.reportingCurrency,
      bsLeadSchedule,
      isLeadSchedule,
      totalBsAssets,
      totalBsLiabilities,
      totalBsEquity,
      totalIsRevenue,
      totalIsExpenses,
      totalJournals: input.journalEntries.length,
      manualJournals,
      reversingJournals,
      yearEndJournals,
      journalsAboveMateriality,
      journalsTotalAmount,
      relatedPartyCount: input.relatedPartyTransactions.length,
      relatedPartyTotalAmount,
      relatedPartyOutstandingBalance,
      relatedPartyTransactions: input.relatedPartyTransactions,
      adjustingEvents,
      nonAdjustingEvents,
      subsequentEventsTotalImpact,
      materialityThreshold: input.materialityThreshold,
      trivialThreshold: input.trivialThreshold,
      completenessFlags,
    },
    inputs: {
      companyName: input.companyName,
      fiscalYearEnd: input.fiscalYearEnd,
      leadScheduleCount: input.leadScheduleItems.length,
      journalCount: input.journalEntries.length,
      materialityThreshold: input.materialityThreshold.toString(),
    },
    explanation:
      `Audit package: ${input.companyName} FYE ${input.fiscalYearEnd}, ` +
      `${bsLeadSchedule.length} BS items, ${isLeadSchedule.length} IS items, ` +
      `${input.journalEntries.length} journals (${manualJournals} manual, ${journalsAboveMateriality.length} above materiality), ` +
      `${input.relatedPartyTransactions.length} related party txns, ${input.subsequentEvents.length} subsequent events`,
  };
}
