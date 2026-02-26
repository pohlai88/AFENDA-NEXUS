import { companyId, ledgerId, money } from '@afenda/core';
import type { Journal, JournalLine } from '../../slices/gl/entities/journal.js';
import type { GlJournal, GlJournalLine } from '@afenda/db';

export interface JournalRowWithLines extends GlJournal {
  lines: (GlJournalLine & { account?: { code: string } })[];
  ledger?: { companyId: string };
}

export function mapJournalToDomain(row: JournalRowWithLines): Journal {
  return {
    id: row.id,
    companyId: companyId(row.ledger?.companyId ?? ''),
    ledgerId: ledgerId(row.ledgerId),
    fiscalPeriodId: row.fiscalPeriodId,
    description: row.description ?? '',
    date: row.postingDate,
    status: row.status as Journal['status'],
    reversalOfId: row.reversalOfId ?? undefined,
    reversedById: row.reversedById ?? undefined,
    lines: row.lines.map((line) => mapLineToDomain(line)),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function mapLineToDomain(
  row: GlJournalLine & { account?: { code: string } },
  baseCurrency?: string
): JournalLine {
  const currency =
    ((row as Record<string, unknown>).currencyCode as string | null) ?? baseCurrency ?? 'USD';
  const base = baseCurrency ?? currency;
  const bcDebit = (row as Record<string, unknown>).baseCurrencyDebit as bigint | null;
  const bcCredit = (row as Record<string, unknown>).baseCurrencyCredit as bigint | null;
  return {
    accountId: row.accountId,
    accountCode: row.account?.code ?? '',
    debit: money(row.debit, currency),
    credit: money(row.credit, currency),
    description: row.description ?? undefined,
    currencyCode: currency,
    baseCurrencyDebit: bcDebit ? money(bcDebit, base) : undefined,
    baseCurrencyCredit: bcCredit ? money(bcCredit, base) : undefined,
  };
}
