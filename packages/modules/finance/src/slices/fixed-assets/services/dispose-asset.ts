/**
 * FA service: Dispose an asset and record gain/loss.
 */

import { err, NotFoundError, ValidationError } from '@afenda/core';
import type { Result } from '@afenda/core';
import type { IAssetRepo } from '../ports/asset-repo.js';
import type { IAssetMovementRepo } from '../ports/asset-movement-repo.js';
import type { IOutboxWriter } from '../../../shared/ports/outbox-writer.js';
import { computeDisposal, type DisposalResult } from '../calculators/disposal.js';
import { FinanceEventType } from '../../../shared/events.js';

export interface DisposeAssetInput {
  readonly tenantId: string;
  readonly userId: string;
  readonly assetId: string;
  readonly disposalProceeds: bigint;
  readonly disposalCosts: bigint;
  readonly disposalDate: Date;
}

export async function disposeAsset(
  input: DisposeAssetInput,
  deps: {
    assetRepo: IAssetRepo;
    assetMovementRepo: IAssetMovementRepo;
    outboxWriter: IOutboxWriter;
  }
): Promise<Result<DisposalResult>> {
  const asset = await deps.assetRepo.findById(input.assetId);
  if (!asset) return err(new NotFoundError('Asset', input.assetId));
  if (asset.status === 'DISPOSED') return err(new ValidationError('Asset already disposed'));

  const result = computeDisposal({
    assetId: asset.id,
    netBookValue: asset.netBookValue,
    disposalProceeds: input.disposalProceeds,
    disposalCosts: input.disposalCosts,
    currencyCode: asset.currencyCode,
  });

  await deps.assetRepo.update(asset.id, {
    status: 'DISPOSED',
    disposedAt: input.disposalDate,
    disposalProceeds: input.disposalProceeds,
  });

  await deps.assetMovementRepo.create(input.tenantId, {
    assetId: asset.id,
    movementType: 'DISPOSAL',
    movementDate: input.disposalDate,
    amount: result.gainOrLoss,
    currencyCode: asset.currencyCode,
    description: `Disposal: proceeds=${input.disposalProceeds}, costs=${input.disposalCosts}, gain/loss=${result.gainOrLoss}`,
    fromCompanyId: asset.companyId,
    toCompanyId: null,
    journalId: null,
    createdBy: input.userId,
  });

  await deps.outboxWriter.write({
    tenantId: input.tenantId,
    eventType: FinanceEventType.ASSET_DISPOSED,
    payload: { assetId: asset.id, gainOrLoss: result.gainOrLoss.toString(), userId: input.userId },
  });

  return { ok: true, value: result };
}
