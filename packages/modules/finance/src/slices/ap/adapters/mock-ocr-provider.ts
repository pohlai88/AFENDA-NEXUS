import type { IOcrProvider, OcrExtractionResult, OcrFieldEvidence } from '../ports/ocr-provider';

export interface MockOcrConfig {
  readonly shouldFail?: boolean;
  readonly failureMessage?: string;
  readonly extractionResult?: Partial<OcrExtractionResult>;
}

function createEvidence(value: string, confidence = 0.95): OcrFieldEvidence {
  return {
    value,
    confidence,
    source: 'OCR_ENGINE',
  };
}

export class MockOcrProvider implements IOcrProvider {
  readonly name = 'mock-ocr';
  readonly supportedMimeTypes = ['application/pdf', 'image/png', 'image/jpeg'] as const;

  constructor(private readonly config: MockOcrConfig = {}) {}

  async extractInvoice(
    _fileBuffer: Buffer,
    _mimeType: string,
    options?: { externalRef?: string }
  ): Promise<OcrExtractionResult> {
    if (this.config.shouldFail) {
      throw new Error(this.config.failureMessage ?? 'Mock OCR provider failure');
    }

    const defaultResult: OcrExtractionResult = {
      invoiceNumber: createEvidence('INV-2024-001'),
      invoiceDate: createEvidence('2024-01-15'),
      dueDate: createEvidence('2024-02-15'),
      supplierName: createEvidence('ACME Corporation SDN BHD'),
      supplierTaxId: createEvidence('123456789'),
      supplierAddress: createEvidence('123 Main St, Kuala Lumpur'),
      totalAmount: createEvidence('1500.00'),
      taxAmount: createEvidence('90.00'),
      currencyCode: createEvidence('MYR'),
      lineItems: [
        {
          description: createEvidence('Professional Services'),
          quantity: createEvidence('1'),
          unitPrice: createEvidence('1410.00'),
          amount: createEvidence('1410.00'),
        },
      ],
      rawPayload: {
        provider: 'mock-ocr',
        externalRef: options?.externalRef,
        sourcesUsed: ['OCR_ENGINE'],
      },
    };

    return {
      ...defaultResult,
      ...this.config.extractionResult,
    };
  }
}
