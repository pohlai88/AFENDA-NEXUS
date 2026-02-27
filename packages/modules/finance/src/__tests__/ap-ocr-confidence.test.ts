import { describe, it, expect } from 'vitest';
import { computeOcrConfidence } from '../slices/ap/services/ocr-confidence-scorer.js';
import type { OcrExtractionResult, OcrFieldEvidence } from '../slices/ap/ports/ocr-provider.js';

function field(value: string, confidence = 0.95, source: 'PDF_TEXT' | 'OCR_ENGINE' | 'MERGED' = 'OCR_ENGINE'): OcrFieldEvidence {
  return { value, confidence, source };
}

function makeExtraction(overrides: Partial<OcrExtractionResult> = {}): OcrExtractionResult {
  return {
    invoiceNumber: field('INV-001'),
    invoiceDate: field('2024-01-15'),
    dueDate: field('2024-02-15'),
    supplierName: field('ACME Corp'),
    supplierTaxId: field('123456789'),
    supplierAddress: field('123 Main St'),
    totalAmount: field('1500.00'),
    taxAmount: field('90.00'),
    currencyCode: field('MYR'),
    lineItems: [
      {
        description: field('Professional Services'),
        quantity: field('1'),
        unitPrice: field('1410.00'),
        amount: field('1410.00'),
      },
    ],
    rawPayload: { provider: 'test' },
    ...overrides,
  };
}

describe('computeOcrConfidence()', () => {
  it('returns HIGH for a fully populated high-confidence extraction', () => {
    const result = computeOcrConfidence(makeExtraction());
    expect(result.level).toBe('HIGH');
    expect(result.score).toBeGreaterThanOrEqual(0.8);
    expect(result.issues).toHaveLength(0);
  });

  it('reports issue when invoice number is missing (critical field)', () => {
    const perfect = computeOcrConfidence(makeExtraction());
    const result = computeOcrConfidence(makeExtraction({ invoiceNumber: null }));
    expect(result.issues).toContain('Invoice number missing or low confidence');
    expect(result.score).toBeLessThan(perfect.score);
  });

  it('returns LOW when currency code is missing (silent killer)', () => {
    const result = computeOcrConfidence(makeExtraction({ currencyCode: null }));
    expect(result.level).toBe('LOW');
    expect(result.issues).toContain('SILENT_KILLER: Currency code missing');
  });

  it('returns MEDIUM for moderate-confidence extraction', () => {
    const result = computeOcrConfidence(
      makeExtraction({
        invoiceNumber: field('INV-001', 0.65),
        totalAmount: field('1500.00', 0.65),
        supplierName: field('ACME', 0.65),
        invoiceDate: field('2024-01-15', 0.65),
        lineItems: [],
      })
    );
    expect(result.level).toBe('MEDIUM');
  });

  it('returns LOW when total amount is missing', () => {
    const result = computeOcrConfidence(makeExtraction({ totalAmount: null }));
    expect(result.issues).toContain('Total amount missing or low confidence');
  });

  it('detects silent killer for missing tax amount when tax field exists', () => {
    const result = computeOcrConfidence(makeExtraction({ taxAmount: field('', 0) }));
    expect(result.issues.some((i) => i.includes('SILENT_KILLER'))).toBe(true);
    expect(result.level).toBe('LOW');
  });

  it('detects missing line items', () => {
    const result = computeOcrConfidence(makeExtraction({ lineItems: [] }));
    expect(result.issues).toContain('No line items extracted');
  });

  it('provides breakdown scores', () => {
    const result = computeOcrConfidence(makeExtraction());
    expect(result.breakdown).toBeDefined();
    expect(result.breakdown.criticalFields).toBeGreaterThan(0);
    expect(result.breakdown.amounts).toBeGreaterThan(0);
    expect(result.breakdown.dates).toBeGreaterThan(0);
    expect(result.breakdown.supplier).toBeGreaterThan(0);
    expect(result.breakdown.lineItems).toBeGreaterThan(0);
  });

  it('accepts optional currencyDecimals context', () => {
    const result = computeOcrConfidence(makeExtraction(), { currencyDecimals: 0 });
    expect(result.level).toBe('HIGH');
  });
});
