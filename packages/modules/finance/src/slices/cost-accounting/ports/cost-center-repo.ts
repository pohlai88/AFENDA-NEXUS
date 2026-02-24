import type { CostCenter } from "../entities/cost-center.js";

export interface CreateCostCenterInput {
  readonly companyId: string;
  readonly code: string;
  readonly name: string;
  readonly parentId: string | null;
  readonly level: number;
  readonly currencyCode: string;
  readonly managerId: string | null;
  readonly effectiveFrom: Date;
  readonly effectiveTo: Date | null;
}

export interface ICostCenterRepo {
  findById(id: string): Promise<CostCenter | null>;
  findByCode(companyId: string, code: string): Promise<CostCenter | null>;
  findByCompany(companyId: string): Promise<readonly CostCenter[]>;
  findChildren(parentId: string): Promise<readonly CostCenter[]>;
  findAll(): Promise<readonly CostCenter[]>;
  create(tenantId: string, input: CreateCostCenterInput): Promise<CostCenter>;
  update(id: string, input: Partial<CreateCostCenterInput & { status: CostCenter["status"] }>): Promise<CostCenter>;
}
