/**
 * Bank match entity — links a bank statement line to a GL journal or other source document.
 */

export type MatchType = 'AUTO' | 'MANUAL';
export type MatchConfidence = 'HIGH' | 'MEDIUM' | 'LOW';

export interface BankMatch {
  readonly id: string;
  readonly tenantId: string;
  readonly statementLineId: string;
  readonly journalId: string | null;
  readonly sourceDocumentId: string | null;
  readonly sourceDocumentType: string | null;
  readonly matchType: MatchType;
  readonly confidence: MatchConfidence;
  readonly confidenceScore: number;
  readonly matchedAmount: bigint;
  readonly currencyCode: string;
  readonly matchedAt: Date;
  readonly matchedBy: string | null;
  readonly confirmedAt: Date | null;
  readonly confirmedBy: string | null;
  readonly createdAt: Date;
}
