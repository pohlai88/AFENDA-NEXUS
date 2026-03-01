/**
 * TX-10: E-Invoice builder — Peppol UBL 2.1 / BIS 3.0, MyInvois, InvoiceNow.
 * Pure calculator — no DB, no side effects.
 *
 * Generates e-invoice XML documents conforming to:
 * - Malaysia MyInvois (LHDN e-Invoice)
 * - Singapore InvoiceNow (Peppol BIS 3.0)
 * - EU Peppol BIS 3.0 (UBL 2.1)
 * - India GST e-Invoice (JSON schema)
 *
 * All monetary values are bigint (minor units).
 */

import type { CalculatorResult } from '../../../shared/types.js';

// ─── Types ───────────────────────────────────────────────────────────────────

export type EInvoiceFormat = 'MY_MYINVOIS' | 'SG_PEPPOL' | 'EU_PEPPOL' | 'IN_GST' | 'SA_ZATCA';

export type EInvoiceDocumentType = 'INVOICE' | 'CREDIT_NOTE' | 'DEBIT_NOTE' | 'SELF_BILLED';

export interface EInvoiceParty {
  readonly name: string;
  readonly taxId: string;
  readonly registrationNumber?: string;
  readonly address: {
    readonly street: string;
    readonly city: string;
    readonly postalCode: string;
    readonly countryCode: string;
    readonly state?: string;
  };
  readonly contactEmail?: string;
  readonly contactPhone?: string;
}

export interface EInvoiceLineItem {
  readonly lineNumber: number;
  readonly description: string;
  readonly quantity: bigint; // ×10000 for decimals
  readonly unitPrice: bigint;
  readonly lineTotal: bigint;
  readonly taxCode: string;
  readonly taxRateBps: number; // basis points (600 = 6%)
  readonly taxAmount: bigint;
  readonly unitOfMeasure?: string;
  readonly itemCode?: string;
  readonly classificationCode?: string; // MY: MSIC code, SG: UNSPSC
}

export interface EInvoiceInput {
  readonly format: EInvoiceFormat;
  readonly documentType: EInvoiceDocumentType;
  readonly invoiceNumber: string;
  readonly issueDate: string;
  readonly dueDate?: string;
  readonly currencyCode: string;
  readonly supplier: EInvoiceParty;
  readonly buyer: EInvoiceParty;
  readonly lineItems: readonly EInvoiceLineItem[];
  readonly totalExcludingTax: bigint;
  readonly totalTax: bigint;
  readonly totalIncludingTax: bigint;
  readonly paymentTerms?: string;
  readonly referenceNumber?: string;
  readonly originalInvoiceRef?: string; // for credit/debit notes
}

export interface EInvoiceResult {
  readonly format: EInvoiceFormat;
  readonly documentType: EInvoiceDocumentType;
  readonly invoiceNumber: string;
  readonly xml: string;
  readonly lineCount: number;
  readonly totalExcludingTax: bigint;
  readonly totalTax: bigint;
  readonly totalIncludingTax: bigint;
  readonly currencyCode: string;
  readonly validationErrors: readonly string[];
  readonly validationWarnings: readonly string[];
  readonly digitalSignatureRequired: boolean;
  readonly qrCodeRequired: boolean;
  readonly submissionEndpoint: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatMinor(amount: bigint): string {
  const str = amount.toString();
  if (str.length <= 2) return `0.${str.padStart(2, '0')}`;
  return `${str.slice(0, -2)}.${str.slice(-2)}`;
}

function buildUblLineItems(items: readonly EInvoiceLineItem[], currencyCode: string): string {
  return items
    .map(
      (item) => `
    <cac:InvoiceLine>
      <cbc:ID>${item.lineNumber}</cbc:ID>
      <cbc:InvoicedQuantity unitCode="${escapeXml(item.unitOfMeasure ?? 'EA')}">${formatMinor(item.quantity)}</cbc:InvoicedQuantity>
      <cbc:LineExtensionAmount currencyID="${currencyCode}">${formatMinor(item.lineTotal)}</cbc:LineExtensionAmount>
      <cac:Item>
        <cbc:Name>${escapeXml(item.description)}</cbc:Name>${item.classificationCode ? `\n        <cac:CommodityClassification><cbc:ItemClassificationCode>${escapeXml(item.classificationCode)}</cbc:ItemClassificationCode></cac:CommodityClassification>` : ''}
        <cac:ClassifiedTaxCategory>
          <cbc:ID>${escapeXml(item.taxCode)}</cbc:ID>
          <cbc:Percent>${(item.taxRateBps / 100).toFixed(2)}</cbc:Percent>
          <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
        </cac:ClassifiedTaxCategory>
      </cac:Item>
      <cac:Price>
        <cbc:PriceAmount currencyID="${currencyCode}">${formatMinor(item.unitPrice)}</cbc:PriceAmount>
      </cac:Price>
    </cac:InvoiceLine>`
    )
    .join('');
}

function buildUblParty(party: EInvoiceParty, role: string): string {
  return `
    <cac:${role}>
      <cac:Party>
        <cac:PartyName><cbc:Name>${escapeXml(party.name)}</cbc:Name></cac:PartyName>
        <cac:PostalAddress>
          <cbc:StreetName>${escapeXml(party.address.street)}</cbc:StreetName>
          <cbc:CityName>${escapeXml(party.address.city)}</cbc:CityName>
          <cbc:PostalZone>${escapeXml(party.address.postalCode)}</cbc:PostalZone>
          <cac:Country><cbc:IdentificationCode>${escapeXml(party.address.countryCode)}</cbc:IdentificationCode></cac:Country>
        </cac:PostalAddress>
        <cac:PartyTaxScheme>
          <cbc:CompanyID>${escapeXml(party.taxId)}</cbc:CompanyID>
          <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
        </cac:PartyTaxScheme>
        <cac:PartyLegalEntity>
          <cbc:RegistrationName>${escapeXml(party.name)}</cbc:RegistrationName>${party.registrationNumber ? `\n          <cbc:CompanyID>${escapeXml(party.registrationNumber)}</cbc:CompanyID>` : ''}
        </cac:PartyLegalEntity>
      </cac:Party>
    </cac:${role}>`;
}

// ─── Validation ──────────────────────────────────────────────────────────────

function validate(input: EInvoiceInput): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (input.lineItems.length === 0) errors.push('At least one line item is required');
  if (!input.supplier.taxId) errors.push('Supplier tax ID is required');
  if (!input.buyer.taxId && input.format !== 'EU_PEPPOL') errors.push('Buyer tax ID is required');
  if (!input.invoiceNumber) errors.push('Invoice number is required');

  // Validate line totals
  let lineSum = 0n;
  for (const line of input.lineItems) {
    lineSum += line.lineTotal;
    if (line.lineTotal < 0n && input.documentType === 'INVOICE') {
      warnings.push(`Line ${line.lineNumber}: negative amount on invoice`);
    }
  }
  if (lineSum !== input.totalExcludingTax) {
    warnings.push(
      `Line total sum (${lineSum}) does not match totalExcludingTax (${input.totalExcludingTax})`
    );
  }

  // Tax cross-check
  let lineTaxSum = 0n;
  for (const line of input.lineItems) lineTaxSum += line.taxAmount;
  if (lineTaxSum !== input.totalTax) {
    warnings.push(`Line tax sum (${lineTaxSum}) does not match totalTax (${input.totalTax})`);
  }

  // Format-specific validations
  if (input.format === 'MY_MYINVOIS') {
    if (!input.supplier.registrationNumber)
      errors.push('MyInvois: supplier SSM registration number required');
    const hasClassification = input.lineItems.every((l) => l.classificationCode);
    if (!hasClassification)
      warnings.push('MyInvois: MSIC classification code recommended for all lines');
  }
  if (input.format === 'SA_ZATCA') {
    if (!input.supplier.address.postalCode) errors.push('ZATCA: supplier postal code required');
  }
  if (input.documentType === 'CREDIT_NOTE' && !input.originalInvoiceRef) {
    errors.push('Credit note must reference original invoice');
  }
  if (input.documentType === 'DEBIT_NOTE' && !input.originalInvoiceRef) {
    errors.push('Debit note must reference original invoice');
  }

  return { errors, warnings };
}

// ─── Format-specific endpoints ───────────────────────────────────────────────

function getSubmissionEndpoint(format: EInvoiceFormat): string {
  switch (format) {
    case 'MY_MYINVOIS':
      return 'https://myinvois.hasil.gov.my/api/v1.0/documents';
    case 'SG_PEPPOL':
      return 'https://api.invoicenow.gov.sg/v1/documents';
    case 'EU_PEPPOL':
      return 'https://peppol.eu/api/v1/documents';
    case 'IN_GST':
      return 'https://einvoice1.gst.gov.in/eicore/v1.03/Invoice';
    case 'SA_ZATCA':
      return 'https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal';
  }
}

// ─── Builders ────────────────────────────────────────────────────────────────

function buildPeppolUbl(input: EInvoiceInput, customizationId: string): string {
  const docTypeCode = input.documentType === 'CREDIT_NOTE' ? '381' : '380';
  const cc = input.currencyCode;

  return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
  xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
  xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:CustomizationID>${escapeXml(customizationId)}</cbc:CustomizationID>
  <cbc:ID>${escapeXml(input.invoiceNumber)}</cbc:ID>
  <cbc:IssueDate>${escapeXml(input.issueDate)}</cbc:IssueDate>${input.dueDate ? `\n  <cbc:DueDate>${escapeXml(input.dueDate)}</cbc:DueDate>` : ''}
  <cbc:InvoiceTypeCode>${docTypeCode}</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>${cc}</cbc:DocumentCurrencyCode>${input.originalInvoiceRef ? `\n  <cac:BillingReference><cac:InvoiceDocumentReference><cbc:ID>${escapeXml(input.originalInvoiceRef)}</cbc:ID></cac:InvoiceDocumentReference></cac:BillingReference>` : ''}${buildUblParty(input.supplier, 'AccountingSupplierParty')}${buildUblParty(input.buyer, 'AccountingCustomerParty')}
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="${cc}">${formatMinor(input.totalTax)}</cbc:TaxAmount>
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="${cc}">${formatMinor(input.totalExcludingTax)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="${cc}">${formatMinor(input.totalExcludingTax)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="${cc}">${formatMinor(input.totalIncludingTax)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="${cc}">${formatMinor(input.totalIncludingTax)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>${buildUblLineItems(input.lineItems, cc)}
</Invoice>`;
}

function buildMyInvois(input: EInvoiceInput): string {
  return buildPeppolUbl(input, 'urn:cen.eu:en16931:2017#conformant#urn:myinvois.hasil.gov.my:2024');
}

function buildSgPeppol(input: EInvoiceInput): string {
  return buildPeppolUbl(
    input,
    'urn:cen.eu:en16931:2017#conformant#urn:fdc:peppol.eu:2017:poacc:billing:international:sg:3.0'
  );
}

function buildEuPeppol(input: EInvoiceInput): string {
  return buildPeppolUbl(
    input,
    'urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0'
  );
}

function buildIndiaGstJson(input: EInvoiceInput): string {
  // India GST e-Invoice uses JSON schema, wrapped in XML envelope for consistency
  const payload = {
    Version: '1.1',
    TranDtls: { TaxSch: 'GST', SupTyp: 'B2B', RegRev: 'N' },
    DocDtls: {
      Typ: input.documentType === 'CREDIT_NOTE' ? 'CRN' : 'INV',
      No: input.invoiceNumber,
      Dt: input.issueDate.split('-').reverse().join('/'),
    },
    SellerDtls: {
      Gstin: input.supplier.taxId,
      LglNm: input.supplier.name,
      Addr1: input.supplier.address.street,
      Loc: input.supplier.address.city,
      Pin: Number(input.supplier.address.postalCode),
      Stcd: input.supplier.address.state ?? '00',
    },
    BuyerDtls: {
      Gstin: input.buyer.taxId,
      LglNm: input.buyer.name,
      Addr1: input.buyer.address.street,
      Loc: input.buyer.address.city,
      Pin: Number(input.buyer.address.postalCode),
      Stcd: input.buyer.address.state ?? '00',
    },
    ItemList: input.lineItems.map((item) => ({
      SlNo: String(item.lineNumber),
      PrdDesc: item.description,
      HsnCd: item.classificationCode ?? '0000',
      Qty: Number(item.quantity) / 10000,
      UnitPrice: Number(item.unitPrice) / 100,
      TotAmt: Number(item.lineTotal) / 100,
      GstRt: item.taxRateBps / 100,
    })),
    ValDtls: {
      AssVal: Number(input.totalExcludingTax) / 100,
      TotInvVal: Number(input.totalIncludingTax) / 100,
    },
  };
  return JSON.stringify(payload, null, 2);
}

function buildSaZatca(input: EInvoiceInput): string {
  return buildPeppolUbl(input, 'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2');
}

// ─── Main ────────────────────────────────────────────────────────────────────

export function buildEInvoice(input: EInvoiceInput): CalculatorResult<EInvoiceResult> {
  const { errors, warnings } = validate(input);

  let xml: string;
  switch (input.format) {
    case 'MY_MYINVOIS':
      xml = buildMyInvois(input);
      break;
    case 'SG_PEPPOL':
      xml = buildSgPeppol(input);
      break;
    case 'EU_PEPPOL':
      xml = buildEuPeppol(input);
      break;
    case 'IN_GST':
      xml = buildIndiaGstJson(input);
      break;
    case 'SA_ZATCA':
      xml = buildSaZatca(input);
      break;
  }

  const result: EInvoiceResult = {
    format: input.format,
    documentType: input.documentType,
    invoiceNumber: input.invoiceNumber,
    xml,
    lineCount: input.lineItems.length,
    totalExcludingTax: input.totalExcludingTax,
    totalTax: input.totalTax,
    totalIncludingTax: input.totalIncludingTax,
    currencyCode: input.currencyCode,
    validationErrors: errors,
    validationWarnings: warnings,
    digitalSignatureRequired: input.format === 'MY_MYINVOIS' || input.format === 'SA_ZATCA',
    qrCodeRequired:
      input.format === 'MY_MYINVOIS' || input.format === 'SA_ZATCA' || input.format === 'IN_GST',
    submissionEndpoint: getSubmissionEndpoint(input.format),
  };

  return {
    result,
    inputs: {
      format: input.format,
      invoiceNumber: input.invoiceNumber,
      lineCount: input.lineItems.length,
      totalIncludingTax: input.totalIncludingTax.toString(),
      currencyCode: input.currencyCode,
    },
    explanation:
      `E-invoice ${input.format}: ${input.documentType} ${input.invoiceNumber}, ` +
      `${input.lineItems.length} lines, total ${formatMinor(input.totalIncludingTax)} ${input.currencyCode}${ 
      errors.length > 0 ? `, ${errors.length} validation errors` : ', valid' 
      }${warnings.length > 0 ? `, ${warnings.length} warnings` : ''}`,
  };
}
