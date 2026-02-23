import { describe, it, expect, vi } from "vitest";
import type { DbClient } from "./client.js";

// ─── createDbSession ──────────────────────────────────────────────────────────

describe("createDbSession", () => {
  // Dynamically import to avoid pulling in full drizzle at module scope
  async function loadSession() {
    return import("./session.js");
  }

  function mockDb() {
    const executeCalls: unknown[] = [];
    const txProxy = {
      execute: vi.fn(async (query: unknown) => {
        executeCalls.push(query);
      }),
    };
    const db = {
      transaction: vi.fn(async (fn: (tx: typeof txProxy) => Promise<unknown>) => fn(txProxy)),
    } as unknown as DbClient;
    return { db, txProxy, executeCalls };
  }

  it("withTenant calls db.transaction", async () => {
    const { createDbSession } = await loadSession();
    const { db } = mockDb();
    const session = createDbSession({ db });

    await session.withTenant({ tenantId: "t1" }, async () => "ok");

    expect(db.transaction).toHaveBeenCalledOnce();
  });

  it("withTenant sets tenant_id via set_config", async () => {
    const { createDbSession } = await loadSession();
    const { db, txProxy } = mockDb();
    const session = createDbSession({ db });

    await session.withTenant({ tenantId: "t1" }, async () => "ok");

    // First execute call should be set_config for tenant_id
    expect(txProxy.execute).toHaveBeenCalled();
    const calls = txProxy.execute.mock.calls;
    expect(calls.length).toBeGreaterThanOrEqual(2); // tenant_id + SET LOCAL ROLE
  });

  it("withTenant sets user_id when provided", async () => {
    const { createDbSession } = await loadSession();
    const { db, txProxy } = mockDb();
    const session = createDbSession({ db });

    await session.withTenant({ tenantId: "t1", userId: "u1" }, async () => "ok");

    // Should have 3 execute calls: tenant_id, user_id, SET LOCAL ROLE
    expect(txProxy.execute).toHaveBeenCalledTimes(3);
  });

  it("withTenant skips user_id when not provided", async () => {
    const { createDbSession } = await loadSession();
    const { db, txProxy } = mockDb();
    const session = createDbSession({ db });

    await session.withTenant({ tenantId: "t1" }, async () => "ok");

    // Should have 2 execute calls: tenant_id, SET LOCAL ROLE (no user_id)
    expect(txProxy.execute).toHaveBeenCalledTimes(2);
  });

  it("withTenant returns the callback result", async () => {
    const { createDbSession } = await loadSession();
    const { db } = mockDb();
    const session = createDbSession({ db });

    const result = await session.withTenant({ tenantId: "t1" }, async () => 42);

    expect(result).toBe(42);
  });

  it("withTenant propagates callback errors", async () => {
    const { createDbSession } = await loadSession();
    const { db } = mockDb();
    const session = createDbSession({ db });

    await expect(
      session.withTenant({ tenantId: "t1" }, async () => {
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");
  });

  it("exposes db on the session", async () => {
    const { createDbSession } = await loadSession();
    const { db } = mockDb();
    const session = createDbSession({ db });

    expect(session.db).toBe(db);
  });

  it("calls logger.info when logger is provided", async () => {
    const { createDbSession } = await loadSession();
    const { db } = mockDb();
    const logger = { info: vi.fn(), error: vi.fn() };
    const session = createDbSession({ db, logger });

    await session.withTenant({ tenantId: "t1" }, async () => "ok");

    expect(logger.info).toHaveBeenCalledWith("Tenant context: t1");
  });
});

// ─── createHealthCheck ────────────────────────────────────────────────────────

describe("createHealthCheck", () => {
  async function loadHealth() {
    return import("./health.js");
  }

  it("returns a function", async () => {
    const { createHealthCheck } = await loadHealth();
    const db = { execute: vi.fn() } as unknown as DbClient;
    const check = createHealthCheck(db);

    expect(typeof check).toBe("function");
  });

  it("calls db.execute with SELECT 1", async () => {
    const { createHealthCheck } = await loadHealth();
    const db = { execute: vi.fn(async () => []) } as unknown as DbClient;
    const check = createHealthCheck(db);

    await check();

    expect(db.execute).toHaveBeenCalledOnce();
  });

  it("propagates db errors", async () => {
    const { createHealthCheck } = await loadHealth();
    const db = {
      execute: vi.fn(async () => {
        throw new Error("connection refused");
      }),
    } as unknown as DbClient;
    const check = createHealthCheck(db);

    await expect(check()).rejects.toThrow("connection refused");
  });
});

// ─── createOutboxDrainer ──────────────────────────────────────────────────────

describe("createOutboxDrainer", () => {
  async function loadDrainer() {
    return import("./outbox-drainer.js");
  }

  it("drain returns mapped rows", async () => {
    const { createOutboxDrainer } = await loadDrainer();
    const now = new Date();
    const rawRows = [
      {
        id: "r1",
        tenant_id: "t1",
        event_type: "JOURNAL_POSTED",
        payload: { journalId: "j1" },
        created_at: now,
        processed_at: null,
      },
    ];
    const db = {
      execute: vi.fn(async () => rawRows),
    } as unknown as DbClient;

    const drainer = createOutboxDrainer(db);
    const rows = await drainer.drain(10);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual({
      id: "r1",
      tenantId: "t1",
      eventType: "JOURNAL_POSTED",
      payload: { journalId: "j1" },
      createdAt: now,
      processedAt: null,
    });
  });

  it("drain returns empty array when no rows", async () => {
    const { createOutboxDrainer } = await loadDrainer();
    const db = {
      execute: vi.fn(async () => []),
    } as unknown as DbClient;

    const drainer = createOutboxDrainer(db);
    const rows = await drainer.drain(50);

    expect(rows).toEqual([]);
  });

  it("drain handles result object with rows property", async () => {
    const { createOutboxDrainer } = await loadDrainer();
    const now = new Date();
    const db = {
      execute: vi.fn(async () => ({
        rows: [
          {
            id: "r2",
            tenant_id: "t2",
            event_type: "GL_BALANCE_CHANGED",
            payload: {},
            created_at: now,
            processed_at: null,
          },
        ],
      })),
    } as unknown as DbClient;

    const drainer = createOutboxDrainer(db);
    const rows = await drainer.drain(5);

    expect(rows).toHaveLength(1);
    expect(rows[0]!.eventType).toBe("GL_BALANCE_CHANGED");
  });

  it("markProcessed calls db.update", async () => {
    const { createOutboxDrainer } = await loadDrainer();
    const whereFn = vi.fn();
    const setFn = vi.fn(() => ({ where: whereFn }));
    const updateFn = vi.fn(() => ({ set: setFn }));
    const db = {
      execute: vi.fn(async () => []),
      update: updateFn,
    } as unknown as DbClient;

    const drainer = createOutboxDrainer(db);
    await drainer.markProcessed("r1");

    expect(updateFn).toHaveBeenCalled();
    expect(setFn).toHaveBeenCalled();
    expect(whereFn).toHaveBeenCalled();
  });
});

// ─── Schema Exports ───────────────────────────────────────────────────────────

describe("schema exports", () => {
  it("exports all expected table objects from schema/index", async () => {
    const schema = await import("./schema/index.js");

    // Platform tables
    expect(schema.tenants).toBeDefined();
    expect(schema.companies).toBeDefined();
    expect(schema.users).toBeDefined();

    // ERP tables
    expect(schema.currencies).toBeDefined();
    expect(schema.accounts).toBeDefined();
    expect(schema.glJournals).toBeDefined();
    expect(schema.glJournalLines).toBeDefined();
    expect(schema.glBalances).toBeDefined();
    expect(schema.ledgers).toBeDefined();
    expect(schema.fiscalYears).toBeDefined();
    expect(schema.fiscalPeriods).toBeDefined();
    expect(schema.icAgreements).toBeDefined();
    expect(schema.icTransactions).toBeDefined();
    expect(schema.icTransactionLegs).toBeDefined();
    expect(schema.fxRates).toBeDefined();
    expect(schema.counterparties).toBeDefined();
    expect(schema.recurringTemplates).toBeDefined();
    expect(schema.budgetEntries).toBeDefined();

    // Audit
    expect(schema.auditLogs).toBeDefined();

    // Outbox
    expect(schema.outbox).toBeDefined();
  });
});

// ─── Public API Exports ───────────────────────────────────────────────────────

describe("public API exports", () => {
  it("exports createPooledClient and createDirectClient", async () => {
    const mod = await import("./index.js");
    expect(typeof mod.createPooledClient).toBe("function");
    expect(typeof mod.createDirectClient).toBe("function");
  });

  it("exports createDbSession", async () => {
    const mod = await import("./index.js");
    expect(typeof mod.createDbSession).toBe("function");
  });

  it("exports createHealthCheck", async () => {
    const mod = await import("./index.js");
    expect(typeof mod.createHealthCheck).toBe("function");
  });

  it("exports createOutboxDrainer", async () => {
    const mod = await import("./index.js");
    expect(typeof mod.createOutboxDrainer).toBe("function");
  });

  it("exports createPreparedQueries", async () => {
    const mod = await import("./index.js");
    expect(typeof mod.createPreparedQueries).toBe("function");
  });

  it("exports migrate", async () => {
    const mod = await import("./index.js");
    expect(typeof mod.migrate).toBe("function");
  });

  it("exports seed", async () => {
    const mod = await import("./index.js");
    expect(typeof mod.seed).toBe("function");
  });
});
