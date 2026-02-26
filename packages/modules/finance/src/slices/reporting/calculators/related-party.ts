/**
 * SR-04: Related party disclosures calculator (IAS 24).
 * Pure calculator — identifies and categorizes related party transactions
 * and balances for disclosure purposes.
 */
import type { CalculatorResult } from '../../../shared/types.js';

export type RelatedPartyType =
  | 'PARENT'
  | 'SUBSIDIARY'
  | 'ASSOCIATE'
  | 'JOINT_VENTURE'
  | 'KEY_MANAGEMENT'
  | 'CLOSE_FAMILY'
  | 'POST_EMPLOYMENT_PLAN'
  | 'OTHER';

export type TransactionNature =
  | 'SALE_OF_GOODS'
  | 'PURCHASE_OF_GOODS'
  | 'RENDERING_OF_SERVICES'
  | 'RECEIVING_OF_SERVICES'
  | 'LEASE'
  | 'LOAN'
  | 'GUARANTEE'
  | 'MANAGEMENT_FEE'
  | 'DIVIDEND'
  | 'OTHER';

export interface RelatedPartyTransaction {
  readonly partyId: string;
  readonly partyName: string;
  readonly partyType: RelatedPartyType;
  readonly transactionNature: TransactionNature;
  readonly transactionAmount: bigint;
  readonly outstandingBalance: bigint;
  readonly currencyCode: string;
  readonly isArmsLength: boolean;
}

export interface RelatedPartyDisclosure {
  readonly partyId: string;
  readonly partyName: string;
  readonly partyType: RelatedPartyType;
  readonly transactions: readonly {
    readonly nature: TransactionNature;
    readonly totalAmount: bigint;
    readonly outstandingBalance: bigint;
    readonly currencyCode: string;
  }[];
  readonly totalTransactionAmount: bigint;
  readonly totalOutstandingBalance: bigint;
  readonly hasNonArmsLengthTransactions: boolean;
}

export interface RelatedPartyResult {
  readonly disclosures: readonly RelatedPartyDisclosure[];
  readonly totalTransactionsAmount: bigint;
  readonly totalOutstandingBalances: bigint;
  readonly nonArmsLengthCount: number;
}

/**
 * Aggregates related party transactions into disclosure format grouped by party.
 */
export function computeRelatedPartyDisclosures(
  transactions: readonly RelatedPartyTransaction[]
): CalculatorResult<RelatedPartyResult> {
  if (transactions.length === 0) {
    return {
      result: {
        disclosures: [],
        totalTransactionsAmount: 0n,
        totalOutstandingBalances: 0n,
        nonArmsLengthCount: 0,
      },
      inputs: { transactionCount: 0 },
      explanation: 'No related party transactions to disclose',
    };
  }

  const grouped = new Map<string, RelatedPartyTransaction[]>();
  for (const tx of transactions) {
    const existing = grouped.get(tx.partyId) ?? [];
    existing.push(tx);
    grouped.set(tx.partyId, existing);
  }

  let totalTransactionsAmount = 0n;
  let totalOutstandingBalances = 0n;
  let nonArmsLengthCount = 0;

  const disclosures: RelatedPartyDisclosure[] = [];

  for (const [partyId, partyTxns] of grouped) {
    const first = partyTxns[0]!;

    // Aggregate by transaction nature
    const byNature = new Map<
      TransactionNature,
      { amount: bigint; balance: bigint; currency: string }
    >();
    let hasNonArmsLength = false;

    for (const tx of partyTxns) {
      const existing = byNature.get(tx.transactionNature) ?? {
        amount: 0n,
        balance: 0n,
        currency: tx.currencyCode,
      };
      existing.amount += tx.transactionAmount;
      existing.balance += tx.outstandingBalance;
      byNature.set(tx.transactionNature, existing);

      if (!tx.isArmsLength) {
        hasNonArmsLength = true;
        nonArmsLengthCount++;
      }
    }

    const txnSummaries = Array.from(byNature.entries()).map(([nature, data]) => ({
      nature,
      totalAmount: data.amount,
      outstandingBalance: data.balance,
      currencyCode: data.currency,
    }));

    const partyTotal = txnSummaries.reduce((sum, t) => sum + t.totalAmount, 0n);
    const partyBalance = txnSummaries.reduce((sum, t) => sum + t.outstandingBalance, 0n);

    totalTransactionsAmount += partyTotal;
    totalOutstandingBalances += partyBalance;

    disclosures.push({
      partyId,
      partyName: first.partyName,
      partyType: first.partyType,
      transactions: txnSummaries,
      totalTransactionAmount: partyTotal,
      totalOutstandingBalance: partyBalance,
      hasNonArmsLengthTransactions: hasNonArmsLength,
    });
  }

  return {
    result: { disclosures, totalTransactionsAmount, totalOutstandingBalances, nonArmsLengthCount },
    inputs: { transactionCount: transactions.length, partyCount: disclosures.length },
    explanation: `Related party: ${disclosures.length} parties, ${transactions.length} transactions, ${nonArmsLengthCount} non-arms-length`,
  };
}
