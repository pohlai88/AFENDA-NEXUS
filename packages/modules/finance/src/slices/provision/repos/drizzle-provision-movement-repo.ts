import { eq } from 'drizzle-orm';
import type { TenantTx } from '@afenda/db';
import { provisionMovements } from '@afenda/db';
import type { ProvisionMovement } from '../entities/provision-movement.js';
import type {
  IProvisionMovementRepo,
  CreateProvisionMovementInput,
} from '../ports/provision-movement-repo.js';

type Row = typeof provisionMovements.$inferSelect;

function mapToDomain(row: Row): ProvisionMovement {
  return {
    id: row.id,
    tenantId: row.tenantId,
    provisionId: row.provisionId,
    movementDate: row.movementDate,
    movementType: row.movementType as ProvisionMovement['movementType'],
    amount: row.amount,
    balanceAfter: row.balanceAfter,
    description: row.description,
    journalId: row.journalId,
    currencyCode: row.currencyCode,
    createdBy: row.createdBy,
    createdAt: row.createdAt,
  };
}

export class DrizzleProvisionMovementRepo implements IProvisionMovementRepo {
  constructor(private readonly db: TenantTx) {}

  async findByProvision(provisionId: string): Promise<readonly ProvisionMovement[]> {
    const rows = await this.db
      .select()
      .from(provisionMovements)
      .where(eq(provisionMovements.provisionId, provisionId));
    return rows.map(mapToDomain);
  }

  async create(tenantId: string, input: CreateProvisionMovementInput): Promise<ProvisionMovement> {
    const [row] = await this.db
      .insert(provisionMovements)
      .values({ tenantId, ...input })
      .returning();
    return mapToDomain(row!);
  }
}
