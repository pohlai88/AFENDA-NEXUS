/**
 * BR-07: Bank charges auto-recognition (rule-based).
 * Pure calculator — no DB, no side effects.
 * Classifies bank statement lines as known charge types based on rules.
 */

import type { BankStatementLine } from '../entities/bank-statement-line.js';

export type ChargeCategory =
  | 'SERVICE_FEE'
  | 'WIRE_FEE'
  | 'OVERDRAFT_INTEREST'
  | 'CARD_FEE'
  | 'FX_FEE'
  | 'PENALTY'
  | 'UNKNOWN';

export interface ChargeRule {
  readonly pattern: RegExp;
  readonly category: ChargeCategory;
  readonly glAccountId: string;
}

export interface ClassifiedCharge {
  readonly statementLineId: string;
  readonly amount: bigint;
  readonly category: ChargeCategory;
  readonly glAccountId: string | null;
  readonly description: string;
  readonly confidence: number;
}

export interface ChargeClassificationResult {
  readonly charges: readonly ClassifiedCharge[];
  readonly totalCharges: bigint;
  readonly categorySummary: ReadonlyMap<ChargeCategory, bigint>;
}

const DEFAULT_RULES: readonly ChargeRule[] = [
  { pattern: /service\s*(fee|charge)/i, category: 'SERVICE_FEE', glAccountId: 'bank-charges' },
  { pattern: /wire\s*(transfer|fee)/i, category: 'WIRE_FEE', glAccountId: 'bank-charges' },
  { pattern: /overdraft/i, category: 'OVERDRAFT_INTEREST', glAccountId: 'interest-expense' },
  { pattern: /card\s*(fee|charge|annual)/i, category: 'CARD_FEE', glAccountId: 'bank-charges' },
  { pattern: /fx\s*(fee|charge|conversion)/i, category: 'FX_FEE', glAccountId: 'bank-charges' },
  { pattern: /penalty|late\s*fee/i, category: 'PENALTY', glAccountId: 'bank-charges' },
];

/**
 * Classify bank statement debit lines as known bank charges.
 */
export function classifyBankCharges(
  lines: readonly BankStatementLine[],
  rules: readonly ChargeRule[] = DEFAULT_RULES
): ChargeClassificationResult {
  const charges: ClassifiedCharge[] = [];
  let totalCharges = 0n;
  const categorySummary = new Map<ChargeCategory, bigint>();

  for (const line of lines) {
    if (line.transactionType !== 'DEBIT') continue;

    let matched = false;
    for (const rule of rules) {
      if (rule.pattern.test(line.description)) {
        charges.push({
          statementLineId: line.id,
          amount: line.amount,
          category: rule.category,
          glAccountId: rule.glAccountId,
          description: line.description,
          confidence: 90,
        });
        totalCharges += line.amount;
        categorySummary.set(
          rule.category,
          (categorySummary.get(rule.category) ?? 0n) + line.amount
        );
        matched = true;
        break;
      }
    }

    if (!matched && looksLikeBankCharge(line.description)) {
      charges.push({
        statementLineId: line.id,
        amount: line.amount,
        category: 'UNKNOWN',
        glAccountId: null,
        description: line.description,
        confidence: 40,
      });
      totalCharges += line.amount;
      categorySummary.set('UNKNOWN', (categorySummary.get('UNKNOWN') ?? 0n) + line.amount);
    }
  }

  return { charges, totalCharges, categorySummary };
}

function looksLikeBankCharge(desc: string): boolean {
  const lower = desc.toLowerCase();
  return /fee|charge|interest|commission|levy/.test(lower);
}
