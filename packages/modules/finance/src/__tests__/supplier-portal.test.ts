/**
 * Supplier Portal (N1–N6) unit tests.
 *
 * Tests all portal services using mock repos — no DB needed.
 */
import { describe, it, expect } from 'vitest';
import { ok, err, NotFoundError, money, companyId, ledgerId } from '@afenda/core';
import type { Result } from '@afenda/core';
import type { Supplier, SupplierBankAccount } from '../slices/ap/entities/supplier.js';
import type { ApInvoice } from '../slices/ap/entities/ap-invoice.js';
import type {
  ISupplierRepo,
  UpdateSupplierInput,
  CreateSupplierBankAccountInput,
} from '../slices/ap/ports/supplier-repo.js';
import type { IApInvoiceRepo } from '../slices/ap/ports/ap-invoice-repo.js';
import type { IOutboxWriter, OutboxEvent } from '../shared/ports/outbox-writer.js';
import type { WhtCertificate } from '../slices/tax/entities/wht-certificate.js';
import type { IWhtCertificateRepo } from '../slices/tax/ports/wht-certificate-repo.js';

import {
  getSupplierInvoices,
  getSupplierAging,
} from '../slices/ap/services/supplier-portal-visibility.js';
import { supplierAddBankAccount } from '../slices/ap/services/supplier-portal-bank-account.js';
import {
  getSupplierWhtCertificates,
  getSupplierWhtCertificateById,
} from '../slices/ap/services/supplier-portal-wht.js';
import { supplierSubmitInvoices } from '../slices/ap/services/supplier-portal-invoice-submit.js';
import { supplierUpdateProfile } from '../slices/ap/services/supplier-portal-profile.js';

// ─── Fixed IDs ──────────────────────────────────────────────────────────────

const SUPPLIER_ID = '00000000-0000-4000-8000-000000000d10';
const TENANT_ID = 't1';
const USER_ID = 'u1';
const COMPANY_ID = '00000000-0000-4000-8000-000000000030';
const LEDGER_ID = '00000000-0000-4000-8000-000000000040';

// ─── Factories ──────────────────────────────────────────────────────────────

function makeSupplier(overrides: Partial<Supplier> = {}): Supplier {
  return {
    id: SUPPLIER_ID,
    tenantId: TENANT_ID,
    companyId: COMPANY_ID,
    code: 'SUP-001',
    name: 'Test Supplier',
    taxId: '123456789',
    currencyCode: 'USD',
    defaultPaymentTermsId: null,
    defaultPaymentMethod: 'BANK_TRANSFER',
    whtRateId: null,
    remittanceEmail: 'supplier@example.com',
    status: 'ACTIVE',
    sites: [],
    bankAccounts: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeApInvoice(overrides: Partial<ApInvoice> = {}): ApInvoice {
  return {
    id: 'inv-1',
    tenantId: TENANT_ID,
    companyId: companyId(COMPANY_ID),
    supplierId: SUPPLIER_ID,
    ledgerId: ledgerId(LEDGER_ID),
    invoiceNumber: 'INV-001',
    supplierRef: null,
    invoiceDate: new Date('2025-01-15'),
    dueDate: new Date('2025-02-14'),
    totalAmount: money(10000n, 'USD'),
    paidAmount: money(0n, 'USD'),
    status: 'POSTED',
    invoiceType: 'STANDARD',
    description: 'Test invoice',
    poRef: null,
    receiptRef: null,
    paymentTermsId: null,
    journalId: null,
    originalInvoiceId: null,
    lines: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeWhtCertificate(overrides: Partial<WhtCertificate> = {}): WhtCertificate {
  return {
    id: 'wht-1',
    tenantId: TENANT_ID,
    payeeId: SUPPLIER_ID,
    payeeName: 'Test Supplier',
    payeeType: 'RESIDENT',
    countryCode: 'ZAF',
    incomeType: 'INTEREST',
    grossAmount: 10000n,
    whtAmount: 1500n,
    netAmount: 8500n,
    currencyCode: 'USD',
    rateApplied: 15,
    treatyRate: null,
    certificateNumber: 'WHT-001',
    issueDate: new Date('2025-06-01'),
    taxPeriodStart: new Date('2025-01-01'),
    taxPeriodEnd: new Date('2025-06-30'),
    relatedInvoiceId: null,
    relatedPaymentId: null,
    status: 'ISSUED',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// ─── Mock Helpers ───────────────────────────────────────────────────────────

function mockSupplierRepo(supplier: Supplier | null = makeSupplier()): ISupplierRepo {
  const suppliers = supplier ? new Map([[supplier.id, supplier]]) : new Map<string, Supplier>();
  return {
    async findById(id: string): Promise<Result<Supplier>> {
      const s = suppliers.get(id);
      return s ? ok(s) : err(new NotFoundError('Supplier', id));
    },
    async findByCode(code: string): Promise<Result<Supplier>> {
      const s = [...suppliers.values()].find((sup) => sup.code === code);
      return s ? ok(s) : err(new NotFoundError('Supplier', code));
    },
    async findAll() {
      return { data: [...suppliers.values()], total: suppliers.size, page: 1, limit: 20 };
    },
    async findByStatus() {
      return { data: [...suppliers.values()], total: suppliers.size, page: 1, limit: 20 };
    },
    async create() {
      return ok(makeSupplier());
    },
    async update(id: string, input: UpdateSupplierInput): Promise<Result<Supplier>> {
      const s = suppliers.get(id);
      if (!s) return err(new NotFoundError('Supplier', id));
      const updated = { ...s, ...input, updatedAt: new Date() };
      suppliers.set(id, updated);
      return ok(updated);
    },
    async addSite() {
      return ok({
        id: 'site-1',
        supplierId: SUPPLIER_ID,
        siteCode: 'S01',
        name: 'HQ',
        addressLine1: '123 Main',
        addressLine2: null,
        city: 'Cape Town',
        region: 'WC',
        postalCode: '8001',
        countryCode: 'ZAF',
        isPrimary: true,
        isActive: true,
      });
    },
    async addBankAccount(
      input: CreateSupplierBankAccountInput
    ): Promise<Result<SupplierBankAccount>> {
      return ok({
        id: `ba-${Date.now()}`,
        supplierId: input.supplierId,
        bankName: input.bankName,
        accountName: input.accountName,
        accountNumber: input.accountNumber,
        iban: input.iban,
        swiftBic: input.swiftBic,
        localBankCode: input.localBankCode,
        currencyCode: input.currencyCode,
        isPrimary: input.isPrimary,
        isActive: true,
      });
    },
  };
}

function mockApInvoiceRepo(invoices: ApInvoice[] = [makeApInvoice()]): IApInvoiceRepo {
  return {
    async create() {
      return ok(makeApInvoice());
    },
    async findById(id: string) {
      const inv = invoices.find((i) => i.id === id);
      return inv ? ok(inv) : err(new NotFoundError('ApInvoice', id));
    },
    async findBySupplier(supplierId: string) {
      const filtered = invoices.filter((i) => i.supplierId === supplierId);
      return { data: filtered, total: filtered.length, page: 1, limit: 20 };
    },
    async findByStatus() {
      return { data: invoices, total: invoices.length, page: 1, limit: 20 };
    },
    async findAll() {
      return { data: invoices, total: invoices.length, page: 1, limit: 20 };
    },
    async findUnpaid() {
      return invoices.filter((i) => i.status !== 'PAID');
    },
    async updateStatus() {
      return ok(makeApInvoice());
    },
    async recordPayment() {
      return ok(makeApInvoice());
    },
    async recordPaymentWithTrace() {
      return ok({
        invoice: makeApInvoice(),
        trace: {
          id: 'ct-1',
          invoiceId: 'inv-1',
          paymentRunId: 'pr-1',
          amount: money(10000n, 'USD'),
          allocatedAt: new Date(),
          paymentRef: null,
        },
      });
    },
  };
}

function mockOutboxWriter(): IOutboxWriter & { events: OutboxEvent[] } {
  const events: OutboxEvent[] = [];
  return {
    events,
    async write(event: OutboxEvent) {
      events.push(event);
    },
  };
}

function mockWhtCertificateRepo(
  certs: WhtCertificate[] = [makeWhtCertificate()]
): IWhtCertificateRepo {
  return {
    async findById(id: string) {
      return certs.find((c) => c.id === id) ?? null;
    },
    async findByPayee(payeeId: string) {
      return certs.filter((c) => c.payeeId === payeeId);
    },
    async findByPeriod() {
      return certs;
    },
    async findAll() {
      return certs;
    },
    async create() {
      return certs[0]!;
    },
    async updateStatus() {
      return certs[0]!;
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// N2: Supplier Visibility
// ═══════════════════════════════════════════════════════════════════════════

describe('N2: Supplier Visibility', () => {
  it('getSupplierInvoices returns only supplier invoices', async () => {
    const inv1 = makeApInvoice({ id: 'inv-1', supplierId: SUPPLIER_ID });
    const inv2 = makeApInvoice({ id: 'inv-2', supplierId: 'other-supplier' });
    const deps = {
      apInvoiceRepo: mockApInvoiceRepo([inv1, inv2]),
      supplierRepo: mockSupplierRepo(),
    };

    const result = await getSupplierInvoices(
      { tenantId: TENANT_ID, supplierId: SUPPLIER_ID },
      deps
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.data).toHaveLength(1);
      expect(result.value.data[0]!.id).toBe('inv-1');
    }
  });

  it('getSupplierInvoices fails for unknown supplier', async () => {
    const deps = {
      apInvoiceRepo: mockApInvoiceRepo(),
      supplierRepo: mockSupplierRepo(null),
    };

    const result = await getSupplierInvoices({ tenantId: TENANT_ID, supplierId: 'unknown' }, deps);

    expect(result.ok).toBe(false);
  });

  it('getSupplierAging returns aging for supplier invoices only', async () => {
    const unpaidInv = makeApInvoice({
      id: 'inv-1',
      supplierId: SUPPLIER_ID,
      status: 'POSTED',
      dueDate: new Date('2025-01-01'),
    });
    const otherInv = makeApInvoice({
      id: 'inv-2',
      supplierId: 'other',
      status: 'POSTED',
    });
    const deps = {
      apInvoiceRepo: mockApInvoiceRepo([unpaidInv, otherInv]),
      supplierRepo: mockSupplierRepo(),
    };

    const result = await getSupplierAging(
      { tenantId: TENANT_ID, supplierId: SUPPLIER_ID, asOfDate: new Date('2025-06-15') },
      deps
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.rows).toHaveLength(1);
      expect(result.value.rows[0]!.supplierId).toBe(SUPPLIER_ID);
      expect(result.value.totals.total).toBeGreaterThan(0n);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// N3: Supplier Bank Account Self-Maintenance
// ═══════════════════════════════════════════════════════════════════════════

describe('N3: Supplier Bank Account', () => {
  it('supplierAddBankAccount succeeds for active supplier', async () => {
    const outbox = mockOutboxWriter();
    const deps = {
      supplierRepo: mockSupplierRepo(),
      outboxWriter: outbox,
    };

    const result = await supplierAddBankAccount(
      {
        tenantId: TENANT_ID,
        supplierId: SUPPLIER_ID,
        userId: USER_ID,
        bankName: 'First National Bank',
        accountName: 'Test Supplier Trading',
        accountNumber: '1234567890',
        iban: 'ZA93 0000 0000 0000 0000 00',
        swiftBic: 'FIRNZAJJ',
        localBankCode: null,
        currencyCode: 'ZAR',
        isPrimary: true,
      },
      deps
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.bankName).toBe('First National Bank');
      expect(result.value.isPrimary).toBe(true);
    }
    expect(outbox.events).toHaveLength(1);
    expect(outbox.events[0]!.eventType).toBe('SUPPLIER_BANK_ACCOUNT_UPDATED');
  });

  it('supplierAddBankAccount rejects inactive supplier', async () => {
    const deps = {
      supplierRepo: mockSupplierRepo(makeSupplier({ status: 'INACTIVE' })),
      outboxWriter: mockOutboxWriter(),
    };

    const result = await supplierAddBankAccount(
      {
        tenantId: TENANT_ID,
        supplierId: SUPPLIER_ID,
        userId: USER_ID,
        bankName: 'Bank',
        accountName: 'Acc',
        accountNumber: '123',
        iban: null,
        swiftBic: null,
        localBankCode: null,
        currencyCode: 'USD',
        isPrimary: false,
      },
      deps
    );

    expect(result.ok).toBe(false);
  });

  it('supplierAddBankAccount validates IBAN format', async () => {
    const deps = {
      supplierRepo: mockSupplierRepo(),
      outboxWriter: mockOutboxWriter(),
    };

    const result = await supplierAddBankAccount(
      {
        tenantId: TENANT_ID,
        supplierId: SUPPLIER_ID,
        userId: USER_ID,
        bankName: 'Bank',
        accountName: 'Acc',
        accountNumber: '123',
        iban: 'INVALID',
        swiftBic: null,
        localBankCode: null,
        currencyCode: 'USD',
        isPrimary: false,
      },
      deps
    );

    expect(result.ok).toBe(false);
  });

  it('supplierAddBankAccount validates SWIFT/BIC format', async () => {
    const deps = {
      supplierRepo: mockSupplierRepo(),
      outboxWriter: mockOutboxWriter(),
    };

    const result = await supplierAddBankAccount(
      {
        tenantId: TENANT_ID,
        supplierId: SUPPLIER_ID,
        userId: USER_ID,
        bankName: 'Bank',
        accountName: 'Acc',
        accountNumber: '123',
        iban: null,
        swiftBic: 'BAD',
        localBankCode: null,
        currencyCode: 'USD',
        isPrimary: false,
      },
      deps
    );

    expect(result.ok).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// N5: Supplier WHT Certificates
// ═══════════════════════════════════════════════════════════════════════════

describe('N5: Supplier WHT Certificates', () => {
  it('getSupplierWhtCertificates returns only supplier certificates', async () => {
    const cert1 = makeWhtCertificate({ id: 'wht-1', payeeId: SUPPLIER_ID });
    const cert2 = makeWhtCertificate({ id: 'wht-2', payeeId: 'other-supplier' });
    const deps = {
      whtCertificateRepo: mockWhtCertificateRepo([cert1, cert2]),
      supplierRepo: mockSupplierRepo(),
    };

    const result = await getSupplierWhtCertificates(
      { tenantId: TENANT_ID, supplierId: SUPPLIER_ID },
      deps
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(1);
      expect(result.value[0]!.id).toBe('wht-1');
    }
  });

  it('getSupplierWhtCertificateById enforces scope', async () => {
    const cert = makeWhtCertificate({ id: 'wht-1', payeeId: 'other-supplier' });
    const deps = {
      whtCertificateRepo: mockWhtCertificateRepo([cert]),
    };

    const result = await getSupplierWhtCertificateById(
      { tenantId: TENANT_ID, supplierId: SUPPLIER_ID, certificateId: 'wht-1' },
      deps
    );

    expect(result.ok).toBe(false);
  });

  it('getSupplierWhtCertificateById returns cert for correct supplier', async () => {
    const cert = makeWhtCertificate({ id: 'wht-1', payeeId: SUPPLIER_ID });
    const deps = {
      whtCertificateRepo: mockWhtCertificateRepo([cert]),
    };

    const result = await getSupplierWhtCertificateById(
      { tenantId: TENANT_ID, supplierId: SUPPLIER_ID, certificateId: 'wht-1' },
      deps
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.certificateNumber).toBe('WHT-001');
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// N1: Supplier Invoice Submission
// ═══════════════════════════════════════════════════════════════════════════

describe('N1: Supplier Invoice Submission', () => {
  it('supplierSubmitInvoices succeeds for active supplier', async () => {
    const outbox = mockOutboxWriter();
    const deps = {
      apInvoiceRepo: mockApInvoiceRepo(),
      supplierRepo: mockSupplierRepo(),
      outboxWriter: outbox,
    };

    const result = await supplierSubmitInvoices(
      {
        tenantId: TENANT_ID,
        supplierId: SUPPLIER_ID,
        userId: USER_ID,
        rows: [
          {
            companyId: COMPANY_ID,
            ledgerId: LEDGER_ID,
            invoiceNumber: 'SUP-INV-001',
            supplierRef: 'PO-123',
            invoiceDate: '2025-06-01',
            dueDate: '2025-07-01',
            currencyCode: 'USD',
            description: 'Services rendered',
            poRef: 'PO-123',
            receiptRef: null,
            paymentTermsId: null,
            lines: [
              {
                accountId: '00000000-0000-4000-8000-000000000010',
                description: 'Consulting',
                quantity: 1,
                unitPrice: 10000n,
                amount: 10000n,
                taxAmount: 1500n,
              },
            ],
          },
        ],
      },
      deps
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.totalRows).toBe(1);
    }
    expect(outbox.events).toHaveLength(2);
    expect(outbox.events[1]!.eventType).toBe('SUPPLIER_INVOICE_SUBMITTED');
  });

  it('supplierSubmitInvoices rejects inactive supplier', async () => {
    const deps = {
      apInvoiceRepo: mockApInvoiceRepo(),
      supplierRepo: mockSupplierRepo(makeSupplier({ status: 'ON_HOLD' })),
      outboxWriter: mockOutboxWriter(),
    };

    const result = await supplierSubmitInvoices(
      {
        tenantId: TENANT_ID,
        supplierId: SUPPLIER_ID,
        userId: USER_ID,
        rows: [
          {
            companyId: COMPANY_ID,
            ledgerId: LEDGER_ID,
            invoiceNumber: 'INV-X',
            supplierRef: null,
            invoiceDate: '2025-06-01',
            dueDate: '2025-07-01',
            currencyCode: 'USD',
            description: null,
            poRef: null,
            receiptRef: null,
            paymentTermsId: null,
            lines: [
              {
                accountId: 'a1',
                description: null,
                quantity: 1,
                unitPrice: 100n,
                amount: 100n,
                taxAmount: 0n,
              },
            ],
          },
        ],
      },
      deps
    );

    expect(result.ok).toBe(false);
  });

  it('supplierSubmitInvoices rejects empty rows', async () => {
    const deps = {
      apInvoiceRepo: mockApInvoiceRepo(),
      supplierRepo: mockSupplierRepo(),
      outboxWriter: mockOutboxWriter(),
    };

    const result = await supplierSubmitInvoices(
      {
        tenantId: TENANT_ID,
        supplierId: SUPPLIER_ID,
        userId: USER_ID,
        rows: [],
      },
      deps
    );

    expect(result.ok).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// N6: Supplier Profile Update
// ═══════════════════════════════════════════════════════════════════════════

describe('N6: Supplier Profile Update', () => {
  it('supplierUpdateProfile updates allowed fields', async () => {
    const outbox = mockOutboxWriter();
    const deps = {
      supplierRepo: mockSupplierRepo(),
      outboxWriter: outbox,
    };

    const result = await supplierUpdateProfile(
      {
        tenantId: TENANT_ID,
        supplierId: SUPPLIER_ID,
        userId: USER_ID,
        updates: {
          name: 'Updated Supplier Name',
          remittanceEmail: 'new@supplier.com',
        },
      },
      deps
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.name).toBe('Updated Supplier Name');
    }
    expect(outbox.events).toHaveLength(1);
    expect(outbox.events[0]!.eventType).toBe('SUPPLIER_PROFILE_UPDATED');
  });

  it('supplierUpdateProfile rejects empty name', async () => {
    const deps = {
      supplierRepo: mockSupplierRepo(),
      outboxWriter: mockOutboxWriter(),
    };

    const result = await supplierUpdateProfile(
      {
        tenantId: TENANT_ID,
        supplierId: SUPPLIER_ID,
        userId: USER_ID,
        updates: { name: '  ' },
      },
      deps
    );

    expect(result.ok).toBe(false);
  });

  it('supplierUpdateProfile rejects invalid email', async () => {
    const deps = {
      supplierRepo: mockSupplierRepo(),
      outboxWriter: mockOutboxWriter(),
    };

    const result = await supplierUpdateProfile(
      {
        tenantId: TENANT_ID,
        supplierId: SUPPLIER_ID,
        userId: USER_ID,
        updates: { remittanceEmail: 'not-an-email' },
      },
      deps
    );

    expect(result.ok).toBe(false);
  });

  it('supplierUpdateProfile rejects inactive supplier', async () => {
    const deps = {
      supplierRepo: mockSupplierRepo(makeSupplier({ status: 'INACTIVE' })),
      outboxWriter: mockOutboxWriter(),
    };

    const result = await supplierUpdateProfile(
      {
        tenantId: TENANT_ID,
        supplierId: SUPPLIER_ID,
        userId: USER_ID,
        updates: { name: 'New Name' },
      },
      deps
    );

    expect(result.ok).toBe(false);
  });

  it('supplierUpdateProfile is a no-op when no fields provided', async () => {
    const outbox = mockOutboxWriter();
    const deps = {
      supplierRepo: mockSupplierRepo(),
      outboxWriter: outbox,
    };

    const result = await supplierUpdateProfile(
      {
        tenantId: TENANT_ID,
        supplierId: SUPPLIER_ID,
        userId: USER_ID,
        updates: {},
      },
      deps
    );

    expect(result.ok).toBe(true);
    expect(outbox.events).toHaveLength(0);
  });
});
