/**
 * GAP-F3: CbCR Filing Service calculator.
 * Pure calculator — extends the existing CbCR calculator with filing
 * workflow metadata: versioning, filing status, XML generation,
 * and validation for OECD BEPS Action 13 compliance.
 *
 * Groups with >€750M consolidated revenue must file CbCR.
 */
import type { CalculatorResult } from '../../../shared/types.js';
import { computeCbcr, type CbcrEntityInput, type CbcrResult } from './cbcr.js';

export type CbcrFilingStatus =
  | 'DRAFT'
  | 'VALIDATED'
  | 'SUBMITTED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'AMENDED';

export interface CbcrFilingInput {
  readonly reportingEntityId: string;
  readonly reportingEntityName: string;
  readonly reportingPeriodStart: string;
  readonly reportingPeriodEnd: string;
  readonly filingJurisdiction: string;
  readonly consolidatedGroupRevenue: bigint;
  readonly currencyCode: string;
  readonly entities: readonly CbcrEntityInput[];
  readonly version: number;
  readonly preparedBy: string;
  readonly preparedAt: string;
}

export interface CbcrFilingResult {
  readonly cbcrData: CbcrResult;
  readonly filingMetadata: CbcrFilingMetadata;
  readonly validation: CbcrValidationResult;
  readonly xml: string;
}

export interface CbcrFilingMetadata {
  readonly reportingEntityId: string;
  readonly reportingEntityName: string;
  readonly reportingPeriodStart: string;
  readonly reportingPeriodEnd: string;
  readonly filingJurisdiction: string;
  readonly consolidatedGroupRevenue: bigint;
  readonly currencyCode: string;
  readonly version: number;
  readonly status: CbcrFilingStatus;
  readonly preparedBy: string;
  readonly preparedAt: string;
  readonly isFilingRequired: boolean;
  readonly filingThreshold: bigint;
}

export interface CbcrValidationResult {
  readonly isValid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}

/** €750M threshold in EUR minor units (cents). */
const CBCR_THRESHOLD_EUR = 75_000_000_000n;

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Generates CbCR filing package with OECD XML format, validation, and metadata.
 */
export function generateCbcrFiling(input: CbcrFilingInput): CalculatorResult<CbcrFilingResult> {
  // Compute CbCR data using existing calculator
  const cbcrCalc = computeCbcr(input.entities);
  const cbcrData = cbcrCalc.result;

  // Determine if filing is required
  const isFilingRequired = input.consolidatedGroupRevenue >= CBCR_THRESHOLD_EUR;

  // Validation
  const errors: string[] = [];
  const warnings: string[] = [];

  if (input.entities.length === 0) {
    errors.push('No entities provided for CbCR filing');
  }
  if (!input.reportingPeriodStart || !input.reportingPeriodEnd) {
    errors.push('Reporting period start and end dates are required');
  }
  if (!isFilingRequired) {
    warnings.push(
      `Consolidated group revenue (${input.consolidatedGroupRevenue}) is below €750M threshold — CbCR filing may not be required`
    );
  }

  // Check for jurisdictions with no employees or tangible assets
  for (const j of cbcrData.jurisdictions) {
    if (j.numberOfEmployees === 0 && j.tangibleAssets === 0n) {
      warnings.push(
        `Jurisdiction '${j.jurisdiction}' has no employees and no tangible assets — verify entity is not a shell`
      );
    }
  }

  // Check for negative profit jurisdictions
  for (const j of cbcrData.jurisdictions) {
    if (j.profitBeforeTax < 0n && j.incomeTaxPaid > 0n) {
      warnings.push(
        `Jurisdiction '${j.jurisdiction}' has negative profit but positive tax paid — verify accuracy`
      );
    }
  }

  const isValid = errors.length === 0;
  const status: CbcrFilingStatus = isValid ? 'VALIDATED' : 'DRAFT';

  // Generate OECD CbCR XML (simplified schema)
  const jurisdictionBlocks = cbcrData.jurisdictions
    .map(
      (j) => `
    <CbcBody>
      <ReportingEntity>
        <ResCountryCode>${escapeXml(j.jurisdiction)}</ResCountryCode>
      </ReportingEntity>
      <CbcReports>
        <DocSpec>
          <DocTypeIndic>OECD1</DocTypeIndic>
        </DocSpec>
        <ResCountryCode>${escapeXml(j.jurisdiction)}</ResCountryCode>
        <Summary>
          <Revenues>
            <Unrelated>${j.unrelatedPartyRevenue.toString()}</Unrelated>
            <Related>${j.relatedPartyRevenue.toString()}</Related>
            <Total>${j.totalRevenue.toString()}</Total>
          </Revenues>
          <ProfitOrLoss>${j.profitBeforeTax.toString()}</ProfitOrLoss>
          <TaxPaid>${j.incomeTaxPaid.toString()}</TaxPaid>
          <TaxAccrued>${j.incomeTaxAccrued.toString()}</TaxAccrued>
          <Capital>${j.statedCapital.toString()}</Capital>
          <Earnings>${j.accumulatedEarnings.toString()}</Earnings>
          <NbEmployees>${j.numberOfEmployees}</NbEmployees>
          <Assets>${j.tangibleAssets.toString()}</Assets>
        </Summary>
        <ConstEntities>${j.entities.map((e) => `<ConstEntity><Name>${escapeXml(e)}</Name></ConstEntity>`).join('')}</ConstEntities>
      </CbcReports>
    </CbcBody>`
    )
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<CbcOECD version="2.0" xmlns="urn:oecd:ties:cbc:v2">
  <MessageSpec>
    <SendingEntityIN>${escapeXml(input.reportingEntityId)}</SendingEntityIN>
    <TransmittingCountry>${escapeXml(input.filingJurisdiction)}</TransmittingCountry>
    <MessageType>CbCR</MessageType>
    <ReportingPeriod>${escapeXml(input.reportingPeriodEnd)}</ReportingPeriod>
    <Timestamp>${new Date().toISOString()}</Timestamp>
  </MessageSpec>${jurisdictionBlocks}
</CbcOECD>`;

  return {
    result: {
      cbcrData,
      filingMetadata: {
        reportingEntityId: input.reportingEntityId,
        reportingEntityName: input.reportingEntityName,
        reportingPeriodStart: input.reportingPeriodStart,
        reportingPeriodEnd: input.reportingPeriodEnd,
        filingJurisdiction: input.filingJurisdiction,
        consolidatedGroupRevenue: input.consolidatedGroupRevenue,
        currencyCode: input.currencyCode,
        version: input.version,
        status,
        preparedBy: input.preparedBy,
        preparedAt: input.preparedAt,
        isFilingRequired,
        filingThreshold: CBCR_THRESHOLD_EUR,
      },
      validation: { isValid, errors, warnings },
      xml,
    },
    inputs: {
      reportingEntityId: input.reportingEntityId,
      entityCount: input.entities.length,
      version: input.version,
      consolidatedGroupRevenue: input.consolidatedGroupRevenue.toString(),
    },
    explanation:
      `CbCR filing: ${input.reportingEntityName} v${input.version}, ` +
      `${cbcrData.totalJurisdictions} jurisdictions, ${cbcrData.totalEntities} entities, ` +
      `status=${status}, filing ${isFilingRequired ? 'REQUIRED' : 'NOT required'}` +
      (errors.length > 0 ? `, ${errors.length} errors` : '') +
      (warnings.length > 0 ? `, ${warnings.length} warnings` : ''),
  };
}
