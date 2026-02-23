import { describe, it, expect, beforeAll } from "vitest";
import {
  createPooledClient,
  createDbSession,
  type DbClient,
  type DbSession,
  tenants,
  users,
  accounts,
  fiscalPeriods,
  glJournals,
  ledgers,
} from "@afenda/db";
import { eq, sql } from "drizzle-orm";
import { DrizzleJournalRepo } from "../slices/gl/repos/drizzle-journal-repo.js";
import { DrizzleAccountRepo } from "../slices/gl/repos/drizzle-account-repo.js";
import { DrizzlePeriodRepo } from "../slices/gl/repos/drizzle-period-repo.js";
import { DrizzleIdempotencyStore } from "../shared/repos/drizzle-idempotency.js";

/**
 * Integration tests for Drizzle repositories against a real Neon DB.
 * Requires DATABASE_URL environment variable and seed data.
 *
 * Run with: DATABASE_URL=... pnpm --filter @afenda/finance test -- integration
 */

const SKIP = !process.env.DATABASE_URL;

// ─── Shared test state — discovered from seed data ──────────────────────────

let db: DbClient;
let session: DbSession;
let TENANT_ID: string;
let USER_ID: string;
let ACCOUNT_CASH_ID: string;
let ACCOUNT_REVENUE_ID: string;
let PERIOD_P01_ID: string;
let PERIOD_P02_ID: string;
let LEDGER_ID: string;
let SEED_JOURNAL_ID: string;

// ─── Setup: discover seed IDs ───────────────────────────────────────────────

beforeAll(async () => {
  if (SKIP) return;

  db = createPooledClient({ connectionString: process.env.DATABASE_URL! });
  session = createDbSession({ db });

  // Discover seed data IDs (seed uses DB-generated UUIDs)
  const [tenant] = await db.select().from(tenants).limit(1);
  if (!tenant) throw new Error("No tenant found — run `pnpm --filter @afenda/db db:seed` first");
  TENANT_ID = tenant.id;

  // Find user
  const userRow = await db.select().from(users).where(eq(users.tenantId, TENANT_ID)).limit(1);
  USER_ID = userRow[0]?.id ?? "system";

  // Find accounts
  const acctRows = await db.select().from(accounts).where(eq(accounts.tenantId, TENANT_ID));
  const cashAcct = acctRows.find((a) => a.code === "1000");
  const revAcct = acctRows.find((a) => a.code === "4000");
  if (!cashAcct || !revAcct) throw new Error("Seed accounts not found");
  ACCOUNT_CASH_ID = cashAcct.id;
  ACCOUNT_REVENUE_ID = revAcct.id;

  // Find periods
  const periodRows = await db.select().from(fiscalPeriods).where(eq(fiscalPeriods.tenantId, TENANT_ID));
  const p01 = periodRows.find((p) => p.name === "P01");
  const p02 = periodRows.find((p) => p.name === "P02");
  if (!p01 || !p02) throw new Error("Seed periods not found");
  PERIOD_P01_ID = p01.id;
  PERIOD_P02_ID = p02.id;

  // Find ledger
  const [ledger] = await db.select().from(ledgers).where(eq(ledgers.tenantId, TENANT_ID)).limit(1);
  if (!ledger) throw new Error("Seed ledger not found");
  LEDGER_ID = ledger.id;

  // Find seed journal
  const [journal] = await db.select().from(glJournals).where(eq(glJournals.tenantId, TENANT_ID)).limit(1);
  if (!journal) throw new Error("Seed journal not found");
  SEED_JOURNAL_ID = journal.id;
});

// ─── DrizzleJournalRepo ─────────────────────────────────────────────────────

describe.skipIf(SKIP)("DrizzleJournalRepo (integration)", () => {
  it("creates a journal and reads it back", async () => {
    const result = await session.withTenant({ tenantId: TENANT_ID, userId: USER_ID }, async (tx) => {
      const repo = new DrizzleJournalRepo(tx);
      const created = await repo.create({
        tenantId: TENANT_ID,
        ledgerId: LEDGER_ID,
        fiscalPeriodId: PERIOD_P01_ID,
        journalNumber: `INT-TEST-${Date.now()}`,
        description: "Integration test journal",
        postingDate: new Date("2025-01-15"),
        lines: [
          { accountId: ACCOUNT_CASH_ID, debit: 50000n, credit: 0n },
          { accountId: ACCOUNT_REVENUE_ID, debit: 0n, credit: 50000n },
        ],
      });
      expect(created.ok).toBe(true);
      if (!created.ok) return;

      const found = await repo.findById(created.value.id);
      expect(found.ok).toBe(true);
      if (found.ok) {
        expect(found.value.id).toBe(created.value.id);
        expect(found.value.status).toBe("DRAFT");
        expect(found.value.lines.length).toBe(2);
        expect(found.value.description).toBe("Integration test journal");
      }
    });
    void result;
  });

  it("findByPeriod returns journals scoped to period", async () => {
    await session.withTenant({ tenantId: TENANT_ID, userId: USER_ID }, async (tx) => {
      const repo = new DrizzleJournalRepo(tx);
      const result = await repo.findByPeriod(PERIOD_P01_ID);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.data.length).toBeGreaterThanOrEqual(1);
        for (const j of result.value.data) {
          expect(j.fiscalPeriodId).toBe(PERIOD_P01_ID);
        }
      }
    });
  });

  it("updateStatus transitions DRAFT → POSTED", async () => {
    await session.withTenant({ tenantId: TENANT_ID, userId: USER_ID }, async (tx) => {
      const repo = new DrizzleJournalRepo(tx);
      // Create a fresh journal to avoid mutating seed data
      const created = await repo.create({
        tenantId: TENANT_ID,
        ledgerId: LEDGER_ID,
        fiscalPeriodId: PERIOD_P01_ID,
        journalNumber: `INT-STATUS-${Date.now()}`,
        description: "Status transition test",
        postingDate: new Date("2025-01-15"),
        lines: [
          { accountId: ACCOUNT_CASH_ID, debit: 10000n, credit: 0n },
          { accountId: ACCOUNT_REVENUE_ID, debit: 0n, credit: 10000n },
        ],
      });
      expect(created.ok).toBe(true);
      if (!created.ok) return;

      const saved = await repo.save({ ...created.value, status: "POSTED" });
      expect(saved.ok).toBe(true);
      if (saved.ok) {
        expect(saved.value.status).toBe("POSTED");
      }
    });
  });

  it("findByPeriod with status filter returns correct subset", async () => {
    await session.withTenant({ tenantId: TENANT_ID, userId: USER_ID }, async (tx) => {
      const repo = new DrizzleJournalRepo(tx);
      const result = await repo.findByPeriod(PERIOD_P01_ID, "DRAFT");
      expect(result.ok).toBe(true);
      if (result.ok) {
        for (const j of result.value.data) {
          expect(j.status).toBe("DRAFT");
        }
      }
    });
  });
});

// ─── DrizzleAccountRepo ─────────────────────────────────────────────────────

describe.skipIf(SKIP)("DrizzleAccountRepo (integration)", () => {
  it("findAll returns paginated accounts", async () => {
    await session.withTenant({ tenantId: TENANT_ID, userId: USER_ID }, async (tx) => {
      const repo = new DrizzleAccountRepo(tx);
      const result = await repo.findAll({ page: 1, limit: 5 });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.data.length).toBeGreaterThanOrEqual(1);
        expect(result.value.data.length).toBeLessThanOrEqual(5);
        expect(result.value.total).toBeGreaterThanOrEqual(9); // seed creates 9 accounts
        expect(result.value.page).toBe(1);
      }
    });
  });

  it("findById returns correct account", async () => {
    await session.withTenant({ tenantId: TENANT_ID, userId: USER_ID }, async (tx) => {
      const repo = new DrizzleAccountRepo(tx);
      const result = await repo.findById(ACCOUNT_CASH_ID);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.id).toBe(ACCOUNT_CASH_ID);
        expect(result.value.code).toBe("1000");
        expect(result.value.name).toBe("Cash & Bank");
        expect(result.value.type).toBe("ASSET");
      }
    });
  });

  it("findByCode resolves account code to account", async () => {
    await session.withTenant({ tenantId: TENANT_ID, userId: USER_ID }, async (tx) => {
      const repo = new DrizzleAccountRepo(tx);
      const result = await repo.findByCode("", "4000");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.id).toBe(ACCOUNT_REVENUE_ID);
        expect(result.value.code).toBe("4000");
        expect(result.value.name).toBe("Revenue");
      }
    });
  });
});

// ─── DrizzlePeriodRepo ──────────────────────────────────────────────────────

describe.skipIf(SKIP)("DrizzlePeriodRepo (integration)", () => {
  // Reset P02 to OPEN before each test — previous runs may have left it CLOSED/LOCKED
  beforeEach(async () => {
    await db.execute(
      sql`UPDATE erp.fiscal_period SET status = 'OPEN' WHERE id = ${PERIOD_P02_ID}`,
    );
  });

  it("findOpenByDate returns the correct open period", async () => {
    await session.withTenant({ tenantId: TENANT_ID, userId: USER_ID }, async (tx) => {
      const repo = new DrizzlePeriodRepo(tx);
      const result = await repo.findOpenByDate("", new Date("2025-01-15"));
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.name).toBe("P01");
        expect(result.value.status).toBe("OPEN");
      }
    });
  });

  it("close transitions OPEN → CLOSED", async () => {
    await session.withTenant({ tenantId: TENANT_ID, userId: USER_ID }, async (tx) => {
      const repo = new DrizzlePeriodRepo(tx);
      // Use P02 to avoid affecting P01 which has journals
      const result = await repo.close(PERIOD_P02_ID);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.status).toBe("CLOSED");
      }
    });
  });

  it("reopen transitions CLOSED → OPEN", async () => {
    await session.withTenant({ tenantId: TENANT_ID, userId: USER_ID }, async (tx) => {
      const repo = new DrizzlePeriodRepo(tx);
      // First close, then reopen
      await repo.close(PERIOD_P02_ID);
      const result = await repo.reopen(PERIOD_P02_ID);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.status).toBe("OPEN");
      }
    });
  });

  it("lock transitions CLOSED → LOCKED", async () => {
    await session.withTenant({ tenantId: TENANT_ID, userId: USER_ID }, async (tx) => {
      const repo = new DrizzlePeriodRepo(tx);
      // Close first, then lock
      await repo.close(PERIOD_P02_ID);
      const result = await repo.lock(PERIOD_P02_ID);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.status).toBe("LOCKED");
      }
    });
  });

  it("lock rejects OPEN periods", async () => {
    await session.withTenant({ tenantId: TENANT_ID, userId: USER_ID }, async (tx) => {
      const repo = new DrizzlePeriodRepo(tx);
      // P01 is OPEN — lock should fail
      const result = await repo.lock(PERIOD_P01_ID);
      expect(result.ok).toBe(false);
    });
  });
});

// ─── DrizzleIdempotencyStore ────────────────────────────────────────────────

describe.skipIf(SKIP)("DrizzleIdempotencyStore (integration)", () => {
  it("first claimOrGet returns claimed: true", async () => {
    await session.withTenant({ tenantId: TENANT_ID, userId: USER_ID }, async (tx) => {
      const store = new DrizzleIdempotencyStore(tx);
      const key = `test-${Date.now()}-${Math.random()}`;
      const result = await store.claimOrGet({
        tenantId: TENANT_ID,
        key,
        commandType: "TEST_COMMAND",
      });
      expect(result.claimed).toBe(true);
    });
  });

  it("second claimOrGet with same key returns claimed: false", async () => {
    await session.withTenant({ tenantId: TENANT_ID, userId: USER_ID }, async (tx) => {
      const store = new DrizzleIdempotencyStore(tx);
      const key = `test-dup-${Date.now()}-${Math.random()}`;
      const first = await store.claimOrGet({
        tenantId: TENANT_ID,
        key,
        commandType: "TEST_COMMAND",
      });
      expect(first.claimed).toBe(true);

      const second = await store.claimOrGet({
        tenantId: TENANT_ID,
        key,
        commandType: "TEST_COMMAND",
      });
      expect(second.claimed).toBe(false);
    });
  });

  it("concurrent claimOrGet — only one wins", async () => {
    const key = `test-race-${Date.now()}-${Math.random()}`;
    const results = await Promise.all([
      session.withTenant({ tenantId: TENANT_ID, userId: USER_ID }, async (tx) => {
        const store = new DrizzleIdempotencyStore(tx);
        return store.claimOrGet({ tenantId: TENANT_ID, key, commandType: "RACE_TEST" });
      }),
      session.withTenant({ tenantId: TENANT_ID, userId: USER_ID }, async (tx) => {
        const store = new DrizzleIdempotencyStore(tx);
        return store.claimOrGet({ tenantId: TENANT_ID, key, commandType: "RACE_TEST" });
      }),
    ]);
    const claimed = results.filter((r) => r.claimed);
    expect(claimed.length).toBe(1);
  });
});

// ─── Multi-tenant isolation ─────────────────────────────────────────────────

describe.skipIf(SKIP)("Multi-tenant isolation", () => {
  const FAKE_TENANT = "00000000-0000-4000-8000-ffffffffffff";

  it("tenant A cannot read tenant B journals", async () => {
    await session.withTenant({ tenantId: FAKE_TENANT, userId: "fake-user" }, async (tx) => {
      const repo = new DrizzleJournalRepo(tx);
      const result = await repo.findById(SEED_JOURNAL_ID);
      // RLS should prevent reading — either NOT_FOUND or empty
      expect(result.ok).toBe(false);
    });
  });

  it("tenant A cannot read tenant B accounts", async () => {
    await session.withTenant({ tenantId: FAKE_TENANT, userId: "fake-user" }, async (tx) => {
      const repo = new DrizzleAccountRepo(tx);
      const result = await repo.findById(ACCOUNT_CASH_ID);
      expect(result.ok).toBe(false);
    });
  });

  it("tenant A cannot read tenant B periods", async () => {
    await session.withTenant({ tenantId: FAKE_TENANT, userId: "fake-user" }, async (tx) => {
      const repo = new DrizzlePeriodRepo(tx);
      const result = await repo.findById(PERIOD_P01_ID);
      expect(result.ok).toBe(false);
    });
  });

  it("RLS prevents cross-tenant writes", async () => {
    // Cross-tenant writes are blocked by either RLS or FK constraints.
    // The exact mechanism depends on enforcement order — both are valid.
    let blocked = false;
    try {
      await session.withTenant({ tenantId: FAKE_TENANT, userId: "fake-user" }, async (tx) => {
        const repo = new DrizzleJournalRepo(tx);
        const result = await repo.create({
          tenantId: FAKE_TENANT,
          ledgerId: LEDGER_ID,
          fiscalPeriodId: PERIOD_P01_ID,
          journalNumber: `CROSS-TENANT-${Date.now()}`,
          description: "Should fail — cross-tenant",
          postingDate: new Date("2025-01-15"),
          lines: [
            { accountId: ACCOUNT_CASH_ID, debit: 1000n, credit: 0n },
            { accountId: ACCOUNT_REVENUE_ID, debit: 0n, credit: 1000n },
          ],
        });
        if (!result.ok) blocked = true;
      });
    } catch {
      // FK constraint or RLS violation throws — this is expected
      blocked = true;
    }
    expect(blocked).toBe(true);
  });
});
