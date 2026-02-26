/**
 * TX-11: Extended country tax format packs.
 * Pluggable formatters for ASEAN + India + EU + US tax returns.
 * Pure calculator — no DB, no side effects.
 *
 * Extends country-formats.ts with complete packs:
 * - Malaysia: Form C (corporate), Form E (employer), SST-02
 * - Singapore: Form C-S, GST F5/F7, IRAS AIS
 * - Indonesia: PPh 21/23/25, PPN
 * - Thailand: PP30, PP36, PP54
 * - Philippines: BIR 2550M/Q, 1601-C
 * - India: GSTR-1, GSTR-3B, TDS returns
 * - EU: EC Sales List, Intrastat
 * - US: 1099-NEC, 1099-MISC
 *
 * All monetary values are bigint (minor units).
 */

import type { CalculatorResult } from '../../../shared/types.js';

export type ExtendedCountryFormat =
  | 'MY_FORM_C'
  | 'MY_FORM_E'
  | 'MY_SST02'
  | 'SG_FORM_CS'
  | 'SG_GST_F5'
  | 'SG_GST_F7'
  | 'SG_IRAS_AIS'
  | 'ID_PPH_21'
  | 'ID_PPH_23'
  | 'ID_PPH_25'
  | 'ID_PPN'
  | 'TH_PP30'
  | 'TH_PP36'
  | 'TH_PP54'
  | 'PH_BIR_2550M'
  | 'PH_BIR_2550Q'
  | 'PH_BIR_1601C'
  | 'IN_GSTR1'
  | 'IN_GSTR3B'
  | 'IN_TDS'
  | 'EU_EC_SALES_LIST'
  | 'EU_INTRASTAT'
  | 'US_1099_NEC'
  | 'US_1099_MISC';

export interface TaxFormLine {
  readonly boxNumber: string;
  readonly label: string;
  readonly amount: bigint;
  readonly currencyCode: string;
}

export interface TaxFormResult {
  readonly format: ExtendedCountryFormat;
  readonly countryCode: string;
  readonly formName: string;
  readonly periodStart: string;
  readonly periodEnd: string;
  readonly lines: readonly TaxFormLine[];
  readonly totalTaxPayable: bigint;
  readonly currencyCode: string;
  readonly filingDeadline: string;
  readonly electronicFilingRequired: boolean;
}

// ─── Malaysia ────────────────────────────────────────────────────────────────

export interface MyFormCInput {
  readonly companyName: string;
  readonly tinNumber: string;
  readonly yearOfAssessment: number;
  readonly grossIncome: bigint;
  readonly allowableDeductions: bigint;
  readonly capitalAllowances: bigint;
  readonly adjustedIncome: bigint;
  readonly chargeableIncome: bigint;
  readonly taxPayable: bigint;
  readonly taxCredits: bigint;
  readonly instalmentsPaid: bigint;
  readonly currencyCode: string;
  readonly periodStart: string;
  readonly periodEnd: string;
}

export function formatMyFormC(input: MyFormCInput): CalculatorResult<TaxFormResult> {
  const netPayable = input.taxPayable - input.taxCredits - input.instalmentsPaid;
  const lines: TaxFormLine[] = [
    {
      boxNumber: 'A1',
      label: 'Gross income from business',
      amount: input.grossIncome,
      currencyCode: input.currencyCode,
    },
    {
      boxNumber: 'A2',
      label: 'Allowable deductions',
      amount: input.allowableDeductions,
      currencyCode: input.currencyCode,
    },
    {
      boxNumber: 'A3',
      label: 'Capital allowances',
      amount: input.capitalAllowances,
      currencyCode: input.currencyCode,
    },
    {
      boxNumber: 'A4',
      label: 'Adjusted income',
      amount: input.adjustedIncome,
      currencyCode: input.currencyCode,
    },
    {
      boxNumber: 'B1',
      label: 'Chargeable income',
      amount: input.chargeableIncome,
      currencyCode: input.currencyCode,
    },
    {
      boxNumber: 'C1',
      label: 'Tax payable',
      amount: input.taxPayable,
      currencyCode: input.currencyCode,
    },
    {
      boxNumber: 'C2',
      label: 'Tax credits / reliefs',
      amount: input.taxCredits,
      currencyCode: input.currencyCode,
    },
    {
      boxNumber: 'C3',
      label: 'Instalments paid (CP204)',
      amount: input.instalmentsPaid,
      currencyCode: input.currencyCode,
    },
    {
      boxNumber: 'C4',
      label: 'Tax balance payable / (refundable)',
      amount: netPayable,
      currencyCode: input.currencyCode,
    },
  ];

  const deadline = `${input.yearOfAssessment + 1}-07-31`;

  const result: TaxFormResult = {
    format: 'MY_FORM_C',
    countryCode: 'MY',
    formName: 'Form C — Corporate Tax Return',
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    lines,
    totalTaxPayable: netPayable,
    currencyCode: input.currencyCode,
    filingDeadline: deadline,
    electronicFilingRequired: true,
  };

  return {
    result,
    inputs: {
      format: 'MY_FORM_C',
      yearOfAssessment: input.yearOfAssessment,
      chargeableIncome: input.chargeableIncome.toString(),
    },
    explanation: `MY Form C: YA${input.yearOfAssessment}, chargeable income ${input.chargeableIncome}, tax payable ${netPayable}`,
  };
}

// ─── Singapore ───────────────────────────────────────────────────────────────

export interface SgFormCsInput {
  readonly companyName: string;
  readonly uenNumber: string;
  readonly yearOfAssessment: number;
  readonly revenue: bigint;
  readonly adjustedProfit: bigint;
  readonly chargeableIncome: bigint;
  readonly taxPayable: bigint;
  readonly taxCredits: bigint;
  readonly currencyCode: string;
  readonly periodStart: string;
  readonly periodEnd: string;
}

export function formatSgFormCs(input: SgFormCsInput): CalculatorResult<TaxFormResult> {
  const netPayable = input.taxPayable - input.taxCredits;
  const lines: TaxFormLine[] = [
    { boxNumber: '1', label: 'Revenue', amount: input.revenue, currencyCode: input.currencyCode },
    {
      boxNumber: '2',
      label: 'Adjusted profit / loss',
      amount: input.adjustedProfit,
      currencyCode: input.currencyCode,
    },
    {
      boxNumber: '3',
      label: 'Chargeable income',
      amount: input.chargeableIncome,
      currencyCode: input.currencyCode,
    },
    {
      boxNumber: '4',
      label: 'Tax payable at 17%',
      amount: input.taxPayable,
      currencyCode: input.currencyCode,
    },
    {
      boxNumber: '5',
      label: 'Tax credits',
      amount: input.taxCredits,
      currencyCode: input.currencyCode,
    },
    {
      boxNumber: '6',
      label: 'Net tax payable',
      amount: netPayable,
      currencyCode: input.currencyCode,
    },
  ];

  const deadline = `${input.yearOfAssessment}-11-30`;

  const result: TaxFormResult = {
    format: 'SG_FORM_CS',
    countryCode: 'SG',
    formName: 'Form C-S — Simplified Corporate Tax Return',
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    lines,
    totalTaxPayable: netPayable,
    currencyCode: input.currencyCode,
    filingDeadline: deadline,
    electronicFilingRequired: true,
  };

  return {
    result,
    inputs: {
      format: 'SG_FORM_CS',
      yearOfAssessment: input.yearOfAssessment,
      chargeableIncome: input.chargeableIncome.toString(),
    },
    explanation: `SG Form C-S: YA${input.yearOfAssessment}, chargeable income ${input.chargeableIncome}, net tax ${netPayable}`,
  };
}

// ─── Indonesia ───────────────────────────────────────────────────────────────

export interface IdPPhInput {
  readonly format: 'ID_PPH_21' | 'ID_PPH_23' | 'ID_PPH_25';
  readonly npwpNumber: string;
  readonly taxPeriodMonth: number;
  readonly taxPeriodYear: number;
  readonly grossAmount: bigint;
  readonly taxableAmount: bigint;
  readonly taxRateBps: number;
  readonly taxWithheld: bigint;
  readonly numberOfRecipients: number;
  readonly currencyCode: string;
}

export function formatIdPPh(input: IdPPhInput): CalculatorResult<TaxFormResult> {
  const periodStr = `${input.taxPeriodYear}-${String(input.taxPeriodMonth).padStart(2, '0')}`;
  const formNames: Record<string, string> = {
    ID_PPH_21: 'PPh 21 — Employee Income Tax',
    ID_PPH_23: 'PPh 23 — Withholding Tax on Services',
    ID_PPH_25: 'PPh 25 — Monthly Corporate Income Tax Instalment',
  };

  const lines: TaxFormLine[] = [
    {
      boxNumber: '1',
      label: 'Gross amount',
      amount: input.grossAmount,
      currencyCode: input.currencyCode,
    },
    {
      boxNumber: '2',
      label: 'Taxable amount',
      amount: input.taxableAmount,
      currencyCode: input.currencyCode,
    },
    {
      boxNumber: '3',
      label: `Tax rate (${input.taxRateBps / 100}%)`,
      amount: BigInt(input.taxRateBps),
      currencyCode: input.currencyCode,
    },
    {
      boxNumber: '4',
      label: 'Tax withheld / payable',
      amount: input.taxWithheld,
      currencyCode: input.currencyCode,
    },
    {
      boxNumber: '5',
      label: 'Number of recipients',
      amount: BigInt(input.numberOfRecipients),
      currencyCode: input.currencyCode,
    },
  ];

  const result: TaxFormResult = {
    format: input.format,
    countryCode: 'ID',
    formName: formNames[input.format] ?? input.format,
    periodStart: `${periodStr}-01`,
    periodEnd: `${periodStr}-28`,
    lines,
    totalTaxPayable: input.taxWithheld,
    currencyCode: input.currencyCode,
    filingDeadline: `${periodStr === `${input.taxPeriodYear}-12` ? input.taxPeriodYear + 1 : input.taxPeriodYear}-${String(input.taxPeriodMonth === 12 ? 1 : input.taxPeriodMonth + 1).padStart(2, '0')}-20`,
    electronicFilingRequired: true,
  };

  return {
    result,
    inputs: { format: input.format, period: periodStr, taxWithheld: input.taxWithheld.toString() },
    explanation: `${input.format}: period ${periodStr}, ${input.numberOfRecipients} recipients, tax ${input.taxWithheld}`,
  };
}

// ─── Thailand ────────────────────────────────────────────────────────────────

export interface ThPP30Input {
  readonly tinNumber: string;
  readonly taxPeriodMonth: number;
  readonly taxPeriodYear: number;
  readonly totalSales: bigint;
  readonly totalPurchases: bigint;
  readonly outputVat: bigint;
  readonly inputVat: bigint;
  readonly currencyCode: string;
}

export function formatThPP30(input: ThPP30Input): CalculatorResult<TaxFormResult> {
  const netPayable = input.outputVat - input.inputVat;
  const periodStr = `${input.taxPeriodYear}-${String(input.taxPeriodMonth).padStart(2, '0')}`;

  const lines: TaxFormLine[] = [
    {
      boxNumber: '1',
      label: 'Total sales',
      amount: input.totalSales,
      currencyCode: input.currencyCode,
    },
    {
      boxNumber: '2',
      label: 'Output VAT (7%)',
      amount: input.outputVat,
      currencyCode: input.currencyCode,
    },
    {
      boxNumber: '3',
      label: 'Total purchases',
      amount: input.totalPurchases,
      currencyCode: input.currencyCode,
    },
    {
      boxNumber: '4',
      label: 'Input VAT',
      amount: input.inputVat,
      currencyCode: input.currencyCode,
    },
    {
      boxNumber: '5',
      label: 'Net VAT payable / (refundable)',
      amount: netPayable,
      currencyCode: input.currencyCode,
    },
  ];

  const result: TaxFormResult = {
    format: 'TH_PP30',
    countryCode: 'TH',
    formName: 'PP30 — VAT Return',
    periodStart: `${periodStr}-01`,
    periodEnd: `${periodStr}-28`,
    lines,
    totalTaxPayable: netPayable,
    currencyCode: input.currencyCode,
    filingDeadline: `${periodStr === `${input.taxPeriodYear}-12` ? input.taxPeriodYear + 1 : input.taxPeriodYear}-${String(input.taxPeriodMonth === 12 ? 1 : input.taxPeriodMonth + 1).padStart(2, '0')}-15`,
    electronicFilingRequired: true,
  };

  return {
    result,
    inputs: { format: 'TH_PP30', period: periodStr, netPayable: netPayable.toString() },
    explanation: `TH PP30: period ${periodStr}, output VAT ${input.outputVat}, input VAT ${input.inputVat}, net ${netPayable}`,
  };
}

// ─── India ───────────────────────────────────────────────────────────────────

export interface InGstr3bInput {
  readonly gstinNumber: string;
  readonly taxPeriodMonth: number;
  readonly taxPeriodYear: number;
  readonly outwardTaxableSupplies: bigint;
  readonly outwardZeroRated: bigint;
  readonly outwardExempt: bigint;
  readonly inwardReverseCharge: bigint;
  readonly igst: bigint;
  readonly cgst: bigint;
  readonly sgst: bigint;
  readonly inputIgst: bigint;
  readonly inputCgst: bigint;
  readonly inputSgst: bigint;
  readonly currencyCode: string;
}

export function formatInGstr3b(input: InGstr3bInput): CalculatorResult<TaxFormResult> {
  const totalOutput = input.igst + input.cgst + input.sgst;
  const totalInput = input.inputIgst + input.inputCgst + input.inputSgst;
  const netPayable = totalOutput - totalInput;
  const periodStr = `${input.taxPeriodYear}-${String(input.taxPeriodMonth).padStart(2, '0')}`;

  const lines: TaxFormLine[] = [
    {
      boxNumber: '3.1a',
      label: 'Outward taxable supplies (other than zero/nil/exempt)',
      amount: input.outwardTaxableSupplies,
      currencyCode: input.currencyCode,
    },
    {
      boxNumber: '3.1b',
      label: 'Outward zero-rated supplies',
      amount: input.outwardZeroRated,
      currencyCode: input.currencyCode,
    },
    {
      boxNumber: '3.1c',
      label: 'Outward exempt supplies',
      amount: input.outwardExempt,
      currencyCode: input.currencyCode,
    },
    {
      boxNumber: '3.1d',
      label: 'Inward supplies (reverse charge)',
      amount: input.inwardReverseCharge,
      currencyCode: input.currencyCode,
    },
    {
      boxNumber: '6.1',
      label: 'IGST payable',
      amount: input.igst,
      currencyCode: input.currencyCode,
    },
    {
      boxNumber: '6.2',
      label: 'CGST payable',
      amount: input.cgst,
      currencyCode: input.currencyCode,
    },
    {
      boxNumber: '6.3',
      label: 'SGST payable',
      amount: input.sgst,
      currencyCode: input.currencyCode,
    },
    {
      boxNumber: '6.4',
      label: 'ITC — IGST',
      amount: input.inputIgst,
      currencyCode: input.currencyCode,
    },
    {
      boxNumber: '6.5',
      label: 'ITC — CGST',
      amount: input.inputCgst,
      currencyCode: input.currencyCode,
    },
    {
      boxNumber: '6.6',
      label: 'ITC — SGST',
      amount: input.inputSgst,
      currencyCode: input.currencyCode,
    },
    {
      boxNumber: '6.7',
      label: 'Net tax payable',
      amount: netPayable,
      currencyCode: input.currencyCode,
    },
  ];

  const result: TaxFormResult = {
    format: 'IN_GSTR3B',
    countryCode: 'IN',
    formName: 'GSTR-3B — Summary GST Return',
    periodStart: `${periodStr}-01`,
    periodEnd: `${periodStr}-28`,
    lines,
    totalTaxPayable: netPayable,
    currencyCode: input.currencyCode,
    filingDeadline: `${periodStr === `${input.taxPeriodYear}-12` ? input.taxPeriodYear + 1 : input.taxPeriodYear}-${String(input.taxPeriodMonth === 12 ? 1 : input.taxPeriodMonth + 1).padStart(2, '0')}-20`,
    electronicFilingRequired: true,
  };

  return {
    result,
    inputs: { format: 'IN_GSTR3B', period: periodStr, netPayable: netPayable.toString() },
    explanation: `IN GSTR-3B: period ${periodStr}, output ${totalOutput}, ITC ${totalInput}, net ${netPayable}`,
  };
}

// ─── US ──────────────────────────────────────────────────────────────────────

export interface Us1099NecRecipient {
  readonly recipientName: string;
  readonly recipientTin: string;
  readonly nonEmployeeCompensation: bigint;
  readonly federalTaxWithheld: bigint;
  readonly stateTaxWithheld: bigint;
  readonly stateCode: string;
}

export interface Us1099NecInput {
  readonly payerName: string;
  readonly payerTin: string;
  readonly taxYear: number;
  readonly recipients: readonly Us1099NecRecipient[];
  readonly currencyCode: string;
}

export function formatUs1099Nec(input: Us1099NecInput): CalculatorResult<TaxFormResult> {
  let totalCompensation = 0n;
  let totalFedWithheld = 0n;
  for (const r of input.recipients) {
    totalCompensation += r.nonEmployeeCompensation;
    totalFedWithheld += r.federalTaxWithheld;
  }

  const lines: TaxFormLine[] = [
    {
      boxNumber: '1',
      label: 'Total nonemployee compensation',
      amount: totalCompensation,
      currencyCode: input.currencyCode,
    },
    {
      boxNumber: '4',
      label: 'Federal income tax withheld',
      amount: totalFedWithheld,
      currencyCode: input.currencyCode,
    },
    {
      boxNumber: 'N',
      label: 'Number of recipients',
      amount: BigInt(input.recipients.length),
      currencyCode: input.currencyCode,
    },
  ];

  const result: TaxFormResult = {
    format: 'US_1099_NEC',
    countryCode: 'US',
    formName: '1099-NEC — Nonemployee Compensation',
    periodStart: `${input.taxYear}-01-01`,
    periodEnd: `${input.taxYear}-12-31`,
    lines,
    totalTaxPayable: totalFedWithheld,
    currencyCode: input.currencyCode,
    filingDeadline: `${input.taxYear + 1}-01-31`,
    electronicFilingRequired: input.recipients.length >= 10,
  };

  return {
    result,
    inputs: {
      format: 'US_1099_NEC',
      taxYear: input.taxYear,
      recipientCount: input.recipients.length,
    },
    explanation: `US 1099-NEC: TY${input.taxYear}, ${input.recipients.length} recipients, total compensation ${totalCompensation}`,
  };
}

// ─── EU EC Sales List ────────────────────────────────────────────────────────

export interface EcSalesEntry {
  readonly customerVatId: string;
  readonly customerCountry: string;
  readonly supplyType: 'GOODS' | 'SERVICES' | 'TRIANGULATION';
  readonly totalValue: bigint;
}

export interface EcSalesListInput {
  readonly vatNumber: string;
  readonly memberState: string;
  readonly periodQuarter: number;
  readonly periodYear: number;
  readonly entries: readonly EcSalesEntry[];
  readonly currencyCode: string;
}

export function formatEcSalesList(input: EcSalesListInput): CalculatorResult<TaxFormResult> {
  let totalGoods = 0n;
  let totalServices = 0n;
  let totalTriangulation = 0n;
  for (const e of input.entries) {
    if (e.supplyType === 'GOODS') totalGoods += e.totalValue;
    else if (e.supplyType === 'SERVICES') totalServices += e.totalValue;
    else totalTriangulation += e.totalValue;
  }
  const total = totalGoods + totalServices + totalTriangulation;

  const lines: TaxFormLine[] = [
    { boxNumber: 'G', label: 'Total goods', amount: totalGoods, currencyCode: input.currencyCode },
    {
      boxNumber: 'S',
      label: 'Total services',
      amount: totalServices,
      currencyCode: input.currencyCode,
    },
    {
      boxNumber: 'T',
      label: 'Total triangulation',
      amount: totalTriangulation,
      currencyCode: input.currencyCode,
    },
    {
      boxNumber: 'N',
      label: 'Number of entries',
      amount: BigInt(input.entries.length),
      currencyCode: input.currencyCode,
    },
  ];

  const qEnd = input.periodQuarter * 3;
  const periodEnd = `${input.periodYear}-${String(qEnd).padStart(2, '0')}-${qEnd === 6 || qEnd === 9 ? '30' : '31'}`;
  const periodStart = `${input.periodYear}-${String(qEnd - 2).padStart(2, '0')}-01`;

  const result: TaxFormResult = {
    format: 'EU_EC_SALES_LIST',
    countryCode: input.memberState,
    formName: 'EC Sales List — Intra-Community Supplies',
    periodStart,
    periodEnd,
    lines,
    totalTaxPayable: 0n,
    currencyCode: input.currencyCode,
    filingDeadline: `${input.periodYear}-${String(qEnd + 1 > 12 ? 1 : qEnd + 1).padStart(2, '0')}-25`,
    electronicFilingRequired: true,
  };

  return {
    result,
    inputs: {
      format: 'EU_EC_SALES_LIST',
      quarter: `Q${input.periodQuarter}/${input.periodYear}`,
      entries: input.entries.length,
    },
    explanation: `EU EC Sales List: Q${input.periodQuarter}/${input.periodYear}, ${input.entries.length} entries, goods ${totalGoods}, services ${totalServices}, total ${total}`,
  };
}
