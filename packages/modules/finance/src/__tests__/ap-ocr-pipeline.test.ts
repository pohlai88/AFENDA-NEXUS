import { describe, it, expect, vi } from 'vitest';
import { uploadOcrInvoice, type OcrPipelineContext, type OcrPipelineDeps } from '../slices/ap/services/ap-ocr-pipeline.js';
import { ok, err, AppError } from '@afenda/core';
import type { IOcrProvider, OcrExtractionResult, OcrFieldEvidence } from '../slices/ap/ports/ocr-provider.js';
import type { IOcrJobRepo, OcrJob, ClaimResult } from '../slices/ap/ports/ocr-job-repo.js';
import type { ISupplierRepo } from '../slices/ap/ports/supplier-repo.js';
import type { IApInvoiceRepo } from '../slices/ap/ports/ap-invoice-repo.js';
import { makeApInvoice } from './helpers.js';

function field(value: string, confidence = 0.95): OcrFieldEvidence {
  return { value, confidence, source: 'OCR_ENGINE' };
}

const highConfidenceExtraction: OcrExtractionResult = {
  invoiceNumber: field('INV-2024-001'),
  invoiceDate: field('2024-01-15'),
  dueDate: field('2024-02-15'),
  supplierName: field('ACME Corporation SDN BHD'),
  supplierTaxId: field('123456789'),
  supplierAddress: field('123 Main St'),
  totalAmount: field('1500.00'),
  taxAmount: field('90.00'),
  currencyCode: field('MYR'),
  lineItems: [
    {
      description: field('Services'),
      quantity: field('1'),
      unitPrice: field('1500.00'),
      amount: field('1500.00'),
    },
  ],
  rawPayload: { provider: 'mock', sourcesUsed: ['OCR_ENGINE'] },
};

function makeContext(overrides: Partial<OcrPipelineContext> = {}): OcrPipelineContext {
  return {
    tenantId: 'tenant-1',
    companyId: 'company-1',
    ledgerId: 'ledger-1',
    defaultAccountId: 'account-1',
    userId: 'user-1',
    ...overrides,
  };
}

function makeOcrJobRepo(): IOcrJobRepo {
  let jobCounter = 0;
  return {
    claimOrGet: vi.fn(async () => {
      jobCounter++;
      return { claimed: true, jobId: `job-${jobCounter}` } as ClaimResult;
    }),
    updateStatus: vi.fn(async () => { }),
    resetForRetry: vi.fn(async () => { }),
    findById: vi.fn(async () => null),
  };
}

function makeOcrProvider(extraction = highConfidenceExtraction): IOcrProvider {
  return {
    name: 'test-provider',
    supportedMimeTypes: ['application/pdf'],
    extractInvoice: vi.fn(async () => extraction),
  };
}

function makeSupplierRepo(): ISupplierRepo {
  return {
    create: vi.fn(async () => err(new AppError('NOT_IMPLEMENTED', ''))),
    findById: vi.fn(async () => err(new AppError('NOT_FOUND', ''))),
    findByCode: vi.fn(async () => err(new AppError('NOT_FOUND', ''))),
    findAll: vi.fn(async () => ({ data: [], total: 0, page: 1, limit: 20 })),
    findByStatus: vi.fn(async () => ({ data: [], total: 0, page: 1, limit: 20 })),
    update: vi.fn(async () => err(new AppError('NOT_FOUND', ''))),
    findByUserId: vi.fn(async () => err(new AppError('NOT_FOUND', ''))),
    findByTaxId: vi.fn(async () => null),
    findByNameNormalized: vi.fn(async () => null),
    addSite: vi.fn(async () => err(new AppError('NOT_IMPLEMENTED', ''))),
    addBankAccount: vi.fn(async () => err(new AppError('NOT_IMPLEMENTED', ''))),
  };
}

function makeApInvoiceRepo(): IApInvoiceRepo {
  const invoice = makeApInvoice();
  return {
    create: vi.fn(async () => ok(invoice)),
    findById: vi.fn(async () => ok(invoice)),
    findAll: vi.fn(async () => ({ data: [invoice], total: 1, page: 1, limit: 20 })),
    findByStatus: vi.fn(async () => ({ data: [], total: 0, page: 1, limit: 20 })),
    findBySupplier: vi.fn(async () => ({ data: [], total: 0, page: 1, limit: 20 })),
    updateStatus: vi.fn(async () => ok(invoice)),
    update: vi.fn(async () => ok(invoice)),
    findBySupplierId: vi.fn(async () => ({ data: [], total: 0, page: 1, limit: 20 })),
    findByDateRange: vi.fn(async () => ({ data: [], total: 0, page: 1, limit: 20 })),
  } as unknown as IApInvoiceRepo;
}

function makeDeps(overrides: Partial<OcrPipelineDeps> = {}): OcrPipelineDeps {
  return {
    ocrProvider: makeOcrProvider(),
    ocrJobRepo: makeOcrJobRepo(),
    supplierRepo: makeSupplierRepo(),
    apInvoiceRepo: makeApInvoiceRepo(),
    r2Storage: { put: vi.fn(async () => { }) },
    outboxWriter: { write: vi.fn(async () => { }) },
    ...overrides,
  };
}

describe('uploadOcrInvoice()', () => {
  const fileBuffer = Buffer.from('fake-pdf-content');
  const mimeType = 'application/pdf';

  it('claims job, extracts, scores, and creates invoice', async () => {
    const deps = makeDeps();
    const result = await uploadOcrInvoice(fileBuffer, mimeType, makeContext(), deps);

    expect(result.status).toBe('COMPLETED');
    expect(result.jobId).toBeDefined();
    expect(result.invoiceId).toBeDefined();
    expect(result.confidence).toBeDefined();
    expect(result.errorReason).toBeNull();
  });

  it('returns existing completed job without re-processing (idempotency)', async () => {
    const existingJob: OcrJob = {
      id: 'existing-job',
      tenantId: 'tenant-1',
      checksum: 'abc',
      fileSize: 100,
      mimeType: 'application/pdf',
      status: 'COMPLETED',
      storageKey: 'ocr/tenant-1/existing-job',
      providerName: 'test',
      externalRef: null,
      confidence: 'HIGH',
      invoiceId: 'existing-invoice',
      errorReason: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const ocrJobRepo = makeOcrJobRepo();
    ocrJobRepo.claimOrGet = vi.fn(async (): Promise<ClaimResult> => ({
      claimed: false as const,
      existing: existingJob,
    }));

    const deps = makeDeps({ ocrJobRepo });
    const result = await uploadOcrInvoice(fileBuffer, mimeType, makeContext(), deps);

    expect(result.status).toBe('COMPLETED');
    expect(result.jobId).toBe('existing-job');
    expect(result.invoiceId).toBe('existing-invoice');
    expect(deps.ocrProvider.extractInvoice).not.toHaveBeenCalled();
  });

  it('returns failed job without retry when forceRetry is false', async () => {
    const failedJob: OcrJob = {
      id: 'failed-job',
      tenantId: 'tenant-1',
      checksum: 'abc',
      fileSize: 100,
      mimeType: 'application/pdf',
      status: 'FAILED',
      storageKey: null,
      providerName: null,
      externalRef: null,
      confidence: null,
      invoiceId: null,
      errorReason: 'PROVIDER_TIMEOUT',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const ocrJobRepo = makeOcrJobRepo();
    ocrJobRepo.claimOrGet = vi.fn(async (): Promise<ClaimResult> => ({
      claimed: false as const,
      existing: failedJob,
    }));

    const deps = makeDeps({ ocrJobRepo });
    const result = await uploadOcrInvoice(fileBuffer, mimeType, makeContext(), deps);

    expect(result.status).toBe('FAILED');
    expect(result.errorReason).toBe('PROVIDER_TIMEOUT');
  });

  it('retries failed job when forceRetry is true', async () => {
    const failedJob: OcrJob = {
      id: 'failed-job',
      tenantId: 'tenant-1',
      checksum: 'abc',
      fileSize: 100,
      mimeType: 'application/pdf',
      status: 'FAILED',
      storageKey: null,
      providerName: null,
      externalRef: null,
      confidence: null,
      invoiceId: null,
      errorReason: 'PROVIDER_TIMEOUT',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const ocrJobRepo = makeOcrJobRepo();
    ocrJobRepo.claimOrGet = vi.fn(async (): Promise<ClaimResult> => ({
      claimed: false as const,
      existing: failedJob,
    }));

    const deps = makeDeps({ ocrJobRepo });
    const result = await uploadOcrInvoice(
      fileBuffer,
      mimeType,
      makeContext({ forceRetry: true }),
      deps
    );

    expect(ocrJobRepo.resetForRetry).toHaveBeenCalledWith('failed-job');
    expect(result.status).toBe('COMPLETED');
  });

  it('uploads file to R2 storage', async () => {
    const deps = makeDeps();
    await uploadOcrInvoice(fileBuffer, mimeType, makeContext(), deps);
    expect(deps.r2Storage.put).toHaveBeenCalled();
  });

  it('writes outbox events', async () => {
    const deps = makeDeps();
    await uploadOcrInvoice(fileBuffer, mimeType, makeContext(), deps);
    expect(deps.outboxWriter.write).toHaveBeenCalled();
  });

  it('transitions through state machine statuses', async () => {
    const deps = makeDeps();
    await uploadOcrInvoice(fileBuffer, mimeType, makeContext(), deps);

    const updateCalls = (deps.ocrJobRepo.updateStatus as ReturnType<typeof vi.fn>).mock.calls;
    const statuses = updateCalls.map((c: unknown[]) => c[1]);
    expect(statuses).toContain('UPLOADED');
    expect(statuses).toContain('EXTRACTING');
    expect(statuses).toContain('SCORED');
    expect(statuses).toContain('INVOICE_CREATING');
    expect(statuses).toContain('COMPLETED');
  });

  it('marks job FAILED when extraction throws', async () => {
    const ocrProvider = makeOcrProvider();
    ocrProvider.extractInvoice = vi.fn(async () => {
      throw new Error('OCR engine down');
    });

    const deps = makeDeps({ ocrProvider });

    await expect(
      uploadOcrInvoice(fileBuffer, mimeType, makeContext(), deps)
    ).rejects.toThrow('OCR engine down');

    const updateCalls = (deps.ocrJobRepo.updateStatus as ReturnType<typeof vi.fn>).mock.calls;
    const failCall = updateCalls.find((c: unknown[]) => c[1] === 'FAILED');
    expect(failCall).toBeDefined();
  });

  it('resolves supplier by tax ID when available', async () => {
    const supplierRepo = makeSupplierRepo();
    supplierRepo.findByTaxId = vi.fn(async () => ({
      id: 'resolved-supplier',
      tenantId: 'tenant-1',
      companyId: 'company-1',
      code: 'SUP-001',
      name: 'ACME Corp',
      taxId: '123456789',
      currencyCode: 'MYR',
      defaultPaymentTermsId: null,
      defaultPaymentMethod: null,
      whtRateId: null,
      remittanceEmail: null,
      status: 'ACTIVE' as const,
      sites: [],
      bankAccounts: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const deps = makeDeps({ supplierRepo });
    await uploadOcrInvoice(fileBuffer, mimeType, makeContext(), deps);

    expect(supplierRepo.findByTaxId).toHaveBeenCalledWith('tenant-1', '123456789');
  });

  it('computes SHA-256 checksum for idempotency', async () => {
    const ocrJobRepo = makeOcrJobRepo();
    const deps = makeDeps({ ocrJobRepo });
    await uploadOcrInvoice(fileBuffer, mimeType, makeContext(), deps);

    expect(ocrJobRepo.claimOrGet).toHaveBeenCalledWith(
      'tenant-1',
      expect.stringMatching(/^[a-f0-9]{64}$/),
      expect.objectContaining({ fileSize: fileBuffer.length, mimeType: 'application/pdf' })
    );
  });

  it('creates INCOMPLETE invoice for LOW confidence extraction', async () => {
    const lowConfExtraction: OcrExtractionResult = {
      invoiceNumber: null,
      invoiceDate: null,
      dueDate: null,
      supplierName: null,
      supplierTaxId: null,
      supplierAddress: null,
      totalAmount: null,
      taxAmount: null,
      currencyCode: null,
      lineItems: [],
      rawPayload: { provider: 'test', sourcesUsed: [] },
    };

    const ocrProvider = makeOcrProvider(lowConfExtraction);
    const apInvoiceRepo = makeApInvoiceRepo();
    const deps = makeDeps({ ocrProvider, apInvoiceRepo });
    const result = await uploadOcrInvoice(fileBuffer, mimeType, makeContext(), deps);

    expect(result.confidence).toBe('LOW');
    expect(apInvoiceRepo.updateStatus).toHaveBeenCalledWith(
      expect.any(String),
      'INCOMPLETE'
    );
  });

  it('emits AP_OCR_EXTRACTION_FAILED event on failure', async () => {
    const ocrProvider = makeOcrProvider();
    ocrProvider.extractInvoice = vi.fn(async () => {
      throw new Error('Provider timeout');
    });

    const deps = makeDeps({ ocrProvider });

    await expect(
      uploadOcrInvoice(fileBuffer, mimeType, makeContext(), deps)
    ).rejects.toThrow();

    const writeCalls = (deps.outboxWriter.write as ReturnType<typeof vi.fn>).mock.calls;
    const failEvent = writeCalls.find(
      (c: unknown[]) => (c[0] as { eventType: string }).eventType === 'AP_OCR_EXTRACTION_FAILED'
    );
    expect(failEvent).toBeDefined();
  });

  it('resolves supplier by normalized name when tax ID not found', async () => {
    const supplierRepo = makeSupplierRepo();
    supplierRepo.findByTaxId = vi.fn(async () => null);
    supplierRepo.findByNameNormalized = vi.fn(async () => ({
      id: 'name-resolved-supplier',
      tenantId: 'tenant-1',
      companyId: 'company-1',
      code: 'SUP-002',
      name: 'ACME Corporation SDN BHD',
      taxId: null,
      currencyCode: 'MYR',
      defaultPaymentTermsId: null,
      defaultPaymentMethod: null,
      whtRateId: null,
      remittanceEmail: null,
      status: 'ACTIVE' as const,
      sites: [],
      bankAccounts: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const deps = makeDeps({ supplierRepo });
    await uploadOcrInvoice(fileBuffer, mimeType, makeContext(), deps);

    expect(supplierRepo.findByTaxId).toHaveBeenCalled();
    expect(supplierRepo.findByNameNormalized).toHaveBeenCalled();
  });

  it('marks job FAILED when R2 upload fails (no Boundary B)', async () => {
    const r2Storage = {
      put: vi.fn(async () => { throw new Error('R2 unavailable'); }),
    };

    const deps = makeDeps({ r2Storage });

    await expect(
      uploadOcrInvoice(fileBuffer, mimeType, makeContext(), deps)
    ).rejects.toThrow('R2 unavailable');

    const updateCalls = (deps.ocrJobRepo.updateStatus as ReturnType<typeof vi.fn>).mock.calls;
    const failCall = updateCalls.find((c: unknown[]) => c[1] === 'FAILED');
    expect(failCall).toBeDefined();

    // Should NOT have reached Boundary B (INVOICE_CREATING)
    const invoiceCreatingCall = updateCalls.find((c: unknown[]) => c[1] === 'INVOICE_CREATING');
    expect(invoiceCreatingCall).toBeUndefined();
  });

  it('writes failure.json to R2 on pipeline error', async () => {
    const ocrProvider = makeOcrProvider();
    ocrProvider.extractInvoice = vi.fn(async () => {
      throw new Error('extraction failed');
    });

    const r2Storage = { put: vi.fn(async () => { }) };
    const deps = makeDeps({ ocrProvider, r2Storage });

    await expect(
      uploadOcrInvoice(fileBuffer, mimeType, makeContext(), deps)
    ).rejects.toThrow('extraction failed');

    const r2Calls = r2Storage.put.mock.calls;
    const failureWrite = r2Calls.find(
      (c: unknown[]) => (c[0] as string).endsWith('.failure.json')
    );
    expect(failureWrite).toBeDefined();
  });
});
