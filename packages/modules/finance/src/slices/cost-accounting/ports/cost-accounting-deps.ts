import type { ICostCenterRepo } from './cost-center-repo.js';
import type { ICostDriverRepo } from './cost-driver-repo.js';
import type { ICostAllocationRunRepo } from './cost-allocation-run-repo.js';

export interface CostAccountingDeps {
  readonly costCenterRepo: ICostCenterRepo;
  readonly costDriverRepo: ICostDriverRepo;
  readonly costAllocationRunRepo: ICostAllocationRunRepo;
}
