/**
 * Project cost line entity — individual cost posting against a project.
 */

export type CostCategory =
  | 'LABOR'
  | 'MATERIALS'
  | 'SUBCONTRACT'
  | 'TRAVEL'
  | 'EQUIPMENT'
  | 'OVERHEAD'
  | 'OTHER';

export interface ProjectCostLine {
  readonly id: string;
  readonly tenantId: string;
  readonly projectId: string;
  readonly lineNumber: number;
  readonly costDate: Date;
  readonly category: CostCategory;
  readonly description: string;
  readonly amount: bigint;
  readonly currencyCode: string;
  readonly glAccountId: string;
  readonly journalId: string | null;
  readonly employeeId: string | null;
  readonly isBillable: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
