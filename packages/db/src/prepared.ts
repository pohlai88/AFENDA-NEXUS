import { and, eq, sql } from 'drizzle-orm';
import type { DbClient } from './client.js';
import {
  glJournals,
  glBalances,
  accounts,
  currencies,
  ledgers,
  icAgreements,
} from './schema/erp.js';
import { companies } from './schema/platform.js';

/**
 * Hot-path prepared statements — usable on BOTH pooled and direct connections.
 *
 * Neon PgBouncer supports protocol-level prepared statements
 * (max_prepared_statements=1000). postgres.js uses protocol-level prep
 * by default, so .prepare() is safe on pooled connections.
 *
 * All queries include tenant_id in WHERE as defense-in-depth alongside RLS.
 * This ensures correct index usage (all composite indexes are tenant-prefixed)
 * and provides an extra safety net if RLS is accidentally bypassed.
 */

export function createPreparedQueries(db: DbClient) {
  // ─── Journal Queries ─────────────────────────────────────────────────

  const findJournalById = db
    .select()
    .from(glJournals)
    .where(
      and(
        eq(glJournals.tenantId, sql.placeholder('tenantId')),
        eq(glJournals.id, sql.placeholder('id'))
      )
    )
    .prepare('find_journal_by_id');

  const findJournalsByPeriod = db
    .select()
    .from(glJournals)
    .where(
      and(
        eq(glJournals.tenantId, sql.placeholder('tenantId')),
        eq(glJournals.fiscalPeriodId, sql.placeholder('periodId')),
        eq(glJournals.status, sql.placeholder('status'))
      )
    )
    .prepare('find_journals_by_period');

  // ─── Trial Balance ───────────────────────────────────────────────────

  const getTrialBalance = db
    .select({
      accountId: glBalances.accountId,
      accountCode: accounts.code,
      accountName: accounts.name,
      accountType: accounts.accountType,
      debitBalance: glBalances.debitBalance,
      creditBalance: glBalances.creditBalance,
    })
    .from(glBalances)
    .innerJoin(accounts, eq(glBalances.accountId, accounts.id))
    .where(
      and(
        eq(glBalances.tenantId, sql.placeholder('tenantId')),
        eq(glBalances.ledgerId, sql.placeholder('ledgerId')),
        eq(glBalances.fiscalYear, sql.placeholder('year'))
      )
    )
    .prepare('get_trial_balance');

  // ─── Reference Data Queries (multi-company, multi-national) ──────────

  const findAccountsByType = db
    .select()
    .from(accounts)
    .where(
      and(
        eq(accounts.tenantId, sql.placeholder('tenantId')),
        eq(accounts.accountType, sql.placeholder('accountType')),
        eq(accounts.isActive, true)
      )
    )
    .prepare('find_accounts_by_type');

  const listActiveCurrencies = db
    .select()
    .from(currencies)
    .where(and(eq(currencies.tenantId, sql.placeholder('tenantId')), eq(currencies.isActive, true)))
    .prepare('list_active_currencies');

  const listCompanyLedgers = db
    .select({
      ledgerId: ledgers.id,
      ledgerName: ledgers.name,
      companyId: companies.id,
      companyName: companies.name,
      companyCode: companies.code,
      currencyId: ledgers.currencyId,
      isDefault: ledgers.isDefault,
    })
    .from(ledgers)
    .innerJoin(companies, eq(ledgers.companyId, companies.id))
    .where(and(eq(ledgers.tenantId, sql.placeholder('tenantId')), eq(ledgers.isActive, true)))
    .prepare('list_company_ledgers');

  // ─── Inter-Company (multi-company within tenant) ───────────────────────────

  const findIcAgreementByPair = db
    .select()
    .from(icAgreements)
    .where(
      and(
        eq(icAgreements.tenantId, sql.placeholder('tenantId')),
        eq(icAgreements.sellerCompanyId, sql.placeholder('sellerCompanyId')),
        eq(icAgreements.buyerCompanyId, sql.placeholder('buyerCompanyId')),
        eq(icAgreements.isActive, true)
      )
    )
    .prepare('find_ic_agreement_by_pair');

  return {
    findJournalById,
    findJournalsByPeriod,
    getTrialBalance,
    findAccountsByType,
    listActiveCurrencies,
    listCompanyLedgers,
    findIcAgreementByPair,
  } as const;
}
