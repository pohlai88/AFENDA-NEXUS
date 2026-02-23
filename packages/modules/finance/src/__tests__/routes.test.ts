import { describe, it, expect, beforeAll, afterAll } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import type { FinanceRuntime, FinanceDeps } from "../app/ports/finance-runtime.js";
import { registerJournalRoutes } from "../infra/routes/journal-routes.js";
import { registerAccountRoutes } from "../infra/routes/account-routes.js";
import { registerPeriodRoutes } from "../infra/routes/period-routes.js";
import { registerBalanceRoutes } from "../infra/routes/balance-routes.js";
import { registerIcRoutes } from "../infra/routes/ic-routes.js";
import { registerIcAgreementRoutes } from "../infra/routes/ic-agreement-routes.js";
import { registerLedgerRoutes } from "../infra/routes/ledger-routes.js";
import { registerFxRateRoutes } from "../infra/routes/fx-rate-routes.js";
import { registerRecurringTemplateRoutes } from "../infra/routes/recurring-template-routes.js";
import { registerBudgetRoutes } from "../infra/routes/budget-routes.js";
import { registerReportRoutes } from "../infra/routes/report-routes.js";
import { registerErrorHandler } from "../infra/routes/fastify-plugins.js";
import { registerBigIntSerializer } from "../infra/routes/fastify-plugins.js";
import {
  IDS,
  makeJournal,
  makeAccount,
  makePeriod,
  makeIcAgreement,
  makeIcDocument,
  mockJournalRepo,
  mockAccountRepo,
  mockPeriodRepo,
  mockBalanceRepo,
  mockIdempotencyStore,
  mockOutboxWriter,
  mockJournalAuditRepo,
  mockFxRateRepo,
  mockLedgerRepo,
  mockIcAgreementRepo,
  mockIcTransactionRepo,
  mockRecurringTemplateRepo,
  mockBudgetRepo,
  makeBudgetEntry,
  makeRecurringTemplate,
  mockDocumentNumberGenerator,
  mockPeriodAuditRepo,
  mockIcSettlementRepo,
  mockClassificationRuleRepo,
  mockFxRateApprovalRepo,
  mockRevenueContractRepo,
} from "./helpers.js";

const BASE_HEADERS = {
  "x-tenant-id": "t1",
  "x-user-id": "u1",
};

const JSON_HEADERS = {
  ...BASE_HEADERS,
  "content-type": "application/json",
};

const MISSING_UUID = "00000000-0000-4000-8000-ffffffffffff";

function buildApp(depsOverrides: Partial<FinanceDeps> = {}): {
  app: FastifyInstance;
  deps: FinanceDeps;
} {
  const deps: FinanceDeps = {
    journalRepo: mockJournalRepo(
      new Map([[IDS.journal, makeJournal()]]),
    ),
    accountRepo: mockAccountRepo([
      makeAccount({ id: IDS.account1, code: "1000" }),
      makeAccount({ id: IDS.account2, code: "2000" }),
    ]),
    periodRepo: mockPeriodRepo([makePeriod()]),
    balanceRepo: mockBalanceRepo(),
    idempotencyStore: mockIdempotencyStore(),
    outboxWriter: mockOutboxWriter(),
    journalAuditRepo: mockJournalAuditRepo(),
    fxRateRepo: mockFxRateRepo(),
    ledgerRepo: mockLedgerRepo(),
    icAgreementRepo: mockIcAgreementRepo(),
    icTransactionRepo: mockIcTransactionRepo(),
    recurringTemplateRepo: mockRecurringTemplateRepo(),
    budgetRepo: mockBudgetRepo(),
    documentNumberGenerator: mockDocumentNumberGenerator(),
    periodAuditRepo: mockPeriodAuditRepo(),
    icSettlementRepo: mockIcSettlementRepo(),
    classificationRuleRepo: mockClassificationRuleRepo(),
    fxRateApprovalRepo: mockFxRateApprovalRepo(),
    revenueContractRepo: mockRevenueContractRepo(),
    ...depsOverrides,
  };

  const runtime: FinanceRuntime = {
    async withTenant<T>(
      _ctx: { tenantId: string; userId: string },
      fn: (d: FinanceDeps) => Promise<T>,
    ): Promise<T> {
      return fn(deps);
    },
  };

  const app = Fastify({ logger: false });
  registerErrorHandler(app);
  registerBigIntSerializer(app);
  registerJournalRoutes(app, runtime);
  registerAccountRoutes(app, runtime);
  registerPeriodRoutes(app, runtime);
  registerBalanceRoutes(app, runtime);
  registerIcRoutes(app, runtime);
  registerIcAgreementRoutes(app, runtime);
  registerLedgerRoutes(app, runtime);
  registerFxRateRoutes(app, runtime);
  registerRecurringTemplateRoutes(app, runtime);
  registerBudgetRoutes(app, runtime);
  registerReportRoutes(app, runtime);

  return { app, deps };
}

// ─── Journal Routes ─────────────────────────────────────────────────────────

describe("Journal routes", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    ({ app } = buildApp());
    await app.ready();
  });
  afterAll(() => app.close());

  it("GET /journals/:id — 200 for existing journal", async () => {
    const res = await app.inject({ method: "GET", url: `/journals/${IDS.journal}`, headers: BASE_HEADERS });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.id).toBe(IDS.journal);
  });

  it("GET /journals/:id — 404 for missing journal", async () => {
    const res = await app.inject({ method: "GET", url: `/journals/${MISSING_UUID}`, headers: BASE_HEADERS });
    expect(res.statusCode).toBe(404);
  });

  it("POST /journals — 201 creates a draft journal", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/journals",
      headers: JSON_HEADERS,
      payload: {
        companyId: IDS.company,
        ledgerId: IDS.ledger,
        description: "Test journal",
        date: "2025-06-15",
        lines: [
          { accountCode: "1000", debit: 100, credit: 0, currency: "USD" },
          { accountCode: "2000", debit: 0, credit: 100, currency: "USD" },
        ],
      },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.status).toBe("DRAFT");
  });

  it("POST /journals/:id/post — 200 posts a draft journal", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/journals/${IDS.journal}/post`,
      headers: { ...BASE_HEADERS, "idempotency-key": "ik-post-1" },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe("POSTED");
  });

  it("POST /journals/:id/post — 404 for missing journal", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/journals/${MISSING_UUID}/post`,
      headers: { ...BASE_HEADERS, "idempotency-key": "ik-post-2" },
    });
    expect(res.statusCode).toBe(404);
  });

  it("POST /journals/:id/void — 200 voids a draft journal", async () => {
    const { app: freshApp } = buildApp();
    await freshApp.ready();
    const res = await freshApp.inject({
      method: "POST",
      url: `/journals/${IDS.journal}/void`,
      headers: BASE_HEADERS,
      payload: { reason: "Test void" },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe("VOIDED");
    await freshApp.close();
  });

  it("GET /journals — 200 returns paginated list by period", async () => {
    const { app: freshApp } = buildApp();
    await freshApp.ready();
    const res = await freshApp.inject({
      method: "GET",
      url: `/journals?periodId=${IDS.period}`,
      headers: BASE_HEADERS,
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.total).toBe(1);
    expect(body.page).toBe(1);
    expect(Array.isArray(body.data)).toBe(true);
    await freshApp.close();
  });

  it("GET /journals — 400 without required periodId", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/journals",
      headers: BASE_HEADERS,
    });
    expect(res.statusCode).toBe(400);
  });

  it("GET /journals/:id/audit — 200 returns audit trail", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/journals/${IDS.journal}/audit`,
      headers: BASE_HEADERS,
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  it("POST /journals/:id/reverse — 409 for non-POSTED journal", async () => {
    const { app: freshApp } = buildApp();
    await freshApp.ready();
    const res = await freshApp.inject({
      method: "POST",
      url: `/journals/${IDS.journal}/reverse`,
      headers: { ...BASE_HEADERS, "idempotency-key": "ik-rev-1" },
      payload: { reason: "Test reverse" },
    });
    expect(res.statusCode).toBe(409);
    await freshApp.close();
  });
});

// ─── Account Routes ─────────────────────────────────────────────────────────

describe("Account routes", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    ({ app } = buildApp());
    await app.ready();
  });
  afterAll(() => app.close());

  it("GET /accounts — 200 returns paginated list", async () => {
    const res = await app.inject({ method: "GET", url: "/accounts", headers: BASE_HEADERS });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.total).toBe(2);
    expect(body.page).toBe(1);
    expect(body.limit).toBe(20);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBe(2);
  });

  it("GET /accounts/:id — 200 for existing account", async () => {
    const res = await app.inject({ method: "GET", url: `/accounts/${IDS.account1}`, headers: BASE_HEADERS });
    expect(res.statusCode).toBe(200);
    expect(res.json().code).toBe("1000");
  });

  it("GET /accounts/:id — 404 for missing account", async () => {
    const res = await app.inject({ method: "GET", url: `/accounts/${MISSING_UUID}`, headers: BASE_HEADERS });
    expect(res.statusCode).toBe(404);
  });
});

// ─── Period Routes ──────────────────────────────────────────────────────────

describe("Period routes", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    ({ app } = buildApp());
    await app.ready();
  });
  afterAll(() => app.close());

  it("GET /periods — 200 returns paginated list", async () => {
    const res = await app.inject({ method: "GET", url: "/periods", headers: BASE_HEADERS });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.total).toBe(1);
    expect(body.page).toBe(1);
    expect(body.data.length).toBe(1);
  });

  it("GET /periods/:id — 200 for existing period", async () => {
    const res = await app.inject({ method: "GET", url: `/periods/${IDS.period}`, headers: BASE_HEADERS });
    expect(res.statusCode).toBe(200);
    expect(res.json().name).toBe("2025-P06");
  });

  it("GET /periods/:id — 404 for missing period", async () => {
    const res = await app.inject({ method: "GET", url: `/periods/${MISSING_UUID}`, headers: BASE_HEADERS });
    expect(res.statusCode).toBe(404);
  });

  it("POST /periods/:id/close — 200 closes an open period", async () => {
    const { app: freshApp } = buildApp({
      journalRepo: mockJournalRepo(), // empty — no DRAFT journals blocking close
    });
    await freshApp.ready();
    const res = await freshApp.inject({
      method: "POST",
      url: `/periods/${IDS.period}/close`,
      headers: BASE_HEADERS,
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().status).toBe("CLOSED");
    await freshApp.close();
  });

  it("POST /periods/:id/lock — 200 locks a closed period", async () => {
    const { app: freshApp } = buildApp({
      periodRepo: mockPeriodRepo([makePeriod({ status: "CLOSED" })]),
    });
    await freshApp.ready();
    const res = await freshApp.inject({
      method: "POST",
      url: `/periods/${IDS.period}/lock`,
      headers: BASE_HEADERS,
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().status).toBe("LOCKED");
    await freshApp.close();
  });

  it("POST /periods/:id/lock — 409 for OPEN period", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/periods/${IDS.period}/lock`,
      headers: BASE_HEADERS,
    });
    expect(res.statusCode).toBe(409);
  });

  it("POST /periods/:id/reopen — 200 reopens a closed period", async () => {
    const { app: freshApp } = buildApp({
      periodRepo: mockPeriodRepo([makePeriod({ status: "CLOSED" })]),
    });
    await freshApp.ready();
    const res = await freshApp.inject({
      method: "POST",
      url: `/periods/${IDS.period}/reopen`,
      headers: BASE_HEADERS,
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().status).toBe("OPEN");
    await freshApp.close();
  });

  it("POST /periods/:id/reopen — 409 for OPEN period", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/periods/${IDS.period}/reopen`,
      headers: BASE_HEADERS,
    });
    expect(res.statusCode).toBe(409);
  });

  it("POST /periods/:id/reopen — 409 for LOCKED period", async () => {
    const { app: freshApp } = buildApp({
      periodRepo: mockPeriodRepo([makePeriod({ status: "LOCKED" })]),
    });
    await freshApp.ready();
    const res = await freshApp.inject({
      method: "POST",
      url: `/periods/${IDS.period}/reopen`,
      headers: BASE_HEADERS,
    });
    expect(res.statusCode).toBe(409);
    await freshApp.close();
  });
});

// ─── Balance Routes ─────────────────────────────────────────────────────────

describe("Balance routes", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    ({ app } = buildApp());
    await app.ready();
  });
  afterAll(() => app.close());

  it("GET /trial-balance — 200 with valid params", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/trial-balance?ledgerId=${IDS.ledger}&year=2025`,
      headers: BASE_HEADERS,
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().isBalanced).toBe(true);
  });

  it("GET /trial-balance — 400 without required params", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/trial-balance",
      headers: BASE_HEADERS,
    });
    expect(res.statusCode).toBe(400);
  });
});

// ─── IC Transaction Routes ─────────────────────────────────────────────────

describe("IC transaction routes", () => {
  it("POST /ic-transactions — 201 creates paired IC journals", async () => {
    const { app } = buildApp({
      icAgreementRepo: mockIcAgreementRepo([makeIcAgreement()]),
    });
    await app.ready();
    const res = await app.inject({
      method: "POST",
      url: "/ic-transactions",
      headers: JSON_HEADERS,
      payload: {
        agreementId: IDS.agreement,
        sourceLedgerId: IDS.ledger,
        mirrorLedgerId: IDS.ledger2,
        fiscalPeriodId: IDS.period,
        description: "IC Sale Q1",
        postingDate: "2025-01-15",
        currency: "USD",
        sourceLines: [{ accountId: IDS.account1, debit: "1000", credit: "0" }],
        mirrorLines: [{ accountId: IDS.account2, debit: "0", credit: "1000" }],
      },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.status).toBe("PAIRED");
    expect(body.relationshipId).toBe(IDS.agreement);
    await app.close();
  });

  it("POST /ic-transactions — 404 for missing agreement", async () => {
    const { app } = buildApp();
    await app.ready();
    const res = await app.inject({
      method: "POST",
      url: "/ic-transactions",
      headers: JSON_HEADERS,
      payload: {
        agreementId: MISSING_UUID,
        sourceLedgerId: IDS.ledger,
        mirrorLedgerId: IDS.ledger2,
        fiscalPeriodId: IDS.period,
        description: "IC Sale",
        postingDate: "2025-01-15",
        currency: "USD",
        sourceLines: [{ accountId: IDS.account1, debit: "1000", credit: "0" }],
        mirrorLines: [{ accountId: IDS.account2, debit: "0", credit: "1000" }],
      },
    });
    expect(res.statusCode).toBe(404);
    await app.close();
  });

  it("POST /ic-transactions — 409 for inactive agreement", async () => {
    const { app } = buildApp({
      icAgreementRepo: mockIcAgreementRepo([makeIcAgreement({ isActive: false })]),
    });
    await app.ready();
    const res = await app.inject({
      method: "POST",
      url: "/ic-transactions",
      headers: JSON_HEADERS,
      payload: {
        agreementId: IDS.agreement,
        sourceLedgerId: IDS.ledger,
        mirrorLedgerId: IDS.ledger2,
        fiscalPeriodId: IDS.period,
        description: "IC Sale",
        postingDate: "2025-01-15",
        currency: "USD",
        sourceLines: [{ accountId: IDS.account1, debit: "1000", credit: "0" }],
        mirrorLines: [{ accountId: IDS.account2, debit: "0", credit: "1000" }],
      },
    });
    expect(res.statusCode).toBe(409);
    await app.close();
  });

  it("POST /ic-transactions — 422 for empty source lines", async () => {
    const { app } = buildApp({
      icAgreementRepo: mockIcAgreementRepo([makeIcAgreement()]),
    });
    await app.ready();
    const res = await app.inject({
      method: "POST",
      url: "/ic-transactions",
      headers: JSON_HEADERS,
      payload: {
        agreementId: IDS.agreement,
        sourceLedgerId: IDS.ledger,
        mirrorLedgerId: IDS.ledger2,
        fiscalPeriodId: IDS.period,
        description: "IC Sale",
        postingDate: "2025-01-15",
        currency: "USD",
        sourceLines: [],
        mirrorLines: [{ accountId: IDS.account2, debit: "0", credit: "1000" }],
      },
    });
    expect(res.statusCode).toBe(400);
    await app.close();
  });

  it("GET /ic-transactions/:id — 200 for existing IC document", async () => {
    const { app } = buildApp({
      icTransactionRepo: mockIcTransactionRepo([makeIcDocument()]),
    });
    await app.ready();
    const res = await app.inject({
      method: "GET",
      url: `/ic-transactions/${IDS.icDoc}`,
      headers: BASE_HEADERS,
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().id).toBe(IDS.icDoc);
    expect(res.json().status).toBe("PAIRED");
    await app.close();
  });

  it("GET /ic-transactions/:id — 404 for missing IC document", async () => {
    const { app } = buildApp();
    await app.ready();
    const res = await app.inject({
      method: "GET",
      url: `/ic-transactions/${MISSING_UUID}`,
      headers: BASE_HEADERS,
    });
    expect(res.statusCode).toBe(404);
    await app.close();
  });
});

// ─── Ledger Routes ─────────────────────────────────────────────────────────

describe("Ledger routes", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    ({ app } = buildApp());
    await app.ready();
  });
  afterAll(() => app.close());

  it("GET /ledgers — 200 returns paginated list", async () => {
    const res = await app.inject({ method: "GET", url: "/ledgers", headers: BASE_HEADERS });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.total).toBe(1);
    expect(body.page).toBe(1);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBe(1);
  });

  it("GET /ledgers/:id — 200 for existing ledger", async () => {
    const res = await app.inject({ method: "GET", url: `/ledgers/${IDS.ledger}`, headers: BASE_HEADERS });
    expect(res.statusCode).toBe(200);
    expect(res.json().name).toBe("General Ledger");
    expect(res.json().baseCurrency).toBe("USD");
  });

  it("GET /ledgers/:id — 404 for missing ledger", async () => {
    const res = await app.inject({ method: "GET", url: `/ledgers/${MISSING_UUID}`, headers: BASE_HEADERS });
    expect(res.statusCode).toBe(404);
  });
});

// ─── FX Rate Routes ────────────────────────────────────────────────────────

describe("FX rate routes", () => {
  it("GET /fx-rates — 400 without required params", async () => {
    const { app } = buildApp();
    await app.ready();
    const res = await app.inject({
      method: "GET",
      url: "/fx-rates",
      headers: BASE_HEADERS,
    });
    expect(res.statusCode).toBe(400);
    await app.close();
  });

  it("GET /fx-rates — 404 when no rate found", async () => {
    const { app } = buildApp();
    await app.ready();
    const res = await app.inject({
      method: "GET",
      url: "/fx-rates?from=USD&to=MYR&date=2025-01-15",
      headers: BASE_HEADERS,
    });
    expect(res.statusCode).toBe(404);
    await app.close();
  });
});

// ─── IC Agreement Routes ──────────────────────────────────────────────────

describe("IC agreement routes", () => {
  it("GET /ic-agreements — 200 returns paginated list", async () => {
    const { app } = buildApp({
      icAgreementRepo: mockIcAgreementRepo([makeIcAgreement()]),
    });
    await app.ready();
    const res = await app.inject({ method: "GET", url: "/ic-agreements", headers: BASE_HEADERS });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.total).toBe(1);
    expect(body.page).toBe(1);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBe(1);
    await app.close();
  });

  it("GET /ic-agreements — 200 returns empty list when none exist", async () => {
    const { app } = buildApp();
    await app.ready();
    const res = await app.inject({ method: "GET", url: "/ic-agreements", headers: BASE_HEADERS });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.total).toBe(0);
    expect(body.data.length).toBe(0);
    await app.close();
  });

  it("GET /ic-agreements/:id — 200 for existing agreement", async () => {
    const { app } = buildApp({
      icAgreementRepo: mockIcAgreementRepo([makeIcAgreement()]),
    });
    await app.ready();
    const res = await app.inject({
      method: "GET",
      url: `/ic-agreements/${IDS.agreement}`,
      headers: BASE_HEADERS,
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().id).toBe(IDS.agreement);
    expect(res.json().pricingRule).toBe("COST");
    await app.close();
  });

  it("GET /ic-agreements/:id — 404 for missing agreement", async () => {
    const { app } = buildApp();
    await app.ready();
    const res = await app.inject({
      method: "GET",
      url: `/ic-agreements/${MISSING_UUID}`,
      headers: BASE_HEADERS,
    });
    expect(res.statusCode).toBe(404);
    await app.close();
  });
});

// ─── Recurring Template Routes ──────────────────────────────────────────────

describe("Recurring template routes", () => {
  it("POST /recurring-templates — creates a template", async () => {
    const { app } = buildApp();
    await app.ready();
    const res = await app.inject({
      method: "POST",
      url: "/recurring-templates",
      headers: JSON_HEADERS,
      payload: {
        companyId: IDS.company,
        ledgerId: IDS.ledger,
        description: "Monthly depreciation",
        lines: [
          { accountCode: "1000", debit: 5000, credit: 0 },
          { accountCode: "2000", debit: 0, credit: 5000 },
        ],
        frequency: "MONTHLY",
        nextRunDate: "2025-07-01",
      },
    });
    expect(res.statusCode).toBe(201);
    await app.close();
  });

  it("GET /recurring-templates — returns paginated list", async () => {
    const template = makeRecurringTemplate();
    const { app } = buildApp({
      recurringTemplateRepo: mockRecurringTemplateRepo([template]),
    });
    await app.ready();
    const res = await app.inject({
      method: "GET",
      url: "/recurring-templates?page=1&limit=10",
      headers: BASE_HEADERS,
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data).toHaveLength(1);
    expect(body.total).toBe(1);
    await app.close();
  });

  it("GET /recurring-templates/:id — returns template by ID", async () => {
    const template = makeRecurringTemplate();
    const { app } = buildApp({
      recurringTemplateRepo: mockRecurringTemplateRepo([template]),
    });
    await app.ready();
    const res = await app.inject({
      method: "GET",
      url: `/recurring-templates/${template.id}`,
      headers: BASE_HEADERS,
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().id).toBe(template.id);
    await app.close();
  });

  it("GET /recurring-templates/:id — 404 for missing", async () => {
    const { app } = buildApp();
    await app.ready();
    const res = await app.inject({
      method: "GET",
      url: `/recurring-templates/${MISSING_UUID}`,
      headers: BASE_HEADERS,
    });
    expect(res.statusCode).toBe(404);
    await app.close();
  });
});

// ─── Budget Routes ──────────────────────────────────────────────────────────

describe("Budget routes", () => {
  it("POST /budget-entries — upserts a budget entry", async () => {
    const { app } = buildApp();
    await app.ready();
    const res = await app.inject({
      method: "POST",
      url: "/budget-entries",
      headers: JSON_HEADERS,
      payload: {
        companyId: IDS.company,
        ledgerId: IDS.ledger,
        accountId: IDS.account1,
        periodId: IDS.period,
        budgetAmount: 50000,
      },
    });
    expect(res.statusCode).toBe(201);
    await app.close();
  });

  it("GET /budget-entries — returns paginated list", async () => {
    const entry = makeBudgetEntry();
    const { app } = buildApp({
      budgetRepo: mockBudgetRepo([entry]),
    });
    await app.ready();
    const res = await app.inject({
      method: "GET",
      url: `/budget-entries?ledgerId=${IDS.ledger}&periodId=${IDS.period}&page=1&limit=10`,
      headers: BASE_HEADERS,
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data).toHaveLength(1);
    await app.close();
  });

  it("GET /budget-entries — 400 without required params", async () => {
    const { app } = buildApp();
    await app.ready();
    const res = await app.inject({
      method: "GET",
      url: "/budget-entries",
      headers: BASE_HEADERS,
    });
    expect(res.statusCode).toBe(400);
    await app.close();
  });
});

// ─── Report Routes ──────────────────────────────────────────────────────────

describe("Report routes", () => {
  it("GET /reports/balance-sheet — returns balance sheet", async () => {
    const { app } = buildApp();
    await app.ready();
    const res = await app.inject({
      method: "GET",
      url: `/reports/balance-sheet?ledgerId=${IDS.ledger}&periodId=${IDS.period}`,
      headers: BASE_HEADERS,
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveProperty("assets");
    expect(body).toHaveProperty("liabilities");
    expect(body).toHaveProperty("equity");
    expect(body).toHaveProperty("isBalanced");
    await app.close();
  });

  it("GET /reports/balance-sheet — 400 without params", async () => {
    const { app } = buildApp();
    await app.ready();
    const res = await app.inject({
      method: "GET",
      url: "/reports/balance-sheet",
      headers: BASE_HEADERS,
    });
    expect(res.statusCode).toBe(400);
    await app.close();
  });

  it("GET /reports/income-statement — returns income statement", async () => {
    const { app } = buildApp();
    await app.ready();
    const res = await app.inject({
      method: "GET",
      url: `/reports/income-statement?ledgerId=${IDS.ledger}&fromPeriodId=${IDS.period}&toPeriodId=${IDS.period}`,
      headers: BASE_HEADERS,
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveProperty("revenue");
    expect(body).toHaveProperty("expenses");
    expect(body).toHaveProperty("netIncome");
    await app.close();
  });

  it("GET /reports/income-statement — 400 without params", async () => {
    const { app } = buildApp();
    await app.ready();
    const res = await app.inject({
      method: "GET",
      url: "/reports/income-statement",
      headers: BASE_HEADERS,
    });
    expect(res.statusCode).toBe(400);
    await app.close();
  });
});
