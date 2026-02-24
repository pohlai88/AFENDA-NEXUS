export type HedgeTestMethod = "DOLLAR_OFFSET" | "REGRESSION" | "CRITICAL_TERMS";
export type HedgeTestResult = "EFFECTIVE" | "INEFFECTIVE" | "HIGHLY_EFFECTIVE";

export interface HedgeEffectivenessTest {
  readonly id: string;
  readonly tenantId: string;
  readonly hedgeRelationshipId: string;
  readonly testDate: Date;
  readonly testMethod: HedgeTestMethod;
  readonly result: HedgeTestResult;
  readonly effectivenessRatioBps: number;
  readonly hedgedItemFairValueChange: bigint;
  readonly hedgingInstrumentFairValueChange: bigint;
  readonly ineffectivePortionAmount: bigint;
  readonly currencyCode: string;
  readonly notes: string | null;
  readonly journalId: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface CreateHedgeEffectivenessTestInput {
  readonly hedgeRelationshipId: string;
  readonly testDate: Date;
  readonly testMethod: HedgeTestMethod;
  readonly result: HedgeTestResult;
  readonly effectivenessRatioBps: number;
  readonly hedgedItemFairValueChange: bigint;
  readonly hedgingInstrumentFairValueChange: bigint;
  readonly ineffectivePortionAmount: bigint;
  readonly currencyCode: string;
  readonly notes: string | null;
  readonly journalId: string | null;
}

export interface IHedgeEffectivenessTestRepo {
  findByRelationship(hedgeRelationshipId: string): Promise<readonly HedgeEffectivenessTest[]>;
  findLatest(hedgeRelationshipId: string): Promise<HedgeEffectivenessTest | null>;
  create(tenantId: string, input: CreateHedgeEffectivenessTestInput): Promise<HedgeEffectivenessTest>;
}
