/**
 * CA-08: Run cost allocation service.
 * Orchestrates a cost allocation run using the specified method.
 */

import { err, ValidationError } from '@afenda/core';
import type { Result } from '@afenda/core';
import type { ICostAllocationRunRepo } from '../ports/cost-allocation-run-repo.js';
import type { ICostCenterRepo } from '../ports/cost-center-repo.js';
import type { ICostDriverRepo } from '../ports/cost-driver-repo.js';
import type { IOutboxWriter } from '../../../shared/ports/outbox-writer.js';
import type { CostAllocationRun, AllocationMethodType } from '../entities/cost-allocation-run.js';
import { computeDirectAllocation } from '../calculators/direct-allocation.js';
import { FinanceEventType } from '../../../shared/events.js';

export interface RunAllocationInput {
  readonly tenantId: string;
  readonly userId: string;
  readonly companyId: string;
  readonly periodId: string;
  readonly method: AllocationMethodType;
  readonly driverId: string;
  readonly currencyCode: string;
}

export async function runCostAllocation(
  input: RunAllocationInput,
  deps: {
    costAllocationRunRepo: ICostAllocationRunRepo;
    costCenterRepo: ICostCenterRepo;
    costDriverRepo: ICostDriverRepo;
    outboxWriter: IOutboxWriter;
  }
): Promise<Result<CostAllocationRun>> {
  if (!input.companyId) return err(new ValidationError('Company ID is required'));
  if (!input.periodId) return err(new ValidationError('Period ID is required'));

  // Create the run record
  const run = await deps.costAllocationRunRepo.create(input.tenantId, {
    companyId: input.companyId,
    periodId: input.periodId,
    method: input.method,
    currencyCode: input.currencyCode,
    executedBy: input.userId,
  });

  try {
    // Mark as running
    await deps.costAllocationRunRepo.updateStatus(run.id, 'RUNNING', 0n, 0);

    // Get cost centers and driver values
    const costCenters = await deps.costCenterRepo.findByCompany(input.companyId);
    if (costCenters.length === 0) {
      await deps.costAllocationRunRepo.updateStatus(run.id, 'FAILED', 0n, 0);
      return err(new ValidationError('No cost centers found for company'));
    }

    const driverValues = await deps.costDriverRepo.getDriverValues(input.driverId, input.periodId);
    if (driverValues.length === 0) {
      await deps.costAllocationRunRepo.updateStatus(run.id, 'FAILED', 0n, 0);
      return err(new ValidationError('No driver values found for period'));
    }

    // For now, support DIRECT method — step-down and reciprocal use the same pattern
    // but require additional configuration (sequence order / percentage matrix)
    if (input.method !== 'DIRECT') {
      await deps.costAllocationRunRepo.updateStatus(run.id, 'FAILED', 0n, 0);
      return err(
        new ValidationError(
          `Method ${input.method} requires additional configuration — use direct allocation or provide step-down/reciprocal config`
        )
      );
    }

    // Build allocation input from driver values
    // Service cost centers (those with driver values as source) allocate to production centers
    const sourceCenterIds = new Set(driverValues.map((v) => v.costCenterId));
    const pools = costCenters
      .filter((cc) => !sourceCenterIds.has(cc.id) && cc.status === 'ACTIVE')
      .map((cc) => ({ sourceCostCenterId: cc.id, totalCost: 0n }));

    // If no pools found, use all active cost centers as targets
    const targets = driverValues.map((v) => ({
      costCenterId: v.costCenterId,
      driverQuantity: v.quantity,
    }));

    if (pools.length === 0 || targets.length === 0) {
      await deps.costAllocationRunRepo.updateStatus(run.id, 'COMPLETED', 0n, 0);
      return {
        ok: true,
        value: (await deps.costAllocationRunRepo.findById(run.id)) as CostAllocationRun,
      };
    }

    const result = computeDirectAllocation({
      pools,
      targets,
      driverId: input.driverId,
      currencyCode: input.currencyCode,
    });

    // Persist allocation lines
    const lines = await deps.costAllocationRunRepo.createLines(
      input.tenantId,
      result.lines.map((l) => ({
        runId: run.id,
        fromCostCenterId: l.fromCostCenterId,
        toCostCenterId: l.toCostCenterId,
        driverId: input.driverId,
        amount: l.amount,
        driverQuantity: l.driverQuantity,
        allocationRate: l.allocationRate,
      }))
    );

    // Mark completed
    const completed = await deps.costAllocationRunRepo.updateStatus(
      run.id,
      'COMPLETED',
      result.totalAllocated,
      lines.length
    );

    await deps.outboxWriter.write({
      tenantId: input.tenantId,
      eventType: FinanceEventType.COST_ALLOCATION_COMPLETED,
      payload: {
        runId: run.id,
        method: input.method,
        totalAllocated: result.totalAllocated.toString(),
        lineCount: lines.length,
        userId: input.userId,
      },
    });

    return { ok: true, value: completed };
  } catch (error) {
    await deps.costAllocationRunRepo.updateStatus(run.id, 'FAILED', 0n, 0);
    throw error;
  }
}
