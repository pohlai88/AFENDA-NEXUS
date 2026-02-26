/**
 * FA-09 service: Transfer an asset between companies (creates IC journal pair).
 */

import { err, NotFoundError, ValidationError } from '@afenda/core';
import type { Result } from '@afenda/core';
import type { IAssetRepo } from '../ports/asset-repo.js';
import type { IAssetMovementRepo } from '../ports/asset-movement-repo.js';
import type { IOutboxWriter } from '../../../shared/ports/outbox-writer.js';
import { FinanceEventType } from '../../../shared/events.js';

export interface TransferAssetInput {
  readonly tenantId: string;
  readonly userId: string;
  readonly assetId: string;
  readonly toCompanyId: string;
  readonly transferDate: Date;
  readonly transferValue: bigint;
}

export interface TransferAssetResult {
  readonly assetId: string;
  readonly fromCompanyId: string;
  readonly toCompanyId: string;
  readonly transferValue: bigint;
  readonly netBookValue: bigint;
  readonly gainOrLoss: bigint;
}

export async function transferAsset(
  input: TransferAssetInput,
  deps: {
    assetRepo: IAssetRepo;
    assetMovementRepo: IAssetMovementRepo;
    outboxWriter: IOutboxWriter;
  }
): Promise<Result<TransferAssetResult>> {
  const asset = await deps.assetRepo.findById(input.assetId);
  if (!asset) return err(new NotFoundError('Asset', input.assetId));
  if (asset.status === 'DISPOSED')
    return err(new ValidationError('Cannot transfer a disposed asset'));
  if (asset.companyId === input.toCompanyId)
    return err(new ValidationError('Source and destination company must differ'));

  const gainOrLoss = input.transferValue - asset.netBookValue;

  await deps.assetRepo.update(asset.id, {
    companyId: input.toCompanyId,
  });

  await deps.assetMovementRepo.create(input.tenantId, {
    assetId: asset.id,
    movementType: 'TRANSFER',
    movementDate: input.transferDate,
    amount: input.transferValue,
    currencyCode: asset.currencyCode,
    description: `Transfer from ${asset.companyId} to ${input.toCompanyId}, value=${input.transferValue}`,
    fromCompanyId: asset.companyId,
    toCompanyId: input.toCompanyId,
    journalId: null,
    createdBy: input.userId,
  });

  await deps.outboxWriter.write({
    tenantId: input.tenantId,
    eventType: FinanceEventType.ASSET_TRANSFERRED,
    payload: {
      assetId: asset.id,
      fromCompanyId: asset.companyId,
      toCompanyId: input.toCompanyId,
      transferValue: input.transferValue.toString(),
      gainOrLoss: gainOrLoss.toString(),
      userId: input.userId,
    },
  });

  return {
    ok: true,
    value: {
      assetId: asset.id,
      fromCompanyId: asset.companyId,
      toCompanyId: input.toCompanyId,
      transferValue: input.transferValue,
      netBookValue: asset.netBookValue,
      gainOrLoss,
    },
  };
}
