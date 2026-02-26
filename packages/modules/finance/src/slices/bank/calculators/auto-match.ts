/**
 * BR-02: Auto-matching algorithm (amount + date + reference scoring).
 * Pure calculator — no DB, no side effects.
 * Uses integer scoring (0–100) to rank match candidates.
 */

import type { BankStatementLine } from '../entities/bank-statement-line.js';

export interface GlCandidate {
  readonly id: string;
  readonly journalId: string;
  readonly transactionDate: Date;
  readonly amount: bigint;
  readonly currencyCode: string;
  readonly reference: string | null;
  readonly description: string;
}

export interface MatchCandidate {
  readonly statementLineId: string;
  readonly candidateId: string;
  readonly journalId: string;
  readonly score: number;
  readonly amountMatch: boolean;
  readonly dateMatch: boolean;
  readonly referenceMatch: boolean;
}

export interface AutoMatchResult {
  readonly matched: readonly MatchCandidate[];
  readonly unmatched: readonly string[];
  readonly totalLines: number;
  readonly matchRate: number;
}

export interface AutoMatchConfig {
  readonly amountWeight: number;
  readonly dateWeight: number;
  readonly referenceWeight: number;
  readonly dateToleranceDays: number;
  readonly minScore: number;
}

const DEFAULT_CONFIG: AutoMatchConfig = {
  amountWeight: 50,
  dateWeight: 30,
  referenceWeight: 20,
  dateToleranceDays: 3,
  minScore: 60,
};

/**
 * Auto-match bank statement lines against GL candidates.
 * Returns scored matches above the minimum threshold.
 */
export function autoMatchLines(
  lines: readonly BankStatementLine[],
  candidates: readonly GlCandidate[],
  config: AutoMatchConfig = DEFAULT_CONFIG
): AutoMatchResult {
  const matched: MatchCandidate[] = [];
  const unmatched: string[] = [];
  const usedCandidates = new Set<string>();

  for (const line of lines) {
    if (line.matchStatus !== 'UNMATCHED') continue;

    let bestMatch: MatchCandidate | null = null;

    for (const candidate of candidates) {
      if (usedCandidates.has(candidate.id)) continue;
      if (candidate.currencyCode !== line.currencyCode) continue;

      const amountMatch = candidate.amount === line.amount;
      const dateMatch = isWithinDays(
        line.transactionDate,
        candidate.transactionDate,
        config.dateToleranceDays
      );
      const referenceMatch = matchReference(
        line.reference,
        line.description,
        candidate.reference,
        candidate.description
      );

      let score = 0;
      if (amountMatch) score += config.amountWeight;
      if (dateMatch) score += config.dateWeight;
      if (referenceMatch) score += config.referenceWeight;

      if (score >= config.minScore && (!bestMatch || score > bestMatch.score)) {
        bestMatch = {
          statementLineId: line.id,
          candidateId: candidate.id,
          journalId: candidate.journalId,
          score,
          amountMatch,
          dateMatch,
          referenceMatch,
        };
      }
    }

    if (bestMatch) {
      matched.push(bestMatch);
      usedCandidates.add(bestMatch.candidateId);
    } else {
      unmatched.push(line.id);
    }
  }

  const totalLines = lines.filter((l) => l.matchStatus === 'UNMATCHED').length;
  return {
    matched,
    unmatched,
    totalLines,
    // eslint-disable-next-line no-restricted-syntax -- CIG-02 bridge: matchRate is a non-monetary percentage, not an FX conversion
    matchRate: totalLines > 0 ? Math.round((matched.length / totalLines) * 100) : 0,
  };
}

function isWithinDays(a: Date, b: Date, days: number): boolean {
  const diff = Math.abs(a.getTime() - b.getTime());
  return diff <= days * 86400000;
}

function matchReference(
  lineRef: string | null,
  lineDesc: string,
  candidateRef: string | null,
  candidateDesc: string
): boolean {
  if (lineRef && candidateRef && lineRef.toLowerCase() === candidateRef.toLowerCase()) return true;
  if (lineRef && candidateDesc.toLowerCase().includes(lineRef.toLowerCase())) return true;
  if (candidateRef && lineDesc.toLowerCase().includes(candidateRef.toLowerCase())) return true;
  return false;
}
