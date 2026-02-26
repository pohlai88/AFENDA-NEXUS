import { describe, it, expect } from 'vitest';
import { buildEInvoice, type EInvoiceInput, type EInvoiceParty } from '../e-invoice-builder.js';

const supplier: EInvoiceParty = {
  name: 'Acme Sdn Bhd',
  taxId: 'C12345678',
  registrationNumber: '202001234567',
  address: {
    street: '123 Jalan Ampang',
    city: 'Kuala Lumpur',
    postalCode: '50450',
    countryCode: 'MY',
  },
};

const buyer: EInvoiceParty = {
  name: 'Buyer Corp',
  taxId: 'B98765432',
  address: {
    street: '456 Orchard Road',
    city: 'Singapore',
    postalCode: '238879',
    countryCode: 'SG',
  },
};

const baseLine = {
  lineNumber: 1,
  description: 'Consulting Services',
  quantity: 10000n,
  unitPrice: 100_00n,
  lineTotal: 100_00n,
  taxCode: 'SR',
  taxRateBps: 600,
  taxAmount: 6_00n,
  classificationCode: '62021',
};

const baseInput: EInvoiceInput = {
  format: 'MY_MYINVOIS',
  documentType: 'INVOICE',
  invoiceNumber: 'INV-2025-001',
  issueDate: '2025-12-15',
  dueDate: '2026-01-14',
  currencyCode: 'MYR',
  supplier,
  buyer,
  lineItems: [baseLine],
  totalExcludingTax: 100_00n,
  totalTax: 6_00n,
  totalIncludingTax: 106_00n,
};

describe('buildEInvoice', () => {
  describe('MyInvois (Malaysia)', () => {
    it('generates valid UBL XML', () => {
      const { result } = buildEInvoice(baseInput);

      expect(result.format).toBe('MY_MYINVOIS');
      expect(result.xml).toContain('urn:myinvois.hasil.gov.my');
      expect(result.xml).toContain('INV-2025-001');
      expect(result.xml).toContain('Acme Sdn Bhd');
      expect(result.xml).toContain('Buyer Corp');
      expect(result.xml).toContain('Consulting Services');
    });

    it('requires digital signature', () => {
      const { result } = buildEInvoice(baseInput);
      expect(result.digitalSignatureRequired).toBe(true);
      expect(result.qrCodeRequired).toBe(true);
    });

    it('returns MyInvois submission endpoint', () => {
      const { result } = buildEInvoice(baseInput);
      expect(result.submissionEndpoint).toContain('myinvois.hasil.gov.my');
    });

    it('validates supplier SSM registration', () => {
      const { result } = buildEInvoice({
        ...baseInput,
        supplier: { ...supplier, registrationNumber: undefined },
      });
      expect(result.validationErrors).toContain(
        'MyInvois: supplier SSM registration number required'
      );
    });
  });

  describe('Singapore Peppol', () => {
    it('generates SG Peppol UBL', () => {
      const { result } = buildEInvoice({ ...baseInput, format: 'SG_PEPPOL' });

      expect(result.format).toBe('SG_PEPPOL');
      expect(result.xml).toContain('peppol.eu');
      expect(result.xml).toContain(':sg:');
    });

    it('does not require QR code', () => {
      const { result } = buildEInvoice({ ...baseInput, format: 'SG_PEPPOL' });
      expect(result.qrCodeRequired).toBe(false);
      expect(result.digitalSignatureRequired).toBe(false);
    });
  });

  describe('EU Peppol', () => {
    it('generates EU Peppol UBL', () => {
      const { result } = buildEInvoice({ ...baseInput, format: 'EU_PEPPOL' });

      expect(result.format).toBe('EU_PEPPOL');
      expect(result.xml).toContain('peppol.eu');
      expect(result.xml).toContain('billing:3.0');
    });

    it('does not require buyer tax ID', () => {
      const { result } = buildEInvoice({
        ...baseInput,
        format: 'EU_PEPPOL',
        buyer: { ...buyer, taxId: '' },
      });
      // EU Peppol allows missing buyer VAT
      const hasError = result.validationErrors.some((e) => e.includes('Buyer tax ID'));
      expect(hasError).toBe(false);
    });
  });

  describe('India GST', () => {
    it('generates GST JSON payload', () => {
      const { result } = buildEInvoice({ ...baseInput, format: 'IN_GST' });

      expect(result.format).toBe('IN_GST');
      const parsed = JSON.parse(result.xml);
      expect(parsed.Version).toBe('1.1');
      expect(parsed.DocDtls.No).toBe('INV-2025-001');
      expect(parsed.SellerDtls.LglNm).toBe('Acme Sdn Bhd');
      expect(parsed.ItemList).toHaveLength(1);
    });

    it('requires QR code', () => {
      const { result } = buildEInvoice({ ...baseInput, format: 'IN_GST' });
      expect(result.qrCodeRequired).toBe(true);
    });
  });

  describe('Credit note validation', () => {
    it('requires original invoice reference', () => {
      const { result } = buildEInvoice({
        ...baseInput,
        documentType: 'CREDIT_NOTE',
      });
      expect(result.validationErrors).toContain('Credit note must reference original invoice');
    });

    it('passes with original ref', () => {
      const { result } = buildEInvoice({
        ...baseInput,
        documentType: 'CREDIT_NOTE',
        originalInvoiceRef: 'INV-2025-001',
      });
      const hasError = result.validationErrors.some((e) => e.includes('Credit note'));
      expect(hasError).toBe(false);
      expect(result.xml).toContain('INV-2025-001');
    });
  });

  describe('General validation', () => {
    it('rejects empty line items', () => {
      const { result } = buildEInvoice({ ...baseInput, lineItems: [] });
      expect(result.validationErrors).toContain('At least one line item is required');
    });

    it('warns on line total mismatch', () => {
      const { result } = buildEInvoice({
        ...baseInput,
        totalExcludingTax: 999_99n,
      });
      expect(result.validationWarnings.length).toBeGreaterThan(0);
    });

    it('returns correct totals', () => {
      const { result } = buildEInvoice(baseInput);
      expect(result.totalExcludingTax).toBe(100_00n);
      expect(result.totalTax).toBe(6_00n);
      expect(result.totalIncludingTax).toBe(106_00n);
      expect(result.lineCount).toBe(1);
    });
  });

  it('provides audit explanation', () => {
    const calc = buildEInvoice(baseInput);
    expect(calc.explanation).toContain('E-invoice MY_MYINVOIS');
    expect(calc.explanation).toContain('INV-2025-001');
    expect(calc.explanation).toContain('1 lines');
  });
});
