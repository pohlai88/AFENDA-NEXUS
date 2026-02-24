/**
 * @see IC-01 — Intercompany matching and elimination
 * @see CONSOL-01 — Group consolidation with IC elimination
 *
 * Pure calculator — no I/O, no side effects.
 * Computes elimination journal entries from intercompany balances.
 * Each IC balance produces a paired debit+credit elimination entry.
 */
import type { CalculatorResult } from "../../../shared/types.js";

export interface IntercompanyBalance {
  readonly fromCompanyId: string;
  readonly toCompanyId: string;
  readonly accountId: string;
  readonly amountMinor: bigint;
  readonly currency: string;
}

export interface EliminationEntry {
  readonly accountId: string;
  readonly side: "debit" | "credit";
  readonly amountMinor: bigint;
  readonly currency: string;
  readonly memo: string;
}

/**
 * Computes IC elimination entries from intercompany balances.
 * Each balance produces a paired debit+credit entry that nets to zero.
 */
export function computeEliminations(
  balances: readonly IntercompanyBalance[],
): CalculatorResult<EliminationEntry[]> {
  if (balances.length === 0) {
    return {
      result: [],
      inputs: { balanceCount: 0 },
      explanation: "No IC balances to eliminate",
    };
  }

  const entries: EliminationEntry[] = [];

  for (const bal of balances) {
    if (bal.amountMinor < 0n) {
      throw new Error(`amountMinor must be non-negative, got ${bal.amountMinor}`);
    }
    if (bal.fromCompanyId === bal.toCompanyId) {
      throw new Error(
        `Intercompany balance cannot be within same company: ${bal.fromCompanyId}`,
      );
    }

    entries.push(
      {
        accountId: bal.accountId,
        side: "debit",
        amountMinor: bal.amountMinor,
        currency: bal.currency,
        memo: `IC elimination: ${bal.fromCompanyId} → ${bal.toCompanyId}`,
      },
      {
        accountId: bal.accountId,
        side: "credit",
        amountMinor: bal.amountMinor,
        currency: bal.currency,
        memo: `IC elimination: ${bal.toCompanyId} → ${bal.fromCompanyId}`,
      },
    );
  }

  return {
    result: entries,
    inputs: { balanceCount: balances.length },
    explanation: `IC elimination: ${entries.length / 2} pairs eliminated from ${balances.length} balances`,
  };
}
