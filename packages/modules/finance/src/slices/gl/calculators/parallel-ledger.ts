/**
 * GL-12: Multi-GAAP / Parallel Ledger support.
 * Pure calculator — computes adjustment entries between ledger purposes.
 *
 * Enables maintaining multiple accounting treatments for the same transaction:
 * - PRIMARY (local GAAP, e.g. MFRS, SFRS)
 * - STATUTORY (IFRS for group consolidation)
 * - TAX (tax-specific depreciation / recognition)
 * - MANAGEMENT (cost allocation / transfer pricing)
 *
 * All monetary values are bigint (minor units).
 */

import type { CalculatorResult } from '../../../shared/types.js';

export type LedgerPurpose = 'PRIMARY' | 'STATUTORY' | 'TAX' | 'MANAGEMENT';

export interface LedgerMappingRule {
  readonly ruleId: string;
  readonly sourceAccountCode: string;
  readonly targetAccountCode: string;
  readonly sourceLedgerPurpose: LedgerPurpose;
  readonly targetLedgerPurpose: LedgerPurpose;
  readonly adjustmentType: 'RECLASSIFICATION' | 'REVALUATION' | 'TIMING' | 'PERMANENT';
  readonly adjustmentBps: number; // basis points — 10000 = 100%
  readonly description: string;
}

export interface ParallelLedgerEntry {
  readonly journalId: string;
  readonly accountCode: string;
  readonly amount: bigint;
  readonly isDebit: boolean;
  readonly ledgerPurpose: LedgerPurpose;
  readonly periodId: string;
  readonly description: string;
}

export interface ParallelLedgerInput {
  readonly sourceEntries: readonly ParallelLedgerEntry[];
  readonly mappingRules: readonly LedgerMappingRule[];
  readonly targetLedgerPurpose: LedgerPurpose;
}

export interface AdjustmentEntry {
  readonly sourceJournalId: string;
  readonly ruleId: string;
  readonly sourceAccountCode: string;
  readonly targetAccountCode: string;
  readonly amount: bigint;
  readonly isDebit: boolean;
  readonly adjustmentType: string;
  readonly periodId: string;
  readonly description: string;
}

export interface ParallelLedgerResult {
  readonly targetLedgerPurpose: LedgerPurpose;
  readonly adjustmentEntries: readonly AdjustmentEntry[];
  readonly totalAdjustments: number;
  readonly totalDebitAdjustments: bigint;
  readonly totalCreditAdjustments: bigint;
  readonly isBalanced: boolean;
  readonly unmappedEntries: number;
  readonly ruleApplicationCount: Record<string, number>;
}

export function computeParallelLedgerAdjustments(
  input: ParallelLedgerInput
): CalculatorResult<ParallelLedgerResult> {
  if (input.sourceEntries.length === 0) {
    throw new Error('At least one source entry is required');
  }

  const adjustments: AdjustmentEntry[] = [];
  const ruleAppCount: Record<string, number> = {};
  let unmapped = 0;

  for (const entry of input.sourceEntries) {
    // Find applicable rules
    const applicableRules = input.mappingRules.filter(
      (r) =>
        r.sourceAccountCode === entry.accountCode &&
        r.sourceLedgerPurpose === entry.ledgerPurpose &&
        r.targetLedgerPurpose === input.targetLedgerPurpose
    );

    if (applicableRules.length === 0) {
      unmapped++;
      continue;
    }

    for (const rule of applicableRules) {
      const adjustedAmount = (entry.amount * BigInt(rule.adjustmentBps)) / 10000n;

      if (adjustedAmount === 0n) continue;

      // Create the adjustment entry (debit)
      adjustments.push({
        sourceJournalId: entry.journalId,
        ruleId: rule.ruleId,
        sourceAccountCode: rule.sourceAccountCode,
        targetAccountCode: rule.targetAccountCode,
        amount: adjustedAmount,
        isDebit: entry.isDebit,
        adjustmentType: rule.adjustmentType,
        periodId: entry.periodId,
        description: `${rule.description} [${rule.adjustmentType}]`,
      });

      // Create the offsetting entry (credit)
      adjustments.push({
        sourceJournalId: entry.journalId,
        ruleId: rule.ruleId,
        sourceAccountCode: rule.targetAccountCode,
        targetAccountCode: rule.sourceAccountCode,
        amount: adjustedAmount,
        isDebit: !entry.isDebit,
        adjustmentType: rule.adjustmentType,
        periodId: entry.periodId,
        description: `${rule.description} [${rule.adjustmentType}] — offset`,
      });

      ruleAppCount[rule.ruleId] = (ruleAppCount[rule.ruleId] ?? 0) + 1;
    }
  }

  let totalDebits = 0n;
  let totalCredits = 0n;
  for (const adj of adjustments) {
    if (adj.isDebit) totalDebits += adj.amount;
    else totalCredits += adj.amount;
  }

  const result: ParallelLedgerResult = {
    targetLedgerPurpose: input.targetLedgerPurpose,
    adjustmentEntries: adjustments,
    totalAdjustments: adjustments.length,
    totalDebitAdjustments: totalDebits,
    totalCreditAdjustments: totalCredits,
    isBalanced: totalDebits === totalCredits,
    unmappedEntries: unmapped,
    ruleApplicationCount: ruleAppCount,
  };

  return {
    result,
    inputs: {
      sourceEntryCount: input.sourceEntries.length,
      ruleCount: input.mappingRules.length,
      targetLedgerPurpose: input.targetLedgerPurpose,
    },
    explanation:
      `Parallel ledger → ${input.targetLedgerPurpose}: ${adjustments.length} adjustments from ${input.sourceEntries.length} source entries, ` +
      `debits=${totalDebits}, credits=${totalCredits}, ${result.isBalanced ? 'balanced' : 'UNBALANCED'}, ` +
      `${unmapped} unmapped entries`,
  };
}
