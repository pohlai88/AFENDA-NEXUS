import crypto from 'crypto';
import { AppError, toMinorUnits } from '@afenda/core';
import type { IApInvoiceRepo, CreateApInvoiceInput } from '../ports/ap-invoice-repo.js';
import type { ISupplierRepo } from '../ports/supplier-repo.js';
import type { IOcrProvider } from '../ports/ocr-provider.js';
import type { IOcrJobRepo, OcrConfidenceLevel } from '../ports/ocr-job-repo.js';
import type { IInvoiceAttachmentRepo } from '../entities/invoice-attachment.js';
import { computeOcrConfidence, type OcrScorerContext } from './ocr-confidence-scorer.js';
import { resolveSupplier } from './ocr-supplier-resolver.js';
import { FinanceEventType } from '../../../shared/events.js';

export interface OcrPipelineContext {
  readonly tenantId: string;
  readonly companyId: string;
  readonly ledgerId: string;
  readonly defaultAccountId: string;
  readonly userId: string;
  readonly forceRetry?: boolean;
  readonly currencyDecimals?: number;
}

export interface OcrPipelineResult {
  readonly jobId: string;
  readonly invoiceId: string | null;
  readonly status: string;
  readonly confidence: OcrConfidenceLevel | null;
  readonly errorReason: string | null;
}

export interface R2Storage {
  put(key: string, data: Buffer | string): Promise<void>;
}

export interface OutboxWriter {
  write(event: {
    tenantId: string;
    eventType: string;
    payload: Record<string, unknown>;
  }): Promise<void>;
}

export interface OcrPipelineDeps {
  readonly ocrProvider: IOcrProvider;
  readonly ocrJobRepo: IOcrJobRepo;
  readonly supplierRepo: ISupplierRepo;
  readonly apInvoiceRepo: IApInvoiceRepo;
  readonly invoiceAttachmentRepo?: IInvoiceAttachmentRepo;
  readonly r2Storage: R2Storage;
  readonly outboxWriter: OutboxWriter;
}

export async function uploadOcrInvoice(
  fileBuffer: Buffer,
  mimeType: string,
  context: OcrPipelineContext,
  deps: OcrPipelineDeps
): Promise<OcrPipelineResult> {
  const checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');
  const fileSize = fileBuffer.length;

  const claimResult = await deps.ocrJobRepo.claimOrGet(context.tenantId, checksum, {
    fileSize,
    mimeType,
  });

  if (!claimResult.claimed) {
    const existing = claimResult.existing;

    if (existing.status === 'COMPLETED') {
      return {
        jobId: existing.id,
        invoiceId: existing.invoiceId,
        status: 'COMPLETED',
        confidence: existing.confidence,
        errorReason: null,
      };
    }

    if (existing.status === 'FAILED') {
      if (!context.forceRetry) {
        return {
          jobId: existing.id,
          invoiceId: null,
          status: 'FAILED',
          confidence: null,
          errorReason: existing.errorReason ?? 'Unknown error',
        };
      }
      await deps.ocrJobRepo.resetForRetry(existing.id);
    } else {
      return {
        jobId: existing.id,
        invoiceId: existing.invoiceId,
        status: existing.status,
        confidence: existing.confidence,
        errorReason: null,
      };
    }
  }

  const jobId = claimResult.claimed ? claimResult.jobId : claimResult.existing.id;

  try {
    const storageKey = `ocr/${context.tenantId}/${jobId}`;
    await deps.r2Storage.put(storageKey, fileBuffer);
    await deps.ocrJobRepo.updateStatus(jobId, 'UPLOADED', { storageKey });

    const extraction = await deps.ocrProvider.extractInvoice(fileBuffer, mimeType);
    await deps.ocrJobRepo.updateStatus(jobId, 'EXTRACTING', {
      providerName: deps.ocrProvider.name,
    });

    await deps.r2Storage.put(
      `${storageKey}.meta.json`,
      JSON.stringify(extraction.rawPayload)
    );

    const scorerContext: OcrScorerContext = {
      currencyDecimals: context.currencyDecimals,
    };
    const score = computeOcrConfidence(extraction, scorerContext);

    await deps.ocrJobRepo.updateStatus(jobId, 'SCORED', { confidence: score.level });

    const supplierResolution = await resolveSupplier(
      context.tenantId,
      extraction,
      deps.supplierRepo
    );

    await deps.outboxWriter.write({
      tenantId: context.tenantId,
      eventType: FinanceEventType.AP_OCR_REQUESTED,
      payload: {
        jobId,
        storageKey,
        providerName: deps.ocrProvider.name,
        confidence: score.level,
        sourcesUsed: extraction.rawPayload.sourcesUsed as unknown as string,
      },
    });

    await deps.ocrJobRepo.updateStatus(jobId, 'INVOICE_CREATING');

    const invoiceId = await createInvoiceFromExtraction(
      context,
      extraction,
      score.level,
      supplierResolution.supplierId,
      jobId,
      storageKey,
      fileSize,
      deps
    );

    await deps.ocrJobRepo.updateStatus(jobId, 'COMPLETED', { invoiceId });

    return {
      jobId,
      invoiceId,
      status: 'COMPLETED',
      confidence: score.level,
      errorReason: null,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await deps.ocrJobRepo.updateStatus(jobId, 'FAILED', {
      errorReason: 'INTERNAL_ERROR',
    });

    // Write failure metadata to R2 if storageKey exists
    const failStorageKey = `ocr/${context.tenantId}/${jobId}`;
    try {
      await deps.r2Storage.put(
        `${failStorageKey}.failure.json`,
        JSON.stringify({ jobId, errorMessage, failedAt: new Date().toISOString() })
      );
    } catch {
      // R2 write failure is non-critical; don't mask original error
    }

    await deps.outboxWriter.write({
      tenantId: context.tenantId,
      eventType: FinanceEventType.AP_OCR_EXTRACTION_FAILED,
      payload: {
        jobId,
        reasonCode: 'INTERNAL_ERROR',
        errorMessage,
        providerName: deps.ocrProvider.name,
        storageKey: failStorageKey,
      },
    });

    throw error;
  }
}

async function createInvoiceFromExtraction(
  context: OcrPipelineContext,
  extraction: Awaited<ReturnType<IOcrProvider['extractInvoice']>>,
  confidence: OcrConfidenceLevel,
  supplierId: string | null,
  jobId: string,
  storageKey: string,
  fileSizeBytes: number,
  deps: OcrPipelineDeps
): Promise<string> {
  const invoiceNumber = extraction.invoiceNumber?.value ?? `OCR-${jobId.substring(0, 8)}`;
  const invoiceDate = extraction.invoiceDate?.value
    ? new Date(extraction.invoiceDate.value)
    : new Date();
  const dueDate = extraction.dueDate?.value ? new Date(extraction.dueDate.value) : new Date();
  const currencyCode = extraction.currencyCode?.value ?? 'USD';
  const parsedAmount = extraction.totalAmount?.value
    ? Number(extraction.totalAmount.value.replace(/,/g, ''))
    : 0;
  const totalAmount = parsedAmount > 0 ? toMinorUnits(parsedAmount, currencyCode) : 0n;

  const initialStatus = confidence === 'HIGH' ? 'DRAFT' : 'INCOMPLETE';

  // Step 10: Soft duplicate detection — advisory, never blocks creation
  let possibleDuplicate = false;
  if (supplierId && invoiceNumber) {
    try {
      const existing = await deps.apInvoiceRepo.findAll({
        tenantId: context.tenantId,
        supplierId,
        page: 1,
        limit: 10,
      } as Parameters<typeof deps.apInvoiceRepo.findAll>[0]);
      possibleDuplicate = existing.data.some(
        (inv) => inv.invoiceNumber === invoiceNumber
      );
    } catch {
      // Duplicate check is advisory; don't fail pipeline
    }
  }

  const createInput: CreateApInvoiceInput = {
    tenantId: context.tenantId,
    companyId: context.companyId,
    supplierId: supplierId ?? context.companyId,
    ledgerId: context.ledgerId,
    invoiceNumber,
    supplierRef: null,
    invoiceDate,
    dueDate,
    currencyCode,
    description: `OCR extracted invoice (${confidence} confidence)`,
    poRef: null,
    receiptRef: null,
    paymentTermsId: null,
    lines: [
      {
        accountId: context.defaultAccountId,
        description: 'OCR extracted line',
        quantity: 1,
        unitPrice: totalAmount,
        amount: totalAmount,
        taxAmount: 0n,
        whtIncomeType: null,
      },
    ],
  };

  const created = await deps.apInvoiceRepo.create(createInput);
  if (!created.ok) {
    throw new AppError('INVOICE_CREATE_FAILED', created.error.message);
  }

  if (initialStatus === 'INCOMPLETE') {
    await deps.apInvoiceRepo.updateStatus(created.value.id, 'INCOMPLETE');
  }

  if (deps.invoiceAttachmentRepo) {
    await deps.invoiceAttachmentRepo.attach({
      tenantId: context.tenantId,
      invoiceId: created.value.id,
      storageKey,
      fileName: `invoice-${invoiceNumber}.pdf`,
      mimeType: 'application/pdf',
      fileSizeBytes,
      uploadedBy: context.userId,
    });
  }

  await deps.outboxWriter.write({
    tenantId: context.tenantId,
    eventType: FinanceEventType.AP_OCR_INVOICE_RECEIVED,
    payload: {
      jobId,
      invoiceId: created.value.id,
      confidence,
      possibleDuplicate,
    },
  });

  return created.value.id;
}
