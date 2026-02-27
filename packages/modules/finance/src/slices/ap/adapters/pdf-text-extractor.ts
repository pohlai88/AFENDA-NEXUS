import type { OcrFieldEvidence } from '../ports/ocr-provider';

export interface PdfTextExtractionResult {
  readonly text: string;
  readonly parseQualityScore: number;
  readonly fields: {
    readonly invoiceNumber: OcrFieldEvidence | null;
    readonly invoiceDate: OcrFieldEvidence | null;
    readonly dueDate: OcrFieldEvidence | null;
    readonly supplierName: OcrFieldEvidence | null;
    readonly supplierTaxId: OcrFieldEvidence | null;
    readonly totalAmount: OcrFieldEvidence | null;
    readonly taxAmount: OcrFieldEvidence | null;
    readonly currencyCode: OcrFieldEvidence | null;
  };
}

function computeParseQualityScore(text: string): number {
  let score = 0;

  if (text.length > 200) score += 0.3;

  const datePattern = /\d{1,2}[/-]\d{1,2}[/-]\d{2,4}/;
  if (datePattern.test(text)) score += 0.2;

  const amountPattern = /[\d,]+\.\d{2}/;
  if (amountPattern.test(text)) score += 0.3;

  if (/invoice/i.test(text)) score += 0.2;

  return score;
}

function extractField(
  text: string,
  pattern: RegExp,
  confidence: number
): OcrFieldEvidence | null {
  const match = text.match(pattern);
  if (!match) return null;

  return {
    value: match[1]?.trim() ?? match[0].trim(),
    confidence,
    source: 'PDF_TEXT',
  };
}

export interface PdfParser {
  (buffer: Buffer): Promise<{ text: string }>;
}

let pdfParser: PdfParser | null = null;

export function setPdfParser(parser: PdfParser): void {
  pdfParser = parser;
}

export async function extractPdfText(fileBuffer: Buffer): Promise<PdfTextExtractionResult> {
  let text = '';

  if (!pdfParser) {
    return {
      text: '',
      parseQualityScore: 0,
      fields: {
        invoiceNumber: null,
        invoiceDate: null,
        dueDate: null,
        supplierName: null,
        supplierTaxId: null,
        totalAmount: null,
        taxAmount: null,
        currencyCode: null,
      },
    };
  }

  try {
    const data = await pdfParser(fileBuffer);
    text = data.text;
  } catch {
    return {
      text: '',
      parseQualityScore: 0,
      fields: {
        invoiceNumber: null,
        invoiceDate: null,
        dueDate: null,
        supplierName: null,
        supplierTaxId: null,
        totalAmount: null,
        taxAmount: null,
        currencyCode: null,
      },
    };
  }

  const parseQualityScore = computeParseQualityScore(text);

  const invoiceNumber = extractField(
    text,
    /(?:invoice|inv)[\s#:]*([A-Z0-9-]+)/i,
    0.7
  );

  const invoiceDate = extractField(
    text,
    /(?:invoice date|date)[\s:]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i,
    0.7
  );

  const dueDate = extractField(
    text,
    /(?:due date|payment due)[\s:]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i,
    0.6
  );

  const totalAmount = extractField(
    text,
    /(?:total|amount due)[\s:]*([0-9,]+\.\d{2})/i,
    0.7
  );

  const taxAmount = extractField(
    text,
    /(?:tax|gst|vat)[\s:]*([0-9,]+\.\d{2})/i,
    0.6
  );

  const currencyCode = extractField(
    text,
    /\b(USD|EUR|GBP|MYR|SGD|THB|IDR|PHP|VND)\b/,
    0.8
  );

  const lines = text.split('\n');
  const firstLine = lines[0];
  const supplierName = firstLine && firstLine.trim().length > 0
    ? {
      value: firstLine.trim(),
      confidence: 0.5,
      source: 'PDF_TEXT' as const,
    }
    : null;

  const taxIdMatch = text.match(/(?:tax id|tin|gst)[\s:]*([A-Z0-9-]+)/i);
  const taxIdValue = taxIdMatch?.[1];
  const supplierTaxId = taxIdValue
    ? {
      value: taxIdValue.trim(),
      confidence: 0.6,
      source: 'PDF_TEXT' as const,
    }
    : null;

  return {
    text,
    parseQualityScore,
    fields: {
      invoiceNumber,
      invoiceDate,
      dueDate,
      supplierName,
      supplierTaxId,
      totalAmount,
      taxAmount,
      currencyCode,
    },
  };
}
