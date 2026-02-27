import type { IOcrProvider, OcrExtractionResult, OcrFieldEvidence } from '../ports/ocr-provider';

export interface OssOcrConfig {
  readonly sidecarUrl: string;
  readonly timeoutMs: number;
  readonly retryCount: number;
}

interface OssOcrResponse {
  readonly text: string;
  readonly confidence: number;
  readonly fields?: {
    readonly [key: string]: {
      readonly value: string;
      readonly confidence: number;
      readonly bbox?: { x: number; y: number; width: number; height: number };
    };
  };
}

function createEvidence(
  value: string,
  confidence: number,
  bbox?: { x: number; y: number; width: number; height: number }
): OcrFieldEvidence {
  return {
    value,
    confidence,
    source: 'OCR_ENGINE',
    boundingBox: bbox,
  };
}

export class OssOcrProvider implements IOcrProvider {
  readonly name = 'oss-ocr';
  readonly supportedMimeTypes = ['application/pdf', 'image/png', 'image/jpeg'] as const;

  constructor(
    private readonly config: OssOcrConfig = {
      sidecarUrl: process.env.OCR_SIDECAR_URL ?? 'http://localhost:8866/predict/ocr',
      timeoutMs: parseInt(process.env.OCR_TIMEOUT_MS ?? '30000', 10),
      retryCount: parseInt(process.env.OCR_RETRY_COUNT ?? '1', 10),
    }
  ) {}

  async extractInvoice(
    fileBuffer: Buffer,
    mimeType: string,
    options?: { externalRef?: string }
  ): Promise<OcrExtractionResult> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.config.retryCount; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);

        const formData = new FormData();
        const blob = new Blob([fileBuffer], { type: mimeType });
        formData.append('file', blob, 'invoice.pdf');

        const response = await fetch(this.config.sidecarUrl, {
          method: 'POST',
          body: formData,
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!response.ok) {
          throw new Error(`OCR sidecar returned ${response.status}: ${response.statusText}`);
        }

        const data = (await response.json()) as OssOcrResponse;

        return this.parseOcrResponse(data, options?.externalRef);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt < this.config.retryCount) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    }

    throw lastError ?? new Error('OCR extraction failed');
  }

  private parseOcrResponse(data: OssOcrResponse, externalRef?: string): OcrExtractionResult {
    const fields = data.fields ?? {};

    return {
      invoiceNumber: fields.invoice_number
        ? createEvidence(fields.invoice_number.value, fields.invoice_number.confidence, fields.invoice_number.bbox)
        : null,
      invoiceDate: fields.invoice_date
        ? createEvidence(fields.invoice_date.value, fields.invoice_date.confidence, fields.invoice_date.bbox)
        : null,
      dueDate: fields.due_date
        ? createEvidence(fields.due_date.value, fields.due_date.confidence, fields.due_date.bbox)
        : null,
      supplierName: fields.supplier_name
        ? createEvidence(fields.supplier_name.value, fields.supplier_name.confidence, fields.supplier_name.bbox)
        : null,
      supplierTaxId: fields.supplier_tax_id
        ? createEvidence(fields.supplier_tax_id.value, fields.supplier_tax_id.confidence, fields.supplier_tax_id.bbox)
        : null,
      supplierAddress: fields.supplier_address
        ? createEvidence(fields.supplier_address.value, fields.supplier_address.confidence, fields.supplier_address.bbox)
        : null,
      totalAmount: fields.total_amount
        ? createEvidence(fields.total_amount.value, fields.total_amount.confidence, fields.total_amount.bbox)
        : null,
      taxAmount: fields.tax_amount
        ? createEvidence(fields.tax_amount.value, fields.tax_amount.confidence, fields.tax_amount.bbox)
        : null,
      currencyCode: fields.currency_code
        ? createEvidence(fields.currency_code.value, fields.currency_code.confidence, fields.currency_code.bbox)
        : null,
      lineItems: [],
      rawPayload: {
        provider: 'oss-ocr',
        externalRef,
        text: data.text,
        overallConfidence: data.confidence,
        sourcesUsed: ['OCR_ENGINE'],
      },
    };
  }
}
