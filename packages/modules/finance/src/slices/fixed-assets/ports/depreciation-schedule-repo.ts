import type { DepreciationScheduleEntry } from "../entities/depreciation-schedule.js";

export interface CreateDepreciationEntryInput {
  readonly assetId: string;
  readonly componentId: string | null;
  readonly periodStart: Date;
  readonly periodEnd: Date;
  readonly depreciationAmount: bigint;
  readonly accumulatedDepreciation: bigint;
  readonly netBookValue: bigint;
  readonly currencyCode: string;
  readonly journalId: string | null;
}

export interface IDepreciationScheduleRepo {
  findById(id: string): Promise<DepreciationScheduleEntry | null>;
  findByAsset(assetId: string): Promise<readonly DepreciationScheduleEntry[]>;
  findUnposted(): Promise<readonly DepreciationScheduleEntry[]>;
  create(tenantId: string, input: CreateDepreciationEntryInput): Promise<DepreciationScheduleEntry>;
  markPosted(id: string, journalId: string): Promise<DepreciationScheduleEntry>;
}
