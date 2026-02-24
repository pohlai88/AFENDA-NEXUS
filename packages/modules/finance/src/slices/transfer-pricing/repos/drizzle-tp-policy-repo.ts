import { eq } from "drizzle-orm";
import type { TenantTx } from "@afenda/db";
import { tpPolicies } from "@afenda/db";
import type { TpPolicy } from "../entities/tp-policy.js";
import type { ITpPolicyRepo, CreateTpPolicyInput } from "../ports/tp-policy-repo.js";

type Row = typeof tpPolicies.$inferSelect;

function mapToDomain(row: Row): TpPolicy {
  return {
    id: row.id,
    tenantId: row.tenantId,
    companyId: row.companyId,
    policyName: row.policyName,
    method: row.method,
    benchmarkLowBps: row.benchmarkLowBps,
    benchmarkMedianBps: row.benchmarkMedianBps,
    benchmarkHighBps: row.benchmarkHighBps,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleTpPolicyRepo implements ITpPolicyRepo {
  constructor(private readonly db: TenantTx) {}

  async findById(id: string): Promise<TpPolicy | null> {
    const rows = await this.db.select().from(tpPolicies).where(eq(tpPolicies.id, id)).limit(1);
    return rows[0] ? mapToDomain(rows[0]) : null;
  }

  async findAll(): Promise<readonly TpPolicy[]> {
    const rows = await this.db.select().from(tpPolicies);
    return rows.map(mapToDomain);
  }

  async findByCompany(companyId: string): Promise<readonly TpPolicy[]> {
    const rows = await this.db.select().from(tpPolicies).where(eq(tpPolicies.companyId, companyId));
    return rows.map(mapToDomain);
  }

  async create(tenantId: string, input: CreateTpPolicyInput): Promise<TpPolicy> {
    const [row] = await this.db.insert(tpPolicies).values({ tenantId, ...input }).returning();
    return mapToDomain(row!);
  }

  async deactivate(id: string): Promise<TpPolicy> {
    const [row] = await this.db
      .update(tpPolicies)
      .set({ isActive: false })
      .where(eq(tpPolicies.id, id))
      .returning();
    return mapToDomain(row!);
  }
}
