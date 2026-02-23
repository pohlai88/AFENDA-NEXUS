/**
 * @see GL-07 — Account balance = sum of all posted journal lines
 * @see GL-08 — Trial balance at any point-in-time
 *
 * Pure calculator — no I/O, no side effects.
 * Computes trial balance from raw GL balance rows, classifying by account type.
 */
import type { Money } from "@afenda/core";
import { money } from "@afenda/core";
import type { AccountType } from "../entities/account.js";
import type { CalculatorResult } from "./journal-balance.js";

export interface TrialBalanceInput {
  readonly accountCode: string;
  readonly accountName: string;
  readonly accountType: AccountType;
  readonly debitTotal: Money;
  readonly creditTotal: Money;
}

export interface ClassifiedTrialBalanceRow {
  readonly accountCode: string;
  readonly accountName: string;
  readonly accountType: AccountType;
  readonly debitTotal: Money;
  readonly creditTotal: Money;
  readonly netBalance: Money;
}

export interface ClassifiedTrialBalance {
  readonly rows: readonly ClassifiedTrialBalanceRow[];
  readonly totalDebits: Money;
  readonly totalCredits: Money;
  readonly isBalanced: boolean;
  readonly currency: string;
}

export function computeTrialBalance(
  rows: readonly TrialBalanceInput[],
  currency: string,
): CalculatorResult<ClassifiedTrialBalance> {
  let totalDebits = 0n;
  let totalCredits = 0n;

  const classified: ClassifiedTrialBalanceRow[] = rows.map((row) => {
    totalDebits += row.debitTotal.amount;
    totalCredits += row.creditTotal.amount;
    const net = row.debitTotal.amount - row.creditTotal.amount;
    return {
      accountCode: row.accountCode,
      accountName: row.accountName,
      accountType: row.accountType,
      debitTotal: row.debitTotal,
      creditTotal: row.creditTotal,
      netBalance: money(net, currency),
    };
  });

  const isBalanced = totalDebits === totalCredits;

  return {
    result: {
      rows: classified,
      totalDebits: money(totalDebits, currency),
      totalCredits: money(totalCredits, currency),
      isBalanced,
      currency,
    },
    inputs: { rowCount: rows.length, currency },
    explanation: isBalanced
      ? `Trial balance (${currency}): balanced at DR ${totalDebits} = CR ${totalCredits}, ${rows.length} accounts`
      : `Trial balance (${currency}): UNBALANCED — DR ${totalDebits}, CR ${totalCredits}, diff ${totalDebits - totalCredits}`,
  };
}

/**
 * @see GL-01 — Hierarchical CoA with account groups
 *
 * Classifies trial balance rows by account type for financial reporting.
 * Replaces the brittle charAt(0) prefix matching.
 */
export function classifyByAccountType(
  rows: readonly ClassifiedTrialBalanceRow[],
): {
  assets: ClassifiedTrialBalanceRow[];
  liabilities: ClassifiedTrialBalanceRow[];
  equity: ClassifiedTrialBalanceRow[];
  revenue: ClassifiedTrialBalanceRow[];
  expenses: ClassifiedTrialBalanceRow[];
} {
  const assets: ClassifiedTrialBalanceRow[] = [];
  const liabilities: ClassifiedTrialBalanceRow[] = [];
  const equity: ClassifiedTrialBalanceRow[] = [];
  const revenue: ClassifiedTrialBalanceRow[] = [];
  const expenses: ClassifiedTrialBalanceRow[] = [];

  for (const row of rows) {
    switch (row.accountType) {
      case "ASSET":
        assets.push(row);
        break;
      case "LIABILITY":
        liabilities.push(row);
        break;
      case "EQUITY":
        equity.push(row);
        break;
      case "REVENUE":
        revenue.push(row);
        break;
      case "EXPENSE":
        expenses.push(row);
        break;
    }
  }

  return { assets, liabilities, equity, revenue, expenses };
}
