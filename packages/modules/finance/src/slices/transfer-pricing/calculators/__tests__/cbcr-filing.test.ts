import { describe, it, expect } from 'vitest';
import { generateCbcrFiling, type CbcrFilingInput } from '../cbcr-filing.js';

const baseInput: CbcrFilingInput = {
  reportingEntityId: 'RE-001',
  reportingEntityName: 'Acme Group Holdings',
  reportingPeriodStart: '2025-01-01',
  reportingPeriodEnd: '2025-12-31',
  filingJurisdiction: 'MY',
  consolidatedGroupRevenue: 80_000_000_000n, // €800M > threshold
  currencyCode: 'EUR',
  version: 1,
  preparedBy: 'tax-manager',
  preparedAt: '2026-03-15',
  entities: [
    {
      entityId: 'E-MY',
      entityName: 'Acme Malaysia',
      taxJurisdiction: 'MY',
      revenue: 30_000_000_000n,
      relatedPartyRevenue: 10_000_000_000n,
      unrelatedPartyRevenue: 20_000_000_000n,
      profitBeforeTax: 5_000_000_000n,
      incomeTaxPaid: 1_200_000_000n,
      incomeTaxAccrued: 1_250_000_000n,
      statedCapital: 10_000_000_000n,
      accumulatedEarnings: 15_000_000_000n,
      numberOfEmployees: 500,
      tangibleAssets: 20_000_000_000n,
      currencyCode: 'EUR',
    },
    {
      entityId: 'E-SG',
      entityName: 'Acme Singapore',
      taxJurisdiction: 'SG',
      revenue: 50_000_000_000n,
      relatedPartyRevenue: 15_000_000_000n,
      unrelatedPartyRevenue: 35_000_000_000n,
      profitBeforeTax: 8_000_000_000n,
      incomeTaxPaid: 1_360_000_000n,
      incomeTaxAccrued: 1_400_000_000n,
      statedCapital: 20_000_000_000n,
      accumulatedEarnings: 30_000_000_000n,
      numberOfEmployees: 800,
      tangibleAssets: 40_000_000_000n,
      currencyCode: 'EUR',
    },
  ],
};

describe('generateCbcrFiling', () => {
  it('generates CbCR data from entities', () => {
    const { result } = generateCbcrFiling(baseInput);

    expect(result.cbcrData.totalEntities).toBe(2);
    expect(result.cbcrData.totalJurisdictions).toBe(2);
  });

  it('determines filing is required when above threshold', () => {
    const { result } = generateCbcrFiling(baseInput);

    expect(result.filingMetadata.isFilingRequired).toBe(true);
    expect(result.filingMetadata.status).toBe('VALIDATED');
  });

  it('determines filing not required when below threshold', () => {
    const { result } = generateCbcrFiling({
      ...baseInput,
      consolidatedGroupRevenue: 50_000_000_000n, // €500M < €750M
    });

    expect(result.filingMetadata.isFilingRequired).toBe(false);
    expect(result.validation.warnings.length).toBeGreaterThan(0);
  });

  it('validates successfully with valid data', () => {
    const { result } = generateCbcrFiling(baseInput);

    expect(result.validation.isValid).toBe(true);
    expect(result.validation.errors).toHaveLength(0);
  });

  it('generates OECD XML output', () => {
    const { result } = generateCbcrFiling(baseInput);

    expect(result.xml).toContain('CbcOECD');
    expect(result.xml).toContain('MessageType>CbCR');
    expect(result.xml).toContain('Acme Malaysia');
    expect(result.xml).toContain('Acme Singapore');
    expect(result.xml).toContain('ResCountryCode>MY');
    expect(result.xml).toContain('ResCountryCode>SG');
  });

  it('warns about shell entities (no employees + no assets)', () => {
    const { result } = generateCbcrFiling({
      ...baseInput,
      entities: [
        {
          ...baseInput.entities[0]!,
          numberOfEmployees: 0,
          tangibleAssets: 0n,
        },
        baseInput.entities[1]!,
      ],
    });

    const shellWarning = result.validation.warnings.find((w) =>
      w.includes('no employees and no tangible assets')
    );
    expect(shellWarning).toBeDefined();
  });

  it('sets correct version and metadata', () => {
    const { result } = generateCbcrFiling(baseInput);

    expect(result.filingMetadata.version).toBe(1);
    expect(result.filingMetadata.preparedBy).toBe('tax-manager');
    expect(result.filingMetadata.filingJurisdiction).toBe('MY');
  });

  it('provides audit explanation', () => {
    const calc = generateCbcrFiling(baseInput);

    expect(calc.explanation).toContain('CbCR filing');
    expect(calc.explanation).toContain('Acme Group Holdings');
    expect(calc.explanation).toContain('jurisdictions');
  });

  it('warns about negative profit with positive tax', () => {
    const { result } = generateCbcrFiling({
      ...baseInput,
      entities: [
        {
          ...baseInput.entities[0]!,
          profitBeforeTax: -1_000_000n,
          incomeTaxPaid: 500_000n,
        },
        baseInput.entities[1]!,
      ],
    });

    const taxWarning = result.validation.warnings.find((w) =>
      w.includes('negative profit but positive tax')
    );
    expect(taxWarning).toBeDefined();
  });
});
