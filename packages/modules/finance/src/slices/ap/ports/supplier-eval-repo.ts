import type { Result } from '@afenda/core';
import type {
  SupplierEvalTemplate,
  SupplierEvalCriteria,
  SupplierEvaluation,
  SupplierEvalStatus,
} from '../entities/supplier-evaluation.js';

export interface CreateEvalTemplateInput {
  readonly tenantId: string;
  readonly companyId: string | null;
  readonly criteria: readonly {
    readonly code: string;
    readonly name: string;
    readonly description: string | null;
    readonly weight: number;
    readonly maxScore: number;
  }[];
}

export interface CreateEvaluationInput {
  readonly tenantId: string;
  readonly supplierId: string;
  readonly templateVersionId: string;
  readonly periodStart: Date;
  readonly periodEnd: Date;
  readonly evaluatedBy: string;
  readonly scores: readonly {
    readonly criteriaId: string;
    readonly score: number;
    readonly notes: string | null;
  }[];
  readonly notes: string | null;
}

export interface ISupplierEvalRepo {
  createTemplate(input: CreateEvalTemplateInput): Promise<Result<SupplierEvalTemplate>>;
  findActiveTemplate(
    tenantId: string,
    companyId?: string
  ): Promise<SupplierEvalTemplate | null>;
  findTemplateWithCriteria(
    templateId: string
  ): Promise<{ template: SupplierEvalTemplate; criteria: readonly SupplierEvalCriteria[] } | null>;

  createEvaluation(input: CreateEvaluationInput): Promise<Result<SupplierEvaluation>>;
  findEvaluationById(evaluationId: string): Promise<SupplierEvaluation | null>;
  findEvaluationsBySupplierId(supplierId: string): Promise<readonly SupplierEvaluation[]>;
  updateEvaluationStatus(
    evaluationId: string,
    status: SupplierEvalStatus
  ): Promise<Result<SupplierEvaluation>>;
}
