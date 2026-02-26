import { eq } from 'drizzle-orm';
import type { TenantTx } from '@afenda/db';
import { projects, projectCostLines, projectBillings } from '@afenda/db';
import type { Project } from '../entities/project.js';
import type { ProjectCostLine } from '../entities/project-cost-line.js';
import type { ProjectBilling } from '../entities/project-billing.js';
import type {
  IProjectRepo,
  CreateProjectInput,
  CreateProjectCostLineInput,
  CreateProjectBillingInput,
} from '../ports/project-repo.js';

type ProjRow = typeof projects.$inferSelect;
type CostRow = typeof projectCostLines.$inferSelect;
type BillRow = typeof projectBillings.$inferSelect;

function mapProjectToDomain(row: ProjRow): Project {
  return {
    id: row.id,
    tenantId: row.tenantId,
    companyId: row.companyId,
    projectCode: row.projectCode,
    name: row.name,
    description: row.description,
    customerId: row.customerId,
    managerId: row.managerId,
    status: row.status as Project['status'],
    billingType: row.billingType as Project['billingType'],
    budgetAmount: row.budgetAmount,
    actualCost: row.actualCost,
    billedAmount: row.billedAmount,
    currencyCode: row.currencyCode,
    startDate: row.startDate,
    endDate: row.endDate,
    completionPct: row.completionPct,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapCostToDomain(row: CostRow): ProjectCostLine {
  return {
    id: row.id,
    tenantId: row.tenantId,
    projectId: row.projectId,
    lineNumber: row.lineNumber,
    costDate: row.costDate,
    category: row.category as ProjectCostLine['category'],
    description: row.description,
    amount: row.amount,
    currencyCode: row.currencyCode,
    glAccountId: row.glAccountId,
    journalId: row.journalId,
    employeeId: row.employeeId,
    isBillable: row.isBillable,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapBillingToDomain(row: BillRow): ProjectBilling {
  return {
    id: row.id,
    tenantId: row.tenantId,
    projectId: row.projectId,
    billingDate: row.billingDate,
    description: row.description,
    amount: row.amount,
    currencyCode: row.currencyCode,
    status: row.status as ProjectBilling['status'],
    milestoneRef: row.milestoneRef,
    arInvoiceId: row.arInvoiceId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleProjectRepo implements IProjectRepo {
  constructor(private readonly db: TenantTx) {}

  async findById(id: string): Promise<Project | null> {
    const rows = await this.db.select().from(projects).where(eq(projects.id, id)).limit(1);
    return rows[0] ? mapProjectToDomain(rows[0]) : null;
  }

  async findByCode(projectCode: string): Promise<Project | null> {
    const rows = await this.db
      .select()
      .from(projects)
      .where(eq(projects.projectCode, projectCode))
      .limit(1);
    return rows[0] ? mapProjectToDomain(rows[0]) : null;
  }

  async findByCompany(companyId: string): Promise<readonly Project[]> {
    const rows = await this.db.select().from(projects).where(eq(projects.companyId, companyId));
    return rows.map(mapProjectToDomain);
  }

  async findAll(): Promise<readonly Project[]> {
    const rows = await this.db.select().from(projects);
    return rows.map(mapProjectToDomain);
  }

  async create(tenantId: string, input: CreateProjectInput): Promise<Project> {
    const [row] = await this.db
      .insert(projects)
      .values({
        tenantId,
        companyId: input.companyId,
        projectCode: input.projectCode,
        name: input.name,
        description: input.description,
        customerId: input.customerId,
        managerId: input.managerId,
        billingType: input.billingType,
        budgetAmount: input.budgetAmount,
        currencyCode: input.currencyCode,
        startDate: input.startDate,
        endDate: input.endDate,
      })
      .returning();
    return mapProjectToDomain(row!);
  }

  async update(id: string, input: Partial<Record<string, unknown>>): Promise<Project> {
    const [row] = await this.db.update(projects).set(input).where(eq(projects.id, id)).returning();
    return mapProjectToDomain(row!);
  }

  async findCostLines(projectId: string): Promise<readonly ProjectCostLine[]> {
    const rows = await this.db
      .select()
      .from(projectCostLines)
      .where(eq(projectCostLines.projectId, projectId));
    return rows.map(mapCostToDomain);
  }

  async createCostLine(
    tenantId: string,
    input: CreateProjectCostLineInput
  ): Promise<ProjectCostLine> {
    const [row] = await this.db
      .insert(projectCostLines)
      .values({
        tenantId,
        projectId: input.projectId,
        lineNumber: input.lineNumber,
        costDate: input.costDate,
        category: input.category,
        description: input.description,
        amount: input.amount,
        currencyCode: input.currencyCode,
        glAccountId: input.glAccountId,
        journalId: input.journalId,
        employeeId: input.employeeId,
        isBillable: input.isBillable,
      })
      .returning();
    return mapCostToDomain(row!);
  }

  async findBillings(projectId: string): Promise<readonly ProjectBilling[]> {
    const rows = await this.db
      .select()
      .from(projectBillings)
      .where(eq(projectBillings.projectId, projectId));
    return rows.map(mapBillingToDomain);
  }

  async createBilling(tenantId: string, input: CreateProjectBillingInput): Promise<ProjectBilling> {
    const [row] = await this.db
      .insert(projectBillings)
      .values({
        tenantId,
        projectId: input.projectId,
        billingDate: input.billingDate,
        description: input.description,
        amount: input.amount,
        currencyCode: input.currencyCode,
        milestoneRef: input.milestoneRef,
      })
      .returning();
    return mapBillingToDomain(row!);
  }

  async updateBilling(
    id: string,
    input: Partial<Record<string, unknown>>
  ): Promise<ProjectBilling> {
    const [row] = await this.db
      .update(projectBillings)
      .set(input)
      .where(eq(projectBillings.id, id))
      .returning();
    return mapBillingToDomain(row!);
  }
}
