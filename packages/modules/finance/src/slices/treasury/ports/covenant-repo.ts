import type { Covenant } from '../entities/covenant.js';

export interface CreateCovenantInput {
  readonly companyId: string;
  readonly lenderId: string;
  readonly lenderName: string;
  readonly covenantType: Covenant['covenantType'];
  readonly description: string;
  readonly thresholdValue: number;
  readonly testFrequency: string;
  readonly nextTestDate: Date | null;
}

export interface ICovenantRepo {
  findById(id: string): Promise<Covenant | null>;
  findByCompany(companyId: string): Promise<readonly Covenant[]>;
  findAll(): Promise<readonly Covenant[]>;
  create(tenantId: string, input: CreateCovenantInput): Promise<Covenant>;
  updateTestResult(
    id: string,
    currentValue: number,
    status: Covenant['status'],
    lastTestDate: Date
  ): Promise<Covenant>;
}
