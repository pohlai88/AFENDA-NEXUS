export type OcrSource = 'PDF_TEXT' | 'OCR_ENGINE' | 'MERGED';

export interface OcrFieldEvidence {
  readonly value: string;
  readonly confidence: number;
  readonly source: OcrSource;
  readonly boundingBox?: {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
  };
}

export interface OcrExtractionResult {
  readonly invoiceNumber: OcrFieldEvidence | null;
  readonly invoiceDate: OcrFieldEvidence | null;
  readonly dueDate: OcrFieldEvidence | null;
  readonly supplierName: OcrFieldEvidence | null;
  readonly supplierTaxId: OcrFieldEvidence | null;
  readonly supplierAddress: OcrFieldEvidence | null;
  readonly totalAmount: OcrFieldEvidence | null;
  readonly taxAmount: OcrFieldEvidence | null;
  readonly currencyCode: OcrFieldEvidence | null;
  readonly lineItems: ReadonlyArray<{
    readonly description: OcrFieldEvidence | null;
    readonly quantity: OcrFieldEvidence | null;
    readonly unitPrice: OcrFieldEvidence | null;
    readonly amount: OcrFieldEvidence | null;
  }>;
  readonly rawPayload: Record<string, unknown>;
}

export interface IOcrProvider {
  readonly name: string;
  readonly supportedMimeTypes: readonly string[];
  extractInvoice(
    fileBuffer: Buffer,
    mimeType: string,
    options?: { externalRef?: string }
  ): Promise<OcrExtractionResult>;
}
