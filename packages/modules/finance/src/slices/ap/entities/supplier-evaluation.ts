export type SupplierEvalStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED';

export interface SupplierEvalTemplate {
  readonly id: string;
  readonly tenantId: string;
  readonly companyId: string | null;
  readonly version: number;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface SupplierEvalCriteria {
  readonly id: string;
  readonly tenantId: string;
  readonly templateId: string;
  readonly code: string;
  readonly name: string;
  readonly description: string | null;
  readonly weight: number;
  readonly maxScore: number;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface SupplierEvaluation {
  readonly id: string;
  readonly tenantId: string;
  readonly supplierId: string;
  readonly templateVersionId: string;
  readonly periodStart: Date;
  readonly periodEnd: Date;
  readonly evaluatedBy: string;
  readonly status: SupplierEvalStatus;
  readonly overallScore: string | null;
  readonly notes: string | null;
  readonly scores: readonly SupplierEvalScore[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface SupplierEvalScore {
  readonly id: string;
  readonly evaluationId: string;
  readonly criteriaId: string;
  readonly score: number;
  readonly notes: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
