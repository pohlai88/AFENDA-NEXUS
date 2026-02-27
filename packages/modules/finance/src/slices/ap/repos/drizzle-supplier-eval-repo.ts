import { eq, and, desc, sql } from 'drizzle-orm';
import { ok, err, AppError } from '@afenda/core';
import type { Result } from '@afenda/core';
import type { TenantTx } from '@afenda/db';
import {
  supplierEvalTemplates,
  supplierEvalCriteria,
  supplierEvaluations,
  supplierEvalScores,
} from '@afenda/db';
import type {
  SupplierEvalTemplate,
  SupplierEvalCriteria,
  SupplierEvaluation,
  SupplierEvalScore,
  SupplierEvalStatus,
} from '../entities/supplier-evaluation.js';
import type {
  ISupplierEvalRepo,
  CreateEvalTemplateInput,
  CreateEvaluationInput,
} from '../ports/supplier-eval-repo.js';

type TemplateRow = typeof supplierEvalTemplates.$inferSelect;
type CriteriaRow = typeof supplierEvalCriteria.$inferSelect;
type EvalRow = typeof supplierEvaluations.$inferSelect;
type ScoreRow = typeof supplierEvalScores.$inferSelect;

function mapTemplateToDomain(row: TemplateRow): SupplierEvalTemplate {
  return {
    id: row.id,
    tenantId: row.tenantId,
    companyId: row.companyId ?? null,
    version: row.version,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapCriteriaToDomain(row: CriteriaRow): SupplierEvalCriteria {
  return {
    id: row.id,
    tenantId: row.tenantId,
    templateId: row.templateId,
    code: row.code,
    name: row.name,
    description: row.description ?? null,
    weight: row.weight,
    maxScore: row.maxScore,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapScoreToDomain(row: ScoreRow): SupplierEvalScore {
  return {
    id: row.id,
    evaluationId: row.evaluationId,
    criteriaId: row.criteriaId,
    score: row.score,
    notes: row.notes ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapEvalToDomain(row: EvalRow, scores: readonly SupplierEvalScore[]): SupplierEvaluation {
  return {
    id: row.id,
    tenantId: row.tenantId,
    supplierId: row.supplierId,
    templateVersionId: row.templateVersionId,
    periodStart: row.periodStart,
    periodEnd: row.periodEnd,
    evaluatedBy: row.evaluatedBy,
    status: row.status as SupplierEvalStatus,
    overallScore: row.overallScore ?? null,
    notes: row.notes ?? null,
    scores,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleSupplierEvalRepo implements ISupplierEvalRepo {
  constructor(private readonly tx: TenantTx) {}

  async createTemplate(input: CreateEvalTemplateInput): Promise<Result<SupplierEvalTemplate>> {
    const [tplRow] = await this.tx
      .insert(supplierEvalTemplates)
      .values({
        tenantId: input.tenantId,
        companyId: input.companyId,
        version: 1,
        isActive: true,
      })
      .returning();
    if (!tplRow) return err(new AppError('INTERNAL', 'Failed to insert eval template'));

    for (const c of input.criteria) {
      await this.tx.insert(supplierEvalCriteria).values({
        tenantId: input.tenantId,
        templateId: tplRow.id,
        code: c.code,
        name: c.name,
        description: c.description,
        weight: c.weight,
        maxScore: c.maxScore,
      });
    }

    return ok(mapTemplateToDomain(tplRow));
  }

  async findActiveTemplate(
    tenantId: string,
    companyId?: string
  ): Promise<SupplierEvalTemplate | null> {
    const conditions = [
      eq(supplierEvalTemplates.tenantId, tenantId),
      eq(supplierEvalTemplates.isActive, true),
    ];
    if (companyId) {
      conditions.push(
        sql`(${supplierEvalTemplates.companyId} IS NULL OR ${supplierEvalTemplates.companyId} = ${companyId})`
      );
    }
    const rows = await this.tx
      .select()
      .from(supplierEvalTemplates)
      .where(and(...conditions))
      .orderBy(desc(supplierEvalTemplates.version))
      .limit(1);
    return rows[0] ? mapTemplateToDomain(rows[0]) : null;
  }

  async findTemplateWithCriteria(
    templateId: string
  ): Promise<{ template: SupplierEvalTemplate; criteria: readonly SupplierEvalCriteria[] } | null> {
    const tplRows = await this.tx
      .select()
      .from(supplierEvalTemplates)
      .where(eq(supplierEvalTemplates.id, templateId))
      .limit(1);
    if (!tplRows[0]) return null;

    const criteriaRows = await this.tx
      .select()
      .from(supplierEvalCriteria)
      .where(eq(supplierEvalCriteria.templateId, templateId));

    return {
      template: mapTemplateToDomain(tplRows[0]),
      criteria: criteriaRows.map(mapCriteriaToDomain),
    };
  }

  async createEvaluation(input: CreateEvaluationInput): Promise<Result<SupplierEvaluation>> {
    const [evalRow] = await this.tx
      .insert(supplierEvaluations)
      .values({
        tenantId: input.tenantId,
        supplierId: input.supplierId,
        templateVersionId: input.templateVersionId,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        evaluatedBy: input.evaluatedBy,
        status: 'DRAFT',
        notes: input.notes,
      })
      .returning();
    if (!evalRow) return err(new AppError('INTERNAL', 'Failed to insert evaluation'));

    const scoreEntities: SupplierEvalScore[] = [];
    for (const s of input.scores) {
      const [scoreRow] = await this.tx
        .insert(supplierEvalScores)
        .values({
          tenantId: input.tenantId,
          evaluationId: evalRow.id,
          criteriaId: s.criteriaId,
          score: s.score,
          notes: s.notes,
        })
        .returning();
      if (scoreRow) scoreEntities.push(mapScoreToDomain(scoreRow));
    }

    return ok(mapEvalToDomain(evalRow, scoreEntities));
  }

  async findEvaluationById(evaluationId: string): Promise<SupplierEvaluation | null> {
    const rows = await this.tx
      .select()
      .from(supplierEvaluations)
      .where(eq(supplierEvaluations.id, evaluationId))
      .limit(1);
    if (!rows[0]) return null;

    const scoreRows = await this.tx
      .select()
      .from(supplierEvalScores)
      .where(eq(supplierEvalScores.evaluationId, evaluationId));

    return mapEvalToDomain(rows[0], scoreRows.map(mapScoreToDomain));
  }

  async findEvaluationsBySupplierId(supplierId: string): Promise<readonly SupplierEvaluation[]> {
    const evalRows = await this.tx
      .select()
      .from(supplierEvaluations)
      .where(eq(supplierEvaluations.supplierId, supplierId))
      .orderBy(desc(supplierEvaluations.createdAt));

    const results: SupplierEvaluation[] = [];
    for (const row of evalRows) {
      const scoreRows = await this.tx
        .select()
        .from(supplierEvalScores)
        .where(eq(supplierEvalScores.evaluationId, row.id));
      results.push(mapEvalToDomain(row, scoreRows.map(mapScoreToDomain)));
    }
    return results;
  }

  async updateEvaluationStatus(
    evaluationId: string,
    status: SupplierEvalStatus
  ): Promise<Result<SupplierEvaluation>> {
    const [row] = await this.tx
      .update(supplierEvaluations)
      .set({ status, updatedAt: new Date() })
      .where(eq(supplierEvaluations.id, evaluationId))
      .returning();
    if (!row) return err(new AppError('NOT_FOUND', 'Evaluation not found'));

    const scoreRows = await this.tx
      .select()
      .from(supplierEvalScores)
      .where(eq(supplierEvalScores.evaluationId, evaluationId));

    return ok(mapEvalToDomain(row, scoreRows.map(mapScoreToDomain)));
  }
}
