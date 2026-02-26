/**
 * GAP-A2: Drizzle implementation of IApprovalPolicyRepo.
 *
 * Writes to erp.approval_policy. Rules stored as JSONB.
 */
import { eq, and } from 'drizzle-orm';
import type { TenantTx } from '@afenda/db';
import { approvalPolicies } from '@afenda/db';
import type { ApprovalPolicy, ApprovalRule } from '../entities/approval-policy.js';
import type {
  IApprovalPolicyRepo,
  CreateApprovalPolicyInput,
} from '../ports/approval-policy-repo.js';
import { ok, err, NotFoundError } from '@afenda/core';
import type { Result } from '@afenda/core';

/**
 * Parse JSONB `rules` column into typed ApprovalRule[].
 * The column is `jsonb NOT NULL DEFAULT '[]'`, so the runtime value
 * is always a JSON-compatible array — this function documents that contract.
 */
function parseRulesJsonb(raw: unknown): readonly ApprovalRule[] {
  if (!Array.isArray(raw)) return [];
  return raw as ApprovalRule[];
}

/**
 * Serialize ApprovalRule[] into a shape Drizzle can write to the jsonb column.
 * Maps each rule to a plain object so the JSONB column receives a clean
 * JSON-serializable array without relying on double-cast.
 */
function rulesToJsonb(rules: readonly ApprovalRule[]): Record<string, unknown>[] {
  return rules.map((rule) => ({
    condition: { ...rule.condition },
    chain: rule.chain.map((step) => ({ ...step })),
  }));
}

function mapRow(r: typeof approvalPolicies.$inferSelect): ApprovalPolicy {
  return {
    id: r.id!,
    tenantId: r.tenantId,
    companyId: r.companyId,
    entityType: r.entityType,
    name: r.name,
    isActive: r.isActive,
    rules: parseRulesJsonb(r.rules),
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

export class DrizzleApprovalPolicyRepo implements IApprovalPolicyRepo {
  constructor(private readonly tx: TenantTx) {}

  async create(input: CreateApprovalPolicyInput): Promise<Result<ApprovalPolicy>> {
    const [row] = await this.tx
      .insert(approvalPolicies)
      .values({
        tenantId: input.tenantId,
        companyId: input.companyId ?? null,
        entityType: input.entityType,
        name: input.name,
        rules: rulesToJsonb(input.rules),
      })
      .returning();
    if (!row) return err(new NotFoundError('ApprovalPolicy', 'insert-failed'));
    return ok(mapRow(row));
  }

  async findById(id: string): Promise<Result<ApprovalPolicy>> {
    const rows = await this.tx.select().from(approvalPolicies).where(eq(approvalPolicies.id, id));
    if (rows.length === 0) return err(new NotFoundError('ApprovalPolicy', id));
    return ok(mapRow(rows[0]!));
  }

  async findByTenantAndEntityType(tenantId: string, entityType: string): Promise<ApprovalPolicy[]> {
    const rows = await this.tx
      .select()
      .from(approvalPolicies)
      .where(
        and(eq(approvalPolicies.tenantId, tenantId), eq(approvalPolicies.entityType, entityType))
      );
    return rows.map(mapRow);
  }

  async update(
    id: string,
    input: Partial<Pick<ApprovalPolicy, 'name' | 'isActive' | 'rules'>>
  ): Promise<Result<ApprovalPolicy>> {
    const values: Record<string, unknown> = { updatedAt: new Date() };
    if (input.name !== undefined) values.name = input.name;
    if (input.isActive !== undefined) values.isActive = input.isActive;
    if (input.rules !== undefined)
      values.rules = rulesToJsonb(input.rules);

    const [row] = await this.tx
      .update(approvalPolicies)
      .set(values)
      .where(eq(approvalPolicies.id, id))
      .returning();
    if (!row) return err(new NotFoundError('ApprovalPolicy', id));
    return ok(mapRow(row));
  }

  async deactivate(id: string): Promise<Result<void>> {
    const [row] = await this.tx
      .update(approvalPolicies)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(approvalPolicies.id, id))
      .returning();
    if (!row) return err(new NotFoundError('ApprovalPolicy', id));
    return ok(undefined);
  }
}
