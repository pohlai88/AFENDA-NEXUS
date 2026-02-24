/**
 * FA-10 service: Capitalize a CWIP (Capital Work-In-Progress) asset.
 * Transitions asset status from CWIP to ACTIVE and records the capitalization movement.
 */

import { err, NotFoundError, ValidationError } from "@afenda/core";
import type { Result } from "@afenda/core";
import type { IAssetRepo } from "../ports/asset-repo.js";
import type { IAssetMovementRepo } from "../ports/asset-movement-repo.js";
import type { IOutboxWriter } from "../../../shared/ports/outbox-writer.js";
import { FinanceEventType } from "../../../shared/events.js";

export interface CapitalizeCwipInput {
  readonly tenantId: string;
  readonly userId: string;
  readonly assetId: string;
  readonly capitalizationDate: Date;
  readonly finalCost: bigint;
  readonly usefulLifeMonths: number;
  readonly residualValue: bigint;
}

export interface CapitalizeCwipResult {
  readonly assetId: string;
  readonly previousCost: bigint;
  readonly finalCost: bigint;
  readonly costAdjustment: bigint;
  readonly capitalizationDate: Date;
}

export async function capitalizeCwip(
  input: CapitalizeCwipInput,
  deps: {
    assetRepo: IAssetRepo;
    assetMovementRepo: IAssetMovementRepo;
    outboxWriter: IOutboxWriter;
  },
): Promise<Result<CapitalizeCwipResult>> {
  const asset = await deps.assetRepo.findById(input.assetId);
  if (!asset) return err(new NotFoundError("Asset", input.assetId));
  if (asset.status !== "CWIP")
    return err(
      new ValidationError(
        `Asset status must be CWIP to capitalize, got ${asset.status}`,
      ),
    );
  if (input.finalCost <= 0n)
    return err(new ValidationError("Final cost must be positive"));

  const costAdjustment = input.finalCost - asset.acquisitionCost;

  await deps.assetRepo.update(asset.id, {
    status: "ACTIVE",
    acquisitionCost: input.finalCost,
    acquisitionDate: input.capitalizationDate,
    usefulLifeMonths: input.usefulLifeMonths,
    residualValue: input.residualValue,
    netBookValue: input.finalCost,
    accumulatedDepreciation: 0n,
  });

  await deps.assetMovementRepo.create(input.tenantId, {
    assetId: asset.id,
    movementType: "CAPITALIZATION",
    movementDate: input.capitalizationDate,
    amount: input.finalCost,
    currencyCode: asset.currencyCode,
    description: `CWIP capitalized: previous=${asset.acquisitionCost}, final=${input.finalCost}, adjustment=${costAdjustment}`,
    fromCompanyId: null,
    toCompanyId: null,
    journalId: null,
    createdBy: input.userId,
  });

  await deps.outboxWriter.write({
    tenantId: input.tenantId,
    eventType: FinanceEventType.ASSET_ACQUIRED,
    payload: {
      assetId: asset.id,
      finalCost: input.finalCost.toString(),
      costAdjustment: costAdjustment.toString(),
      capitalizationDate: input.capitalizationDate.toISOString(),
      userId: input.userId,
    },
  });

  return {
    ok: true,
    value: {
      assetId: asset.id,
      previousCost: asset.acquisitionCost,
      finalCost: input.finalCost,
      costAdjustment,
      capitalizationDate: input.capitalizationDate,
    },
  };
}
