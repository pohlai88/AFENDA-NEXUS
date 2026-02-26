/**
 * GAP-11: Consolidation orchestration service.
 *
 * Orchestrates multi-entity financial consolidation by:
 * 1. Loading trial balances for each subsidiary
 * 2. Translating foreign-currency subsidiaries to group currency
 * 3. Computing IC elimination entries
 * 4. Producing a consolidated trial balance
 *
 * Pure orchestration — delegates to domain calculators for all computations.
 */
import type { Result } from '@afenda/core';
import { ok, err, AppError } from '@afenda/core';
import type { TrialBalance } from '../../../shared/ports/gl-read-ports.js';
import { translateTrialBalance } from '../../../shared/ports/consolidation-hooks.js';
import type { EliminationEntry } from '../../../shared/ports/consolidation-hooks.js';
import { computeEliminations } from '../../../shared/ports/consolidation-hooks.js';
import type { IGlBalanceRepo } from '../../../shared/ports/gl-read-ports.js';
import type { IFxRateRepo } from '../../../shared/ports/fx-port.js';
import type { ILedgerRepo } from '../../../shared/ports/gl-read-ports.js';
import type { FinanceContext } from '../../../shared/finance-context.js';
import type { IntercompanyBalance } from '../../../shared/ports/consolidation-hooks.js';
import type { TranslatedEntry } from '../../../shared/ports/consolidation-hooks.js';

export interface ConsolidationInput {
  readonly tenantId: string;
  readonly groupLedgerId: string;
  readonly subsidiaryLedgerIds: readonly string[];
  readonly fiscalYear: string;
  readonly fiscalPeriod?: number;
  readonly asOfDate: Date;
  readonly icBalances: readonly IntercompanyBalance[];
}

export interface ConsolidationResult {
  readonly subsidiaryTrialBalances: ReadonlyMap<string, TrialBalance>;
  readonly translatedEntries: ReadonlyMap<string, readonly TranslatedEntry[]>;
  readonly eliminationEntries: readonly EliminationEntry[];
  readonly consolidatedRows: readonly { accountId: string; debit: bigint; credit: bigint }[];
}

export async function consolidate(
  input: ConsolidationInput,
  deps: {
    balanceRepo: IGlBalanceRepo;
    fxRateRepo: IFxRateRepo;
    ledgerRepo: ILedgerRepo;
  },
  _ctx?: FinanceContext
): Promise<Result<ConsolidationResult>> {
  // 1. Load group ledger to determine group base currency
  const groupLedgerResult = await deps.ledgerRepo.findById(input.groupLedgerId);
  if (!groupLedgerResult.ok) {
    return err(new AppError('NOT_FOUND', `Group ledger ${input.groupLedgerId} not found`));
  }
  const groupCurrency = groupLedgerResult.value.baseCurrency;

  // 2. Load trial balances for each subsidiary
  const subsidiaryTrialBalances = new Map<string, TrialBalance>();
  for (const ledgerId of input.subsidiaryLedgerIds) {
    const tbResult = await deps.balanceRepo.getTrialBalance(
      ledgerId,
      input.fiscalYear,
      input.fiscalPeriod
    );
    if (!tbResult.ok) {
      return err(new AppError('NOT_FOUND', `Trial balance not found for ledger ${ledgerId}`));
    }
    subsidiaryTrialBalances.set(ledgerId, tbResult.value);
  }

  // 3. Translate foreign-currency subsidiaries to group currency
  const translatedEntries = new Map<string, readonly TranslatedEntry[]>();
  for (const [ledgerId, tb] of subsidiaryTrialBalances) {
    const ledgerResult = await deps.ledgerRepo.findById(ledgerId);
    if (!ledgerResult.ok) continue;

    const subCurrency = ledgerResult.value.baseCurrency;

    // Convert TrialBalanceRow → TrialBalanceEntry for the translator
    const entries = tb.rows.map((r) => ({
      accountId: r.accountCode,
      accountType: r.accountType,
      amountMinor: r.debitTotal.amount - r.creditTotal.amount,
      sourceCurrency: subCurrency,
    }));

    if (subCurrency === groupCurrency) {
      // Same currency — identity translation
      const identity = entries.map((e) => ({
        accountId: e.accountId,
        originalMinor: e.amountMinor,
        translatedMinor: e.amountMinor,
        sourceCurrency: subCurrency,
        targetCurrency: groupCurrency,
        rateUsed: 1,
        rateType: 'none' as const,
      }));
      translatedEntries.set(ledgerId, identity);
      continue;
    }

    // Look up FX rate for translation
    const rateResult = await deps.fxRateRepo.findRate(subCurrency, groupCurrency, input.asOfDate);
    if (!rateResult.ok) {
      return err(
        new AppError(
          'VALIDATION',
          `No FX rate for ${subCurrency}/${groupCurrency} as of ${input.asOfDate.toISOString()}`
        )
      );
    }

    const translated = translateTrialBalance(
      entries,
      {
        closingRate: rateResult.value.rate,
        averageRate: rateResult.value.rate,
        historicalRate: rateResult.value.rate,
      },
      groupCurrency
    );
    translatedEntries.set(ledgerId, translated.result.entries);
  }

  // 4. Compute IC eliminations
  const elimResult = computeEliminations(input.icBalances);

  // 5. Aggregate into consolidated trial balance
  const aggregated = new Map<string, { debit: bigint; credit: bigint }>();

  const addRow = (accountId: string, debit: bigint, credit: bigint) => {
    const existing = aggregated.get(accountId) ?? { debit: 0n, credit: 0n };
    aggregated.set(accountId, {
      debit: existing.debit + debit,
      credit: existing.credit + credit,
    });
  };

  // Add all translated subsidiary entries
  for (const entries of translatedEntries.values()) {
    for (const entry of entries) {
      const net = entry.translatedMinor;
      if (net >= 0n) {
        addRow(entry.accountId, net, 0n);
      } else {
        addRow(entry.accountId, 0n, -net);
      }
    }
  }

  // Apply elimination entries
  for (const elim of elimResult.result) {
    addRow(
      elim.accountId,
      elim.side === 'debit' ? elim.amountMinor : 0n,
      elim.side === 'credit' ? elim.amountMinor : 0n
    );
  }

  const consolidatedRows = Array.from(aggregated.entries()).map(([accountId, bal]) => ({
    accountId,
    debit: bal.debit,
    credit: bal.credit,
  }));

  return ok({
    subsidiaryTrialBalances,
    translatedEntries,
    eliminationEntries: elimResult.result,
    consolidatedRows,
  });
}
