import type { ProvisionMovement } from '../entities/provision-movement.js';

export interface CreateProvisionMovementInput {
  readonly provisionId: string;
  readonly movementDate: Date;
  readonly movementType: ProvisionMovement['movementType'];
  readonly amount: bigint;
  readonly balanceAfter: bigint;
  readonly description: string;
  readonly journalId: string | null;
  readonly currencyCode: string;
  readonly createdBy: string;
}

export interface IProvisionMovementRepo {
  findByProvision(provisionId: string): Promise<readonly ProvisionMovement[]>;
  create(tenantId: string, input: CreateProvisionMovementInput): Promise<ProvisionMovement>;
}
