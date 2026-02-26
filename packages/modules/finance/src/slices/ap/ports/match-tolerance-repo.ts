import type { Result } from '@afenda/core';
import type { MatchTolerance, ToleranceScope } from '../entities/match-tolerance.js';

export interface CreateMatchToleranceInput {
  readonly tenantId: string;
  readonly scope: ToleranceScope;
  readonly scopeEntityId: string | null;
  readonly companyId: string | null;
  readonly toleranceBps: number;
  readonly quantityTolerancePercent: number;
  readonly autoHold: boolean;
}

export interface UpdateMatchToleranceInput {
  readonly toleranceBps?: number;
  readonly quantityTolerancePercent?: number;
  readonly autoHold?: boolean;
  readonly isActive?: boolean;
}

export interface IMatchToleranceRepo {
  create(input: CreateMatchToleranceInput): Promise<Result<MatchTolerance>>;
  findById(id: string): Promise<Result<MatchTolerance>>;
  findByTenant(tenantId: string): Promise<MatchTolerance[]>;
  update(id: string, input: UpdateMatchToleranceInput): Promise<Result<MatchTolerance>>;
}
