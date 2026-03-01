/**
 * GL-12: Opening balance import validator and transformer.
 * Pure calculator — validates trial balance lines, computes auto-balancing
 * entry to retained earnings, and produces structured opening journal lines.
 *
 * Used when onboarding a new client or migrating from another system.
 * All monetary values are bigint (minor units).
 */
import type { CalculatorResult } from '../../../shared/types.js';

export interface OpeningBalanceLine {
  readonly accountCode: string;
  readonly accountName: string;
  readonly debit: bigint;
  readonly credit: bigint;
  /** Optional reference to source system for migration audit trail. */
  readonly sourceSystemRef?: string;
}

export interface OpeningBalanceInput {
  readonly ledgerId: string;
  readonly periodId: string;
  readonly postingDate: string;
  readonly lines: readonly OpeningBalanceLine[];
  readonly retainedEarningsAccountCode: string;
  readonly description?: string;
  readonly sourceSystem?: string;
}

export interface OpeningBalanceResult {
  readonly journalLines: readonly OpeningJournalLine[];
  readonly totalDebits: bigint;
  readonly totalCredits: bigint;
  readonly isBalanced: boolean;
  /** Auto-balancing entry added to retained earnings (0 if already balanced). */
  readonly autoBalanceAmount: bigint;
  readonly autoBalanceSide: 'DEBIT' | 'CREDIT' | 'NONE';
  readonly lineCount: number;
  readonly warnings: readonly string[];
}

export interface OpeningJournalLine {
  readonly accountCode: string;
  readonly accountName: string;
  readonly debit: bigint;
  readonly credit: bigint;
  readonly isAutoBalance: boolean;
  readonly sourceSystemRef?: string;
}

/**
 * Validates and transforms opening balance trial balance into journal lines.
 *
 * Rules:
 * 1. Each line must have either debit OR credit (not both non-zero).
 * 2. Zero-amount lines are skipped with a warning.
 * 3. If total debits ≠ total credits, an auto-balancing entry is created
 *    against retained earnings (common in migrations).
 * 4. Duplicate account codes are flagged as warnings but allowed
 *    (may represent sub-ledger detail).
 */
export function validateOpeningBalances(
  input: OpeningBalanceInput
): CalculatorResult<OpeningBalanceResult> {
  if (input.lines.length === 0) {
    throw new Error('Opening balance import requires at least one line');
  }

  const warnings: string[] = [];
  const journalLines: OpeningJournalLine[] = [];
  let totalDebits = 0n;
  let totalCredits = 0n;

  // Track duplicate account codes
  const seenCodes = new Map<string, number>();

  for (const line of input.lines) {
    // Validate: cannot have both debit and credit non-zero
    if (line.debit > 0n && line.credit > 0n) {
      throw new Error(
        `Account '${line.accountCode}' has both debit (${line.debit}) and credit (${line.credit}). Each line must be one-sided.`
      );
    }

    // Skip zero lines
    if (line.debit === 0n && line.credit === 0n) {
      warnings.push(`Skipped zero-amount line for account '${line.accountCode}'`);
      continue;
    }

    // Validate: no negative amounts
    if (line.debit < 0n || line.credit < 0n) {
      throw new Error(
        `Account '${line.accountCode}' has negative amount. Use debit/credit sides instead.`
      );
    }

    // Track duplicates
    const count = (seenCodes.get(line.accountCode) ?? 0) + 1;
    seenCodes.set(line.accountCode, count);
    if (count === 2) {
      warnings.push(
        `Duplicate account code '${line.accountCode}' — may represent sub-ledger detail`
      );
    }

    totalDebits += line.debit;
    totalCredits += line.credit;

    journalLines.push({
      accountCode: line.accountCode,
      accountName: line.accountName,
      debit: line.debit,
      credit: line.credit,
      isAutoBalance: false,
      sourceSystemRef: line.sourceSystemRef,
    });
  }

  // Auto-balance to retained earnings if needed
  let autoBalanceAmount = 0n;
  let autoBalanceSide: 'DEBIT' | 'CREDIT' | 'NONE' = 'NONE';

  if (totalDebits !== totalCredits) {
    const diff = totalDebits - totalCredits;
    if (diff > 0n) {
      // More debits — credit retained earnings
      autoBalanceAmount = diff;
      autoBalanceSide = 'CREDIT';
      journalLines.push({
        accountCode: input.retainedEarningsAccountCode,
        accountName: 'Retained Earnings (Auto-Balance)',
        debit: 0n,
        credit: diff,
        isAutoBalance: true,
      });
      totalCredits += diff;
    } else {
      // More credits — debit retained earnings
      autoBalanceAmount = -diff;
      autoBalanceSide = 'DEBIT';
      journalLines.push({
        accountCode: input.retainedEarningsAccountCode,
        accountName: 'Retained Earnings (Auto-Balance)',
        debit: -diff,
        credit: 0n,
        isAutoBalance: true,
      });
      totalDebits += -diff;
    }
    warnings.push(
      `Trial balance was unbalanced by ${autoBalanceAmount}. Auto-balance entry added to '${input.retainedEarningsAccountCode}' (${autoBalanceSide}).`
    );
  }

  return {
    result: {
      journalLines,
      totalDebits,
      totalCredits,
      isBalanced: totalDebits === totalCredits,
      autoBalanceAmount,
      autoBalanceSide,
      lineCount: journalLines.length,
      warnings,
    },
    inputs: {
      ledgerId: input.ledgerId,
      periodId: input.periodId,
      lineCount: input.lines.length,
      sourceSystem: input.sourceSystem ?? 'manual',
    },
    explanation:
      `Opening balance: ${journalLines.length} lines, debits=${totalDebits}, credits=${totalCredits}${ 
      autoBalanceAmount > 0n ? `, auto-balanced ${autoBalanceAmount} to retained earnings` : '' 
      }${warnings.length > 0 ? `, ${warnings.length} warnings` : ''}`,
  };
}
