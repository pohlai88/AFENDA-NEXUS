import type { Result } from '@afenda/core';
import { ok, err, formatMinorUnits } from '@afenda/core';
import { ValidationError } from '@afenda/core';
import type { ICostCenterRepo } from '../ports/cost-center-repo.js';
import type { ICostDriverRepo } from '../ports/cost-driver-repo.js';
import { computeDirectAllocation } from '../calculators/direct-allocation.js';
import type { AllocationMethodType } from '../entities/cost-allocation-run.js';
import type {
  PostingLinePreview,
  PostingPreviewResult,
} from '../../../shared/types/posting-preview.js';

export interface PreviewCostAllocationInput {
  readonly companyId: string;
  readonly periodId: string;
  readonly method: AllocationMethodType;
  readonly driverId: string;
  readonly currencyCode: string;
}

export async function previewCostAllocation(
  input: PreviewCostAllocationInput,
  deps: {
    costCenterRepo: ICostCenterRepo;
    costDriverRepo: ICostDriverRepo;
  }
): Promise<Result<PostingPreviewResult>> {
  if (!input.companyId) return err(new ValidationError('Company ID is required'));
  if (!input.periodId) return err(new ValidationError('Period ID is required'));

  if (input.method !== 'DIRECT') {
    return err(
      new ValidationError(
        `Preview for method ${input.method} is not yet supported — only DIRECT allocation`
      )
    );
  }

  const warnings: string[] = [];

  const costCenters = await deps.costCenterRepo.findByCompany(input.companyId);
  if (costCenters.length === 0) {
    return err(new ValidationError('No cost centers found for company'));
  }

  const driverValues = await deps.costDriverRepo.getDriverValues(input.driverId, input.periodId);
  if (driverValues.length === 0) {
    return err(new ValidationError('No driver values found for period'));
  }

  const sourceCenterIds = new Set(driverValues.map((v) => v.costCenterId));
  const pools = costCenters
    .filter((cc) => !sourceCenterIds.has(cc.id) && cc.status === 'ACTIVE')
    .map((cc) => ({ sourceCostCenterId: cc.id, totalCost: 0n }));

  const targets = driverValues.map((v) => ({
    costCenterId: v.costCenterId,
    driverQuantity: v.quantity,
  }));

  if (pools.length === 0 || targets.length === 0) {
    warnings.push('No allocation pools or targets found — run would produce zero lines');
    return ok({
      ledgerName: 'Cost Accounting',
      periodName: input.periodId,
      currency: input.currencyCode,
      lines: [],
      warnings,
    });
  }

  const result = computeDirectAllocation({
    pools,
    targets,
    driverId: input.driverId,
    currencyCode: input.currencyCode,
  });

  const lines: PostingLinePreview[] = [];
  for (const line of result.lines) {
    const fromCenter = costCenters.find((cc) => cc.id === line.fromCostCenterId);
    const toCenter = costCenters.find((cc) => cc.id === line.toCostCenterId);

    lines.push({
      accountId: line.fromCostCenterId,
      accountCode: fromCenter?.code ?? line.fromCostCenterId.slice(0, 8),
      accountName: fromCenter?.name ?? '(unknown center)',
      debit: '0.00',
      credit: formatMinorUnits(line.amount),
      description: `Cost allocation from ${fromCenter?.code ?? 'unknown'}`,
    });

    lines.push({
      accountId: line.toCostCenterId,
      accountCode: toCenter?.code ?? line.toCostCenterId.slice(0, 8),
      accountName: toCenter?.name ?? '(unknown center)',
      debit: formatMinorUnits(line.amount),
      credit: '0.00',
      description: `Cost allocation to ${toCenter?.code ?? 'unknown'}`,
    });
  }

  return ok({
    ledgerName: 'Cost Accounting',
    periodName: input.periodId,
    currency: input.currencyCode,
    lines,
    warnings,
  });
}
