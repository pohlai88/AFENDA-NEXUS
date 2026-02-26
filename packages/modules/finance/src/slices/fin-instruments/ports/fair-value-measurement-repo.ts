import type { FairValueLevel } from '../entities/financial-instrument.js';

export interface FairValueMeasurement {
  readonly id: string;
  readonly tenantId: string;
  readonly instrumentId: string;
  readonly measurementDate: Date;
  readonly fairValueLevel: FairValueLevel;
  readonly fairValue: bigint;
  readonly previousFairValue: bigint | null;
  readonly valuationMethod: string | null;
  readonly currencyCode: string;
  readonly gainOrLoss: bigint | null;
  readonly isRecognizedInPL: boolean;
  readonly journalId: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface CreateFairValueMeasurementInput {
  readonly instrumentId: string;
  readonly measurementDate: Date;
  readonly fairValueLevel: FairValueLevel;
  readonly fairValue: bigint;
  readonly previousFairValue: bigint | null;
  readonly valuationMethod: string | null;
  readonly currencyCode: string;
  readonly gainOrLoss: bigint | null;
  readonly isRecognizedInPL: boolean;
  readonly journalId: string | null;
}

export interface IFairValueMeasurementRepo {
  findByInstrument(instrumentId: string): Promise<readonly FairValueMeasurement[]>;
  findLatest(instrumentId: string): Promise<FairValueMeasurement | null>;
  create(tenantId: string, input: CreateFairValueMeasurementInput): Promise<FairValueMeasurement>;
}
