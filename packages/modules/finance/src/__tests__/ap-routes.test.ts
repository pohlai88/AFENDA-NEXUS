import { describe, it, expect, beforeAll, afterAll } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import type { FinanceRuntime, FinanceDeps } from "../app/ports/finance-runtime.js";
import { registerApInvoiceRoutes } from "../slices/ap/routes/ap-invoice-routes.js";
import { registerApPaymentRunRoutes } from "../slices/ap/routes/ap-payment-run-routes.js";
import { registerApAgingRoutes } from "../slices/ap/routes/ap-aging-routes.js";
import { registerErrorHandler, registerBigIntSerializer } from "../shared/routes/fastify-plugins.js";
import { money } from "@afenda/core";
import {
  IDS,
  AP_IDS,
  makeApInvoice,
  makePaymentRun,
  makePaymentRunItem,
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
  mockDocumentNumberGenerator,
  mockPeriodAuditRepo,
  mockIcSettlementRepo,
  mockClassificationRuleRepo,
  mockFxRateApprovalRepo,
  mockRevenueContractRepo,
  mockApInvoiceRepo,
  mockPaymentTermsRepo,
  mockApPaymentRunRepo,
} from "./helpers.js";

const BASE_HEADERS = { "x-tenant-id": "t1", "x-user-id": "u1" };
const JSON_HEADERS = { ...BASE_HEADERS, "content-type": "application/json" };

function buildApApp(depsOverrides: Partial<FinanceDeps> = {}): {
  app: FastifyInstance;
  deps: FinanceDeps;
} {
  const deps: FinanceDeps = {
    journalRepo: mockJournalRepo(),
    accountRepo: mockAccountRepo(),
    periodRepo: mockPeriodRepo(),
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
    apInvoiceRepo: mockApInvoiceRepo(),
    paymentTermsRepo: mockPaymentTermsRepo(),
    apPaymentRunRepo: mockApPaymentRunRepo(),
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
  registerApInvoiceRoutes(app, runtime);
  registerApPaymentRunRoutes(app, runtime);
  registerApAgingRoutes(app, runtime);

  return { app, deps };
}

// ─── AP Invoice Routes ─────────────────────────────────────────────────────

describe("AP Invoice Routes", () => {
  let app: FastifyInstance;

  describe("POST /ap/invoices", () => {
    beforeAll(async () => {
      ({ app } = buildApApp());
      await app.ready();
    });
    afterAll(() => app.close());

    it("creates an AP invoice (201)", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/ap/invoices",
        headers: JSON_HEADERS,
        payload: {
          companyId: IDS.company,
          supplierId: AP_IDS.supplier,
          ledgerId: IDS.ledger,
          invoiceNumber: "INV-100",
          invoiceDate: "2025-01-15",
          dueDate: "2025-02-14",
          currencyCode: "USD",
          lines: [
            { accountId: AP_IDS.expenseAccount, unitPrice: 100, amount: 100, taxAmount: 0 },
          ],
        },
      });
      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.invoiceNumber).toBe("INV-100");
    });
  });

  describe("GET /ap/invoices", () => {
    beforeAll(async () => {
      const invoiceRepo = mockApInvoiceRepo(new Map([
        [AP_IDS.invoice, makeApInvoice()],
      ]));
      ({ app } = buildApApp({ apInvoiceRepo: invoiceRepo }));
      await app.ready();
    });
    afterAll(() => app.close());

    it("returns paginated list (200)", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/ap/invoices",
        headers: BASE_HEADERS,
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.data).toHaveLength(1);
      expect(body.total).toBe(1);
    });
  });

  describe("GET /ap/invoices/:id", () => {
    beforeAll(async () => {
      const invoiceRepo = mockApInvoiceRepo(new Map([
        [AP_IDS.invoice, makeApInvoice()],
      ]));
      ({ app } = buildApApp({ apInvoiceRepo: invoiceRepo }));
      await app.ready();
    });
    afterAll(() => app.close());

    it("returns invoice by ID (200)", async () => {
      const res = await app.inject({
        method: "GET",
        url: `/ap/invoices/${AP_IDS.invoice}`,
        headers: BASE_HEADERS,
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.id).toBe(AP_IDS.invoice);
    });

    it("returns 404 for missing invoice", async () => {
      const res = await app.inject({
        method: "GET",
        url: `/ap/invoices/00000000-0000-4000-8000-ffffffffffff`,
        headers: BASE_HEADERS,
      });
      expect(res.statusCode).toBe(404);
    });
  });

  describe("POST /ap/invoices/:id/post", () => {
    beforeAll(async () => {
      const invoiceRepo = mockApInvoiceRepo(new Map([
        [AP_IDS.invoice, makeApInvoice({ status: "APPROVED" })],
      ]));
      ({ app } = buildApApp({ apInvoiceRepo: invoiceRepo }));
      await app.ready();
    });
    afterAll(() => app.close());

    it("posts an APPROVED invoice (200)", async () => {
      const res = await app.inject({
        method: "POST",
        url: `/ap/invoices/${AP_IDS.invoice}/post`,
        headers: JSON_HEADERS,
        payload: {
          fiscalPeriodId: IDS.period,
          apAccountId: AP_IDS.apAccount,
        },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.status).toBe("POSTED");
    });
  });

  describe("POST /ap/debit-memos", () => {
    beforeAll(async () => {
      const invoiceRepo = mockApInvoiceRepo(new Map([
        [AP_IDS.invoice, makeApInvoice({ status: "POSTED" })],
      ]));
      ({ app } = buildApApp({ apInvoiceRepo: invoiceRepo }));
      await app.ready();
    });
    afterAll(() => app.close());

    it("creates a debit memo (201)", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/ap/debit-memos",
        headers: JSON_HEADERS,
        payload: {
          originalInvoiceId: AP_IDS.invoice,
          reason: "Damaged goods",
        },
      });
      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.invoiceNumber).toContain("DM-");
    });
  });
});

// ─── AP Payment Run Routes ─────────────────────────────────────────────────

describe("AP Payment Run Routes", () => {
  let app: FastifyInstance;

  describe("POST /ap/payment-runs", () => {
    beforeAll(async () => {
      ({ app } = buildApApp());
      await app.ready();
    });
    afterAll(() => app.close());

    it("creates a payment run (201)", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/ap/payment-runs",
        headers: JSON_HEADERS,
        payload: {
          companyId: IDS.company,
          runDate: "2025-03-01",
          cutoffDate: "2025-02-28",
          currencyCode: "USD",
        },
      });
      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.currencyCode).toBe("USD");
    });
  });

  describe("GET /ap/payment-runs", () => {
    beforeAll(async () => {
      const runRepo = mockApPaymentRunRepo(new Map([
        [AP_IDS.paymentRun, makePaymentRun()],
      ]));
      ({ app } = buildApApp({ apPaymentRunRepo: runRepo }));
      await app.ready();
    });
    afterAll(() => app.close());

    it("returns paginated list (200)", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/ap/payment-runs",
        headers: BASE_HEADERS,
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.data).toHaveLength(1);
    });
  });

  describe("GET /ap/payment-runs/:id", () => {
    beforeAll(async () => {
      const runRepo = mockApPaymentRunRepo(new Map([
        [AP_IDS.paymentRun, makePaymentRun()],
      ]));
      ({ app } = buildApApp({ apPaymentRunRepo: runRepo }));
      await app.ready();
    });
    afterAll(() => app.close());

    it("returns payment run by ID (200)", async () => {
      const res = await app.inject({
        method: "GET",
        url: `/ap/payment-runs/${AP_IDS.paymentRun}`,
        headers: BASE_HEADERS,
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.id).toBe(AP_IDS.paymentRun);
    });
  });

  describe("POST /ap/payment-runs/:id/execute", () => {
    beforeAll(async () => {
      const invoice = makeApInvoice({ status: "POSTED" });
      const invoiceRepo = mockApInvoiceRepo(new Map([[AP_IDS.invoice, invoice]]));
      const run = makePaymentRun({
        status: "APPROVED",
        items: [makePaymentRunItem({ invoiceId: AP_IDS.invoice })],
      });
      const runRepo = mockApPaymentRunRepo(new Map([[AP_IDS.paymentRun, run]]));
      ({ app } = buildApApp({ apPaymentRunRepo: runRepo, apInvoiceRepo: invoiceRepo }));
      await app.ready();
    });
    afterAll(() => app.close());

    it("executes an APPROVED payment run (200)", async () => {
      const res = await app.inject({
        method: "POST",
        url: `/ap/payment-runs/${AP_IDS.paymentRun}/execute`,
        headers: BASE_HEADERS,
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.status).toBe("EXECUTED");
    });
  });
});

// ─── AP Aging Routes ───────────────────────────────────────────────────────

describe("AP Aging Routes", () => {
  let app: FastifyInstance;

  describe("GET /ap/aging", () => {
    beforeAll(async () => {
      const invoiceRepo = mockApInvoiceRepo(new Map([
        [AP_IDS.invoice, makeApInvoice({
          status: "POSTED",
          totalAmount: money(10000n, "USD"),
          paidAmount: money(0n, "USD"),
          dueDate: new Date("2025-03-01"),
        })],
      ]));
      ({ app } = buildApApp({ apInvoiceRepo: invoiceRepo }));
      await app.ready();
    });
    afterAll(() => app.close());

    it("returns aging report (200)", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/ap/aging?asOfDate=2025-04-01",
        headers: BASE_HEADERS,
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.rows).toBeDefined();
      expect(body.totals).toBeDefined();
    });
  });
});
