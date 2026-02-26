import { eq, desc } from 'drizzle-orm';
import { ok, err, NotFoundError } from '@afenda/core';
import type { Result } from '@afenda/core';
import type { TenantTx } from '@afenda/db';
import { matchTolerances } from '@afenda/db';
import type { MatchTolerance } from '../entities/match-tolerance.js';
import type {
  IMatchToleranceRepo,
  CreateMatchToleranceInput,
  UpdateMatchToleranceInput,
} from '../ports/match-tolerance-repo.js';

type ToleranceRow = typeof matchTolerances.$inferSelect;

function mapToDomain(row: ToleranceRow): MatchTolerance {
  return {
    id: row.id,
    tenantId: row.tenantId,
    scope: row.scope as MatchTolerance['scope'],
    scopeEntityId: row.scopeEntityId ?? null,
    companyId: row.companyId ?? null,
    toleranceBps: row.toleranceBps,
    quantityTolerancePercent: row.quantityTolerancePercent,
    autoHold: row.autoHold,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleMatchToleranceRepo implements IMatchToleranceRepo {
  constructor(private readonly tx: TenantTx) {}

  async create(input: CreateMatchToleranceInput): Promise<Result<MatchTolerance>> {
    const [row] = await this.tx
      .insert(matchTolerances)
      .values({
        tenantId: input.tenantId,
        scope: input.scope as typeof matchTolerances.$inferSelect.scope,
        scopeEntityId: input.scopeEntityId,
        companyId: input.companyId,
        toleranceBps: input.toleranceBps,
        quantityTolerancePercent: input.quantityTolerancePercent,
        autoHold: input.autoHold,
      })
      .returning();

    if (!row) return err(new NotFoundError('MatchTolerance', 'new'));
    return ok(mapToDomain(row));
  }

  async findById(id: string): Promise<Result<MatchTolerance>> {
    const row = await this.tx.query.matchTolerances.findFirst({
      where: eq(matchTolerances.id, id),
    });
    if (!row) return err(new NotFoundError('MatchTolerance', id));
    return ok(mapToDomain(row));
  }

  async findByTenant(tenantId: string): Promise<MatchTolerance[]> {
    const rows = await this.tx.query.matchTolerances.findMany({
      where: eq(matchTolerances.tenantId, tenantId),
      orderBy: [desc(matchTolerances.createdAt)],
    });
    return rows.map(mapToDomain);
  }

  async update(id: string, input: UpdateMatchToleranceInput): Promise<Result<MatchTolerance>> {
    const existing = await this.tx.query.matchTolerances.findFirst({
      where: eq(matchTolerances.id, id),
    });
    if (!existing) return err(new NotFoundError('MatchTolerance', id));

    await this.tx
      .update(matchTolerances)
      .set({
        ...(input.toleranceBps !== undefined && { toleranceBps: input.toleranceBps }),
        ...(input.quantityTolerancePercent !== undefined && {
          quantityTolerancePercent: input.quantityTolerancePercent,
        }),
        ...(input.autoHold !== undefined && { autoHold: input.autoHold }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
        updatedAt: new Date(),
      })
      .where(eq(matchTolerances.id, id));

    return this.findById(id);
  }
}
