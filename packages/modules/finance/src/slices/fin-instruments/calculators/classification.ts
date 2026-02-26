/**
 * FI-01: Classification engine — IFRS 9 (business model + SPPI test).
 * Pure calculator — classifies financial instruments into
 * AC (Amortized Cost), FVOCI, or FVTPL.
 */
import type { CalculatorResult } from '../../../shared/types.js';
import type { InstrumentClassification, InstrumentType } from '../entities/financial-instrument.js';

export type BusinessModel = 'HOLD_TO_COLLECT' | 'HOLD_TO_COLLECT_AND_SELL' | 'OTHER';

export interface ClassificationInput {
  readonly instrumentId: string;
  readonly instrumentType: InstrumentType;
  readonly businessModel: BusinessModel;
  readonly passesSppiTest: boolean;
  readonly isDesignatedFvtpl: boolean;
  readonly isEquityInvestment: boolean;
  readonly isDesignatedFvoci: boolean;
}

export interface ClassificationResult {
  readonly instrumentId: string;
  readonly classification: InstrumentClassification;
  readonly reason: string;
}

/**
 * IFRS 9.4.1 classification decision tree:
 * 1. Designated at FVTPL → FVTPL
 * 2. Equity + designated FVOCI → FVOCI
 * 3. Equity + not designated → FVTPL
 * 4. Fails SPPI → FVTPL
 * 5. Hold to collect + passes SPPI → AC
 * 6. Hold to collect & sell + passes SPPI → FVOCI
 * 7. Other business model → FVTPL
 */
export function classifyInstruments(
  inputs: readonly ClassificationInput[]
): CalculatorResult<readonly ClassificationResult[]> {
  if (inputs.length === 0) {
    throw new Error('At least one instrument required');
  }

  const results: ClassificationResult[] = inputs.map((input) => {
    // Fair value option
    if (input.isDesignatedFvtpl) {
      return {
        instrumentId: input.instrumentId,
        classification: 'FVTPL' as InstrumentClassification,
        reason: 'Designated at FVTPL (fair value option)',
      };
    }

    // Equity investments
    if (input.isEquityInvestment) {
      if (input.isDesignatedFvoci) {
        return {
          instrumentId: input.instrumentId,
          classification: 'FVOCI' as InstrumentClassification,
          reason: 'Equity investment designated at FVOCI',
        };
      }
      return {
        instrumentId: input.instrumentId,
        classification: 'FVTPL' as InstrumentClassification,
        reason: 'Equity investment — default FVTPL',
      };
    }

    // SPPI test failure
    if (!input.passesSppiTest) {
      return {
        instrumentId: input.instrumentId,
        classification: 'FVTPL' as InstrumentClassification,
        reason: 'Fails SPPI test — mandatory FVTPL',
      };
    }

    // Business model test
    switch (input.businessModel) {
      case 'HOLD_TO_COLLECT':
        return {
          instrumentId: input.instrumentId,
          classification: 'AMORTIZED_COST' as InstrumentClassification,
          reason: 'Hold to collect + passes SPPI → Amortized Cost',
        };
      case 'HOLD_TO_COLLECT_AND_SELL':
        return {
          instrumentId: input.instrumentId,
          classification: 'FVOCI' as InstrumentClassification,
          reason: 'Hold to collect & sell + passes SPPI → FVOCI',
        };
      default:
        return {
          instrumentId: input.instrumentId,
          classification: 'FVTPL' as InstrumentClassification,
          reason: 'Other business model → FVTPL',
        };
    }
  });

  return {
    result: results,
    inputs: { count: inputs.length },
    explanation: `Classification: ${results.filter((r) => r.classification === 'AMORTIZED_COST').length} AC, ${results.filter((r) => r.classification === 'FVOCI').length} FVOCI, ${results.filter((r) => r.classification === 'FVTPL').length} FVTPL`,
  };
}
