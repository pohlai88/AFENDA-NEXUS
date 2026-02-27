import type { IOcrProvider, OcrExtractionResult, OcrFieldEvidence } from '../ports/ocr-provider';
import { extractPdfText } from './pdf-text-extractor';

function mergeEvidence(
  pdfField: OcrFieldEvidence | null,
  ocrField: OcrFieldEvidence | null,
  preferPdf: boolean
): OcrFieldEvidence | null {
  if (!pdfField && !ocrField) return null;
  if (!pdfField) return ocrField;
  if (!ocrField) return pdfField;

  if (preferPdf && pdfField.confidence >= 0.7) {
    return { ...pdfField, source: 'MERGED' };
  }

  if (ocrField.confidence > pdfField.confidence) {
    return { ...ocrField, source: 'MERGED' };
  }

  return { ...pdfField, source: 'MERGED' };
}

export class HybridInvoiceExtractProvider implements IOcrProvider {
  readonly name = 'hybrid-ocr';
  readonly supportedMimeTypes: readonly string[];

  constructor(private readonly ocrProvider: IOcrProvider) {
    this.supportedMimeTypes = ocrProvider.supportedMimeTypes;
  }

  async extractInvoice(
    fileBuffer: Buffer,
    mimeType: string,
    options?: { externalRef?: string }
  ): Promise<OcrExtractionResult> {
    const isPdf = mimeType === 'application/pdf';

    let pdfResult: Awaited<ReturnType<typeof extractPdfText>> | null = null;
    let ocrResult: OcrExtractionResult | null = null;

    if (isPdf) {
      try {
        pdfResult = await extractPdfText(fileBuffer);
      } catch {
        pdfResult = null;
      }
    }

    try {
      ocrResult = await this.ocrProvider.extractInvoice(fileBuffer, mimeType, options);
    } catch (error) {
      if (!pdfResult || pdfResult.parseQualityScore < 0.7) {
        throw error;
      }
    }

    if (!isPdf || !pdfResult) {
      if (!ocrResult) {
        throw new Error('Both PDF extraction and OCR failed');
      }
      return {
        ...ocrResult,
        rawPayload: {
          ...ocrResult.rawPayload,
          sourcesUsed: ['OCR_ENGINE'],
        },
      };
    }

    const preferPdf = pdfResult.parseQualityScore > 0.7;

    if (!ocrResult) {
      return {
        invoiceNumber: pdfResult.fields.invoiceNumber,
        invoiceDate: pdfResult.fields.invoiceDate,
        dueDate: pdfResult.fields.dueDate,
        supplierName: pdfResult.fields.supplierName,
        supplierTaxId: pdfResult.fields.supplierTaxId,
        supplierAddress: null,
        totalAmount: pdfResult.fields.totalAmount,
        taxAmount: pdfResult.fields.taxAmount,
        currencyCode: pdfResult.fields.currencyCode,
        lineItems: [],
        rawPayload: {
          provider: 'hybrid-ocr',
          externalRef: options?.externalRef,
          sourcesUsed: ['PDF_TEXT'],
          pdfTextStats: {
            textLength: pdfResult.text.length,
            parseQualityScore: pdfResult.parseQualityScore,
          },
        },
      };
    }

    return {
      invoiceNumber: mergeEvidence(
        pdfResult.fields.invoiceNumber,
        ocrResult.invoiceNumber,
        preferPdf
      ),
      invoiceDate: mergeEvidence(pdfResult.fields.invoiceDate, ocrResult.invoiceDate, preferPdf),
      dueDate: mergeEvidence(pdfResult.fields.dueDate, ocrResult.dueDate, preferPdf),
      supplierName: mergeEvidence(
        pdfResult.fields.supplierName,
        ocrResult.supplierName,
        preferPdf
      ),
      supplierTaxId: mergeEvidence(
        pdfResult.fields.supplierTaxId,
        ocrResult.supplierTaxId,
        preferPdf
      ),
      supplierAddress: ocrResult.supplierAddress,
      totalAmount: mergeEvidence(pdfResult.fields.totalAmount, ocrResult.totalAmount, preferPdf),
      taxAmount: mergeEvidence(pdfResult.fields.taxAmount, ocrResult.taxAmount, preferPdf),
      currencyCode: mergeEvidence(
        pdfResult.fields.currencyCode,
        ocrResult.currencyCode,
        preferPdf
      ),
      lineItems: ocrResult.lineItems,
      rawPayload: {
        provider: 'hybrid-ocr',
        externalRef: options?.externalRef,
        sourcesUsed: preferPdf ? ['PDF_TEXT', 'OCR_ENGINE'] : ['OCR_ENGINE', 'PDF_TEXT'],
        pdfTextStats: {
          textLength: pdfResult.text.length,
          parseQualityScore: pdfResult.parseQualityScore,
        },
        ocrStats: ocrResult.rawPayload,
      },
    };
  }
}
