import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';
import type { FinanceRuntime, FinanceDeps } from '../app/ports/finance-runtime.js';
import { registerArInvoiceRoutes } from '../slices/ar/routes/ar-invoice-routes.js';
import { registerArPaymentRoutes } from '../slices/ar/routes/ar-payment-routes.js';
import { registerArAgingRoutes } from '../slices/ar/routes/ar-aging-routes.js';
import { registerArDunningRoutes } from '../slices/ar/routes/ar-dunning-routes.js';
import { DefaultAuthorizationPolicy } from '../shared/authorization/default-authorization-policy.js';
import {
  registerErrorHandler,
  registerBigIntSerializer,
} from '../shared/routes/fastify-plugins.js';
import { money } from '@afenda/core';
import {
  IDS,
  AR_IDS,
  makeArInvoice,
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
  mockArInvoiceRepo,
  mockArPaymentAllocationRepo,
  mockDunningRepo,
} from './helpers.js';

const BASE_HEADERS = { 'x-tenant-id': 't1', 'x-user-id': 'u1' };
const JSON_HEADERS = { ...BASE_HEADERS, 'content-type': 'application/json' };

function buildArApp(depsOverrides: Partial<FinanceDeps> = {}): {
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
    arInvoiceRepo: mockArInvoiceRepo(),
    arPaymentAllocationRepo: mockArPaymentAllocationRepo(),
    dunningRepo: mockDunningRepo(),
    ...depsOverrides,
  };

  const runtime: FinanceRuntime = {
    async withTenant<T>(
      _ctx: { tenantId: string; userId: string },
      fn: (d: FinanceDeps) => Promise<T>
    ): Promise<T> {
      return fn(deps);
    },
  };

  const app = Fastify({ logger: false });
  registerErrorHandler(app);
  registerBigIntSerializer(app);
  const policy = new DefaultAuthorizationPolicy();
  registerArInvoiceRoutes(app, runtime, policy);
  registerArPaymentRoutes(app, runtime, policy);
  registerArAgingRoutes(app, runtime, policy);
  registerArDunningRoutes(app, runtime, policy);

  return { app, deps };
}

// ─── AR Invoice Routes ─────────────────────────────────────────────────────

describe('AR Invoice Routes', () => {
  let app: FastifyInstance;

  describe('POST /ar/invoices', () => {
    beforeAll(async () => {
      ({ app } = buildArApp());
      await app.ready();
    });
    afterAll(() => app.close());

    it('creates an AR invoice — 201', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/ar/invoices',
        headers: JSON_HEADERS,
        payload: {
          companyId: IDS.company,
          customerId: AR_IDS.customer,
          ledgerId: IDS.ledger,
          invoiceNumber: 'AR-TEST-001',
          invoiceDate: '2025-01-15',
          dueDate: '2025-02-14',
          currencyCode: 'USD',
          lines: [
            {
              accountId: AR_IDS.revenueAccount,
              quantity: 1,
              unitPrice: 500,
              amount: 500,
              taxAmount: 0,
            },
          ],
        },
      });
      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.invoiceNumber).toBe('AR-TEST-001');
    });

    it('rejects invalid body — 400', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/ar/invoices',
        headers: JSON_HEADERS,
        payload: { lines: [] },
      });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /ar/invoices', () => {
    beforeAll(async () => {
      const inv = makeArInvoice({ status: 'POSTED' });
      const invoices = new Map([[inv.id, inv]]);
      ({ app } = buildArApp({ arInvoiceRepo: mockArInvoiceRepo(invoices) }));
      await app.ready();
    });
    afterAll(() => app.close());

    it('lists AR invoices — 200', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/ar/invoices',
        headers: BASE_HEADERS,
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.data).toHaveLength(1);
    });
  });

  describe('GET /ar/invoices/:id', () => {
    beforeAll(async () => {
      const inv = makeArInvoice();
      const invoices = new Map([[inv.id, inv]]);
      ({ app } = buildArApp({ arInvoiceRepo: mockArInvoiceRepo(invoices) }));
      await app.ready();
    });
    afterAll(() => app.close());

    it('returns AR invoice by ID — 200', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/ar/invoices/${AR_IDS.invoice}`,
        headers: BASE_HEADERS,
      });
      expect(res.statusCode).toBe(200);
    });

    it('returns 404 for unknown ID', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/ar/invoices/00000000-0000-4000-8000-ffffffffffff',
        headers: BASE_HEADERS,
      });
      expect(res.statusCode).toBe(404);
    });
  });

  describe('POST /ar/invoices/:id/post', () => {
    beforeAll(async () => {
      const inv = makeArInvoice({ status: 'APPROVED' });
      const invoices = new Map([[inv.id, inv]]);
      ({ app } = buildArApp({ arInvoiceRepo: mockArInvoiceRepo(invoices) }));
      await app.ready();
    });
    afterAll(() => app.close());

    it('posts an APPROVED AR invoice — 200', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/ar/invoices/${AR_IDS.invoice}/post`,
        headers: JSON_HEADERS,
        payload: { fiscalPeriodId: IDS.period, arAccountId: AR_IDS.arAccount },
      });
      expect(res.statusCode).toBe(200);
    });
  });

  describe('POST /ar/invoices/:id/write-off', () => {
    beforeAll(async () => {
      const inv = makeArInvoice({ status: 'POSTED' });
      const invoices = new Map([[inv.id, inv]]);
      ({ app } = buildArApp({ arInvoiceRepo: mockArInvoiceRepo(invoices) }));
      await app.ready();
    });
    afterAll(() => app.close());

    it('writes off a POSTED invoice — 200', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/ar/invoices/${AR_IDS.invoice}/write-off`,
        headers: JSON_HEADERS,
        payload: { reason: 'Bad debt' },
      });
      expect(res.statusCode).toBe(200);
    });
  });

  describe('POST /ar/credit-notes', () => {
    beforeAll(async () => {
      const inv = makeArInvoice({ status: 'POSTED' });
      const invoices = new Map([[inv.id, inv]]);
      ({ app } = buildArApp({ arInvoiceRepo: mockArInvoiceRepo(invoices) }));
      await app.ready();
    });
    afterAll(() => app.close());

    it('creates a credit note — 201', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/ar/credit-notes',
        headers: JSON_HEADERS,
        payload: { originalInvoiceId: AR_IDS.invoice, reason: 'Overcharge' },
      });
      expect(res.statusCode).toBe(201);
    });
  });
});

// ─── AR Payment Routes ─────────────────────────────────────────────────────

describe('AR Payment Routes', () => {
  let app: FastifyInstance;

  describe('POST /ar/payments', () => {
    beforeAll(async () => {
      const inv = makeArInvoice({
        status: 'POSTED',
        customerId: AR_IDS.customer,
        totalAmount: money(50000n, 'USD'),
        paidAmount: money(0n, 'USD'),
      });
      const invoices = new Map([[inv.id, inv]]);
      ({ app } = buildArApp({ arInvoiceRepo: mockArInvoiceRepo(invoices) }));
      await app.ready();
    });
    afterAll(() => app.close());

    it('allocates payment — 201', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/ar/payments',
        headers: JSON_HEADERS,
        payload: {
          customerId: AR_IDS.customer,
          paymentDate: '2025-03-01',
          paymentRef: 'PAY-001',
          paymentAmount: 300,
          currencyCode: 'USD',
        },
      });
      expect(res.statusCode).toBe(201);
    });
  });
});

// ─── AR Aging Routes ───────────────────────────────────────────────────────

describe('AR Aging Routes', () => {
  let app: FastifyInstance;

  describe('GET /ar/aging', () => {
    beforeAll(async () => {
      const inv = makeArInvoice({ status: 'POSTED', dueDate: new Date('2025-03-01') });
      const invoices = new Map([[inv.id, inv]]);
      ({ app } = buildArApp({ arInvoiceRepo: mockArInvoiceRepo(invoices) }));
      await app.ready();
    });
    afterAll(() => app.close());

    it('returns aging report — 200', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/ar/aging?asOfDate=2025-04-15',
        headers: BASE_HEADERS,
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.rows).toHaveLength(1);
    });
  });
});

// ─── AR Dunning Routes ─────────────────────────────────────────────────────

describe('AR Dunning Routes', () => {
  let app: FastifyInstance;

  describe('POST /ar/dunning', () => {
    beforeAll(async () => {
      const inv = makeArInvoice({
        status: 'POSTED',
        dueDate: new Date('2025-01-01'),
        customerId: AR_IDS.customer,
      });
      const invoices = new Map([[inv.id, inv]]);
      ({ app } = buildArApp({ arInvoiceRepo: mockArInvoiceRepo(invoices) }));
      await app.ready();
    });
    afterAll(() => app.close());

    it('runs dunning — 201', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/ar/dunning',
        headers: JSON_HEADERS,
        payload: { runDate: '2025-04-15' },
      });
      expect(res.statusCode).toBe(201);
    });
  });
});
