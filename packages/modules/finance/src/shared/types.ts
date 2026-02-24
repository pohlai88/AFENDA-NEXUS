/**
 * Cross-slice shared types — used by ALL slices.
 *
 * These types were extracted from the GL slice because they are generic
 * building blocks, not GL-specific concepts.  Moving them here eliminates
 * the #1 source of cross-slice imports and satisfies E16 (slice isolation).
 */

// ── Calculator result envelope ───────────────────────────────────────────

/**
 * Standard result wrapper for every pure calculator function.
 * Contains the computed result, a snapshot of the inputs used,
 * and a human-readable explanation string for audit logs.
 */
export interface CalculatorResult<T> {
  readonly result: T;
  readonly inputs: Record<string, unknown>;
  readonly explanation: string;
}

// ── Account classification types ─────────────────────────────────────────

export type AccountType = "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";

export type NormalBalance = "DEBIT" | "CREDIT";

/**
 * Derives the normal balance side from the account type.
 * Assets and Expenses are debit-normal; Liabilities, Equity, and Revenue are credit-normal.
 */
export function normalBalanceFor(type: AccountType): NormalBalance {
  switch (type) {
    case "ASSET":
    case "EXPENSE":
      return "DEBIT";
    case "LIABILITY":
    case "EQUITY":
    case "REVENUE":
      return "CREDIT";
  }
}
