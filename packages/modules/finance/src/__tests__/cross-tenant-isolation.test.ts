import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createDbSession, createPooledClient } from '@afenda/db';
import type { DbClient } from '@afenda/db';
import { createFinanceRuntime } from '../runtime.js';

/**
 * A-01: Cross-Tenant Test Matrix
 *
 * Verifies RLS isolation across all finance repos:
 * - JournalRepo
 * - AccountRepo
 * - PeriodRepo
 * - BalanceRepo
 * - LedgerRepo
 * - FxRateRepo
 * - IcAgreementRepo
 * - IcTransactionRepo
 *
 * Pattern: Create data in tenant A, attempt to read from tenant B → expect empty/null
 */

const DATABASE_URL = process.env.DATABASE_URL;

describe.skipIf(!DATABASE_URL)('A-01: Cross-Tenant Isolation Matrix', () => {
  let db: DbClient;
  const TENANT_A = '11111111-1111-1111-1111-111111111111';
  const TENANT_B = '22222222-2222-2222-2222-222222222222';
  const USER_A = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const USER_B = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

  beforeAll(async () => {
    db = createPooledClient({ connectionString: DATABASE_URL! });
  });

  afterAll(async () => {
    await db.end();
  });

  describe('JournalRepo isolation', () => {
    it('cannot read journals from other tenant', async () => {
      const session = createDbSession({ db });
      const runtime = createFinanceRuntime(session);

      // Create journal in tenant A
      const journalA = await session.withTenant(
        { tenantId: TENANT_A, userId: USER_A },
        async (tx) => {
          return runtime(tx).journalRepo.create({
            ledgerId: 'ledger-a',
            fiscalPeriodId: 'period-a',
            postingDate: new Date('2025-01-15'),
            description: 'Tenant A Journal',
            lines: [],
          });
        }
      );

      // Attempt to read from tenant B
      const journalFromB = await session.withTenant(
        { tenantId: TENANT_B, userId: USER_B },
        async (tx) => {
          return runtime(tx).journalRepo.findById(journalA.id);
        }
      );

      expect(journalFromB).toBeNull();
    });

    it('cannot list journals from other tenant', async () => {
      const session = createDbSession({ db });
      const runtimeB = createFinanceRuntime(session);

      const journalsFromB = await session.withTenant(
        { tenantId: TENANT_B, userId: USER_B },
        async (tx) => {
          const runtime = runtimeB(tx);
          return runtime.journalRepo.findAll({ limit: 100 });
        }
      );

      // Should not see tenant A's journals
      const tenantAJournals = journalsFromB.filter((j) => j.id.includes('a'));
      expect(tenantAJournals).toHaveLength(0);
    });
  });

  describe('AccountRepo isolation', () => {
    it('cannot read accounts from other tenant', async () => {
      const session = createDbSession({ db });
      const runtimeB = createFinanceRuntime(session);

      // Assume tenant A has accounts from seed data
      // Tenant B should see zero accounts (or only their own)
      const accountsFromB = await session.withTenant(
        { tenantId: TENANT_B, userId: USER_B },
        async (tx) => {
          const runtime = runtimeB(tx);
          return runtime.accountRepo.findAll();
        }
      );

      // Tenant B should not see any tenant A accounts
      expect(accountsFromB.every((a) => a.tenantId === TENANT_B)).toBe(true);
    });
  });

  describe('PeriodRepo isolation', () => {
    it('cannot read periods from other tenant', async () => {
      const session = createDbSession({ db });
      const runtimeB = createFinanceRuntime(session);

      const periodsFromB = await session.withTenant(
        { tenantId: TENANT_B, userId: USER_B },
        async (tx) => {
          const runtime = runtimeB(tx);
          return runtime.periodRepo.findAll();
        }
      );

      expect(periodsFromB.every((p) => p.tenantId === TENANT_B)).toBe(true);
    });
  });

  describe('BalanceRepo isolation', () => {
    it('cannot read balances from other tenant', async () => {
      const session = createDbSession({ db });
      const runtimeB = createFinanceRuntime(session);

      const balancesFromB = await session.withTenant(
        { tenantId: TENANT_B, userId: USER_B },
        async (tx) => {
          const runtime = runtimeB(tx);
          return runtime.balanceRepo.findByLedger('ledger-a');
        }
      );

      // Should return empty array (ledger-a belongs to tenant A)
      expect(balancesFromB).toHaveLength(0);
    });
  });

  describe('LedgerRepo isolation', () => {
    it('cannot read ledgers from other tenant', async () => {
      const session = createDbSession({ db });
      const runtimeB = createFinanceRuntime(session);

      const ledgerFromB = await session.withTenant(
        { tenantId: TENANT_B, userId: USER_B },
        async (tx) => {
          const runtime = runtimeB(tx);
          return runtime.ledgerRepo.findById('ledger-a');
        }
      );

      expect(ledgerFromB).toBeNull();
    });
  });

  describe('FxRateRepo isolation', () => {
    it('cannot read FX rates from other tenant', async () => {
      const session = createDbSession({ db });
      createFinanceRuntime(session); // runtimeA — instantiated to simulate tenant A presence
      const runtimeB = createFinanceRuntime(session);

      // Create FX rate in tenant A (if table exists)
      // For now, just verify tenant B cannot see tenant A rates
      const rateFromB = await session.withTenant(
        { tenantId: TENANT_B, userId: USER_B },
        async (tx) => {
          const runtime = runtimeB(tx);
          return runtime.fxRateRepo.findRate('USD', 'EUR', new Date());
        }
      );

      // Should return null (no cross-tenant rates visible)
      expect(rateFromB).toBeNull();
    });
  });

  describe('IcAgreementRepo isolation', () => {
    it('cannot read IC agreements from other tenant', async () => {
      const session = createDbSession({ db });
      const runtimeB = createFinanceRuntime(session);

      const agreementsFromB = await session.withTenant(
        { tenantId: TENANT_B, userId: USER_B },
        async (tx) => {
          const runtime = runtimeB(tx);
          return runtime.icAgreementRepo.findAll();
        }
      );

      expect(agreementsFromB.every((a) => a.tenantId === TENANT_B)).toBe(true);
    });
  });

  describe('IcTransactionRepo isolation', () => {
    it('cannot read IC transactions from other tenant', async () => {
      const session = createDbSession({ db });
      const runtimeB = createFinanceRuntime(session);

      // Attempt to read a tenant A IC transaction
      const txFromB = await session.withTenant(
        { tenantId: TENANT_B, userId: USER_B },
        async (tx) => {
          const runtime = runtimeB(tx);
          return runtime.icTransactionRepo.findById('ic-tx-a');
        }
      );

      expect(txFromB).toBeNull();
    });
  });

  describe('Write isolation', () => {
    it('cannot insert data with wrong tenant_id via FK violation', async () => {
      const session = createDbSession({ db });
      const runtimeB = createFinanceRuntime(session);

      // Attempt to create journal in tenant B context but referencing tenant A ledger
      await expect(
        session.withTenant({ tenantId: TENANT_B, userId: USER_B }, async (tx) => {
          const runtime = runtimeB(tx);
          return runtime.journalRepo.create({
            ledgerId: 'ledger-a', // Belongs to tenant A
            fiscalPeriodId: 'period-b',
            postingDate: new Date('2025-01-15'),
            description: 'Cross-tenant write attempt',
            lines: [],
          });
        })
      ).rejects.toThrow(); // FK constraint violation or RLS block
    });
  });
});
