/**
 * FA service: Run depreciation for all active assets in a period.
 * Creates depreciation schedule entries and emits outbox events.
 */

import type { Result } from '@afenda/core';
import type { IAssetRepo } from '../ports/asset-repo.js';
import type { IDepreciationScheduleRepo } from '../ports/depreciation-schedule-repo.js';
import type { IOutboxWriter } from '../../../shared/ports/outbox-writer.js';
import { computeDepreciation } from '../calculators/depreciation.js';
import type { DepreciationScheduleEntry } from '../entities/depreciation-schedule.js';
import { FinanceEventType } from '../../../shared/events.js';

export interface RunDepreciationInput {
  readonly tenantId: string;
  readonly userId: string;
  readonly periodStart: Date;
  readonly periodEnd: Date;
}

export interface RunDepreciationResult {
  readonly entriesCreated: number;
  readonly totalDepreciation: bigint;
  readonly entries: readonly DepreciationScheduleEntry[];
}

export async function runDepreciation(
  input: RunDepreciationInput,
  deps: {
    assetRepo: IAssetRepo;
    depreciationScheduleRepo: IDepreciationScheduleRepo;
    outboxWriter: IOutboxWriter;
  }
): Promise<Result<RunDepreciationResult>> {
  const assets = await deps.assetRepo.findActive();
  const periodMonths = monthsBetween(input.periodStart, input.periodEnd);
  const entries: DepreciationScheduleEntry[] = [];
  let totalDepreciation = 0n;

  for (const asset of assets) {
    const result = computeDepreciation({
      assetId: asset.id,
      acquisitionCost: asset.acquisitionCost,
      residualValue: asset.residualValue,
      usefulLifeMonths: asset.usefulLifeMonths,
      depreciationMethod: asset.depreciationMethod,
      accumulatedDepreciation: asset.accumulatedDepreciation,
      periodMonths,
    });

    if (result.depreciationAmount <= 0n) continue;

    const entry = await deps.depreciationScheduleRepo.create(input.tenantId, {
      assetId: asset.id,
      componentId: null,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      depreciationAmount: result.depreciationAmount,
      accumulatedDepreciation: result.newAccumulatedDepreciation,
      netBookValue: result.newNetBookValue,
      currencyCode: asset.currencyCode,
      journalId: null,
    });

    await deps.assetRepo.update(asset.id, {
      accumulatedDepreciation: result.newAccumulatedDepreciation,
      netBookValue: result.newNetBookValue,
      status: result.isFullyDepreciated ? 'FULLY_DEPRECIATED' : asset.status,
    });

    entries.push(entry);
    totalDepreciation += result.depreciationAmount;
  }

  await deps.outboxWriter.write({
    tenantId: input.tenantId,
    eventType: FinanceEventType.ASSET_DEPRECIATED,
    payload: {
      entriesCreated: entries.length,
      totalDepreciation: totalDepreciation.toString(),
      userId: input.userId,
    },
  });

  return { ok: true, value: { entriesCreated: entries.length, totalDepreciation, entries } };
}

function monthsBetween(start: Date, end: Date): number {
  return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
}
