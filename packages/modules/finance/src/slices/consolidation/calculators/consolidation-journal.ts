/**
 * CO-06: Consolidation journal auto-generation calculator.
 * Pure calculator — produces elimination + NCI + goodwill journal lines
 * from consolidation computation results.
 */
import type { CalculatorResult } from "../../../shared/types.js";

export type ConsolJournalLineType =
  | "IC_ELIMINATION"
  | "NCI_ALLOCATION"
  | "GOODWILL_RECOGNITION"
  | "DIVIDEND_ELIMINATION"
  | "FX_TRANSLATION";

export interface ConsolJournalLine {
  readonly lineType: ConsolJournalLineType;
  readonly debitAccountId: string;
  readonly creditAccountId: string;
  readonly amountMinor: bigint;
  readonly currencyCode: string;
  readonly memo: string;
  readonly entityId: string;
}

export interface ConsolJournalInput {
  readonly icEliminations: readonly {
    readonly accountId: string;
    readonly amountMinor: bigint;
    readonly currencyCode: string;
    readonly fromEntityId: string;
    readonly toEntityId: string;
  }[];
  readonly nciAllocations: readonly {
    readonly entityId: string;
    readonly nciNetAssets: bigint;
    readonly nciProfitOrLoss: bigint;
    readonly currencyCode: string;
  }[];
  readonly goodwillEntries: readonly {
    readonly entityId: string;
    readonly goodwillAmount: bigint;
    readonly currencyCode: string;
  }[];
  readonly dividendEliminations: readonly {
    readonly entityId: string;
    readonly eliminationAmount: bigint;
    readonly currencyCode: string;
  }[];
  readonly nciEquityAccountId: string;
  readonly nciPnlAccountId: string;
  readonly goodwillAccountId: string;
  readonly investmentAccountId: string;
  readonly dividendIncomeAccountId: string;
  readonly retainedEarningsAccountId: string;
}

/**
 * Generates consolidation journal lines from all consolidation adjustments.
 */
export function generateConsolidationJournal(
  input: ConsolJournalInput,
): CalculatorResult<readonly ConsolJournalLine[]> {
  const lines: ConsolJournalLine[] = [];

  // IC eliminations — debit payable, credit receivable (net to zero)
  for (const ic of input.icEliminations) {
    lines.push({
      lineType: "IC_ELIMINATION",
      debitAccountId: ic.accountId,
      creditAccountId: ic.accountId,
      amountMinor: ic.amountMinor,
      currencyCode: ic.currencyCode,
      memo: `IC elimination: ${ic.fromEntityId} ↔ ${ic.toEntityId}`,
      entityId: ic.fromEntityId,
    });
  }

  // NCI allocations — debit parent equity, credit NCI equity
  for (const nci of input.nciAllocations) {
    if (nci.nciNetAssets !== 0n) {
      lines.push({
        lineType: "NCI_ALLOCATION",
        debitAccountId: input.retainedEarningsAccountId,
        creditAccountId: input.nciEquityAccountId,
        amountMinor: nci.nciNetAssets >= 0n ? nci.nciNetAssets : -nci.nciNetAssets,
        currencyCode: nci.currencyCode,
        memo: `NCI net assets allocation: ${nci.entityId}`,
        entityId: nci.entityId,
      });
    }
    if (nci.nciProfitOrLoss !== 0n) {
      lines.push({
        lineType: "NCI_ALLOCATION",
        debitAccountId: input.nciPnlAccountId,
        creditAccountId: input.nciEquityAccountId,
        amountMinor: nci.nciProfitOrLoss >= 0n ? nci.nciProfitOrLoss : -nci.nciProfitOrLoss,
        currencyCode: nci.currencyCode,
        memo: `NCI P&L allocation: ${nci.entityId}`,
        entityId: nci.entityId,
      });
    }
  }

  // Goodwill recognition — debit goodwill asset, credit investment in subsidiary
  for (const gw of input.goodwillEntries) {
    if (gw.goodwillAmount > 0n) {
      lines.push({
        lineType: "GOODWILL_RECOGNITION",
        debitAccountId: input.goodwillAccountId,
        creditAccountId: input.investmentAccountId,
        amountMinor: gw.goodwillAmount,
        currencyCode: gw.currencyCode,
        memo: `Goodwill on acquisition: ${gw.entityId}`,
        entityId: gw.entityId,
      });
    }
  }

  // Dividend eliminations — debit dividend income, credit retained earnings
  for (const div of input.dividendEliminations) {
    if (div.eliminationAmount > 0n) {
      lines.push({
        lineType: "DIVIDEND_ELIMINATION",
        debitAccountId: input.dividendIncomeAccountId,
        creditAccountId: input.retainedEarningsAccountId,
        amountMinor: div.eliminationAmount,
        currencyCode: div.currencyCode,
        memo: `Dividend elimination: ${div.entityId}`,
        entityId: div.entityId,
      });
    }
  }

  return {
    result: lines,
    inputs: {
      icCount: input.icEliminations.length,
      nciCount: input.nciAllocations.length,
      goodwillCount: input.goodwillEntries.length,
      dividendCount: input.dividendEliminations.length,
    },
    explanation: `Consolidation journal: ${lines.length} lines generated`,
  };
}
