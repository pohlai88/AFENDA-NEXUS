import type { Project } from '../entities/project.js';
import type { ProjectCostLine } from '../entities/project-cost-line.js';
import type { ProjectBilling } from '../entities/project-billing.js';

export interface CreateProjectInput {
  readonly companyId: string;
  readonly projectCode: string;
  readonly name: string;
  readonly description: string | null;
  readonly customerId: string | null;
  readonly managerId: string;
  readonly billingType: Project['billingType'];
  readonly budgetAmount: bigint;
  readonly currencyCode: string;
  readonly startDate: Date;
  readonly endDate: Date | null;
}

export interface CreateProjectCostLineInput {
  readonly projectId: string;
  readonly lineNumber: number;
  readonly costDate: Date;
  readonly category: ProjectCostLine['category'];
  readonly description: string;
  readonly amount: bigint;
  readonly currencyCode: string;
  readonly glAccountId: string;
  readonly journalId: string | null;
  readonly employeeId: string | null;
  readonly isBillable: boolean;
}

export interface CreateProjectBillingInput {
  readonly projectId: string;
  readonly billingDate: Date;
  readonly description: string;
  readonly amount: bigint;
  readonly currencyCode: string;
  readonly milestoneRef: string | null;
}

export interface IProjectRepo {
  findById(id: string): Promise<Project | null>;
  findByCode(projectCode: string): Promise<Project | null>;
  findByCompany(companyId: string): Promise<readonly Project[]>;
  findAll(): Promise<readonly Project[]>;
  create(tenantId: string, input: CreateProjectInput): Promise<Project>;
  update(id: string, input: Partial<Record<string, unknown>>): Promise<Project>;
  findCostLines(projectId: string): Promise<readonly ProjectCostLine[]>;
  createCostLine(tenantId: string, input: CreateProjectCostLineInput): Promise<ProjectCostLine>;
  findBillings(projectId: string): Promise<readonly ProjectBilling[]>;
  createBilling(tenantId: string, input: CreateProjectBillingInput): Promise<ProjectBilling>;
  updateBilling(id: string, input: Partial<Record<string, unknown>>): Promise<ProjectBilling>;
}
