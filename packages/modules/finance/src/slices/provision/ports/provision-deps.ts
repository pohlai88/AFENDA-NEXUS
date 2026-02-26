import type { IProvisionRepo } from './provision-repo.js';
import type { IProvisionMovementRepo } from './provision-movement-repo.js';

export interface ProvisionDeps {
  readonly provisionRepo: IProvisionRepo;
  readonly provisionMovementRepo: IProvisionMovementRepo;
}
