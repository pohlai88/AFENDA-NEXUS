import { eq, and } from 'drizzle-orm';
import { ok, err, AppError } from '@afenda/core';
import type { Result } from '@afenda/core';
import type { TenantTx } from '@afenda/db';
import { supplierAccountGroupConfigs } from '@afenda/db';
import type { SupplierAccountGroupConfig } from '../entities/supplier-account-group.js';
import type { SupplierAccountGroup } from '../entities/supplier.js';
import type {
  ISupplierAccountGroupRepo,
  UpsertAccountGroupConfigInput,
} from '../ports/supplier-account-group-repo.js';

type GroupRow = typeof supplierAccountGroupConfigs.$inferSelect;

function mapToDomain(row: GroupRow): SupplierAccountGroupConfig {
  return {
    id: row.id,
    tenantId: row.tenantId,
    accountGroup: row.accountGroup as SupplierAccountGroupConfig['accountGroup'],
    label: row.label,
    requiresApproval: row.requiresApproval,
    requiresTaxVerification: row.requiresTaxVerification,
    requiresBankVerification: row.requiresBankVerification,
    allowOneTimeUse: row.allowOneTimeUse,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleSupplierAccountGroupRepo implements ISupplierAccountGroupRepo {
  constructor(private readonly tx: TenantTx) {}

  async upsert(input: UpsertAccountGroupConfigInput): Promise<Result<SupplierAccountGroupConfig>> {
    const [row] = await this.tx
      .insert(supplierAccountGroupConfigs)
      .values({
        tenantId: input.tenantId,
        accountGroup: input.accountGroup,
        label: input.label,
        requiresApproval: input.requiresApproval,
        requiresTaxVerification: input.requiresTaxVerification,
        requiresBankVerification: input.requiresBankVerification,
        allowOneTimeUse: input.allowOneTimeUse,
        isActive: input.isActive,
      })
      .onConflictDoUpdate({
        target: [
          supplierAccountGroupConfigs.tenantId,
          supplierAccountGroupConfigs.accountGroup,
        ],
        set: {
          label: input.label,
          requiresApproval: input.requiresApproval,
          requiresTaxVerification: input.requiresTaxVerification,
          requiresBankVerification: input.requiresBankVerification,
          allowOneTimeUse: input.allowOneTimeUse,
          isActive: input.isActive,
          updatedAt: new Date(),
        },
      })
      .returning();
    if (!row) return err(new AppError('INTERNAL', 'Failed to upsert account group config'));
    return ok(mapToDomain(row));
  }

  async findAll(tenantId: string): Promise<readonly SupplierAccountGroupConfig[]> {
    const rows = await this.tx
      .select()
      .from(supplierAccountGroupConfigs)
      .where(eq(supplierAccountGroupConfigs.tenantId, tenantId));
    return rows.map(mapToDomain);
  }

  async findByAccountGroup(
    tenantId: string,
    accountGroup: SupplierAccountGroup
  ): Promise<SupplierAccountGroupConfig | null> {
    const rows = await this.tx
      .select()
      .from(supplierAccountGroupConfigs)
      .where(
        and(
          eq(supplierAccountGroupConfigs.tenantId, tenantId),
          eq(supplierAccountGroupConfigs.accountGroup, accountGroup)
        )
      )
      .limit(1);
    return rows[0] ? mapToDomain(rows[0]) : null;
  }
}
