/**
 * LA-03 service: Lease modification (remeasurement).
 * Records a lease modification and regenerates the amortization schedule.
 */

import { err, ValidationError } from "@afenda/core";
import type { Result } from "@afenda/core";
import type { ILeaseContractRepo } from "../ports/lease-contract-repo.js";
import type { ILeaseModificationRepo } from "../ports/lease-modification-repo.js";
import type { IOutboxWriter } from "../../../shared/ports/outbox-writer.js";
import type { LeaseModification } from "../entities/lease-modification.js";
import { FinanceEventType } from "../../../shared/events.js";

export interface ModifyLeaseInput {
  readonly tenantId: string;
  readonly userId: string;
  readonly leaseContractId: string;
  readonly modificationDate: Date;
  readonly modificationType: LeaseModification["modificationType"];
  readonly description: string;
  readonly newLeaseTermMonths: number;
  readonly newMonthlyPayment: bigint;
  readonly newDiscountRateBps: number;
  readonly liabilityAdjustment: bigint;
  readonly rouAssetAdjustment: bigint;
  readonly gainLossOnModification: bigint;
  readonly currencyCode: string;
}

export async function modifyLease(
  input: ModifyLeaseInput,
  deps: { leaseContractRepo: ILeaseContractRepo; leaseModificationRepo: ILeaseModificationRepo; outboxWriter: IOutboxWriter },
): Promise<Result<LeaseModification>> {
  const contract = await deps.leaseContractRepo.findById(input.leaseContractId);
  if (!contract) return err(new ValidationError("Lease contract not found"));
  if (contract.status !== "ACTIVE" && contract.status !== "MODIFIED") {
    return err(new ValidationError("Lease must be active or previously modified"));
  }

  const modification = await deps.leaseModificationRepo.create(input.tenantId, {
    leaseContractId: input.leaseContractId,
    modificationDate: input.modificationDate,
    modificationType: input.modificationType,
    description: input.description,
    previousLeaseTermMonths: contract.leaseTermMonths,
    newLeaseTermMonths: input.newLeaseTermMonths,
    previousMonthlyPayment: contract.monthlyPayment,
    newMonthlyPayment: input.newMonthlyPayment,
    previousDiscountRateBps: contract.discountRateBps,
    newDiscountRateBps: input.newDiscountRateBps,
    liabilityAdjustment: input.liabilityAdjustment,
    rouAssetAdjustment: input.rouAssetAdjustment,
    gainLossOnModification: input.gainLossOnModification,
    currencyCode: input.currencyCode,
    modifiedBy: input.userId,
  });

  await deps.leaseContractRepo.updateStatus(input.leaseContractId, "MODIFIED");

  await deps.outboxWriter.write({
    tenantId: input.tenantId,
    eventType: FinanceEventType.LEASE_MODIFIED,
    payload: {
      leaseContractId: input.leaseContractId,
      modificationId: modification.id,
      userId: input.userId,
    },
  });

  return { ok: true, value: modification };
}
