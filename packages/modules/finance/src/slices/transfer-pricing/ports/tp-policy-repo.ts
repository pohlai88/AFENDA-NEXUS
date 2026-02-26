import type { TpPolicy } from '../entities/tp-policy.js';

export interface CreateTpPolicyInput {
  readonly companyId: string;
  readonly policyName: string;
  readonly method: string;
  readonly benchmarkLowBps: number;
  readonly benchmarkMedianBps: number;
  readonly benchmarkHighBps: number;
}

export interface ITpPolicyRepo {
  findById(id: string): Promise<TpPolicy | null>;
  findAll(): Promise<readonly TpPolicy[]>;
  findByCompany(companyId: string): Promise<readonly TpPolicy[]>;
  create(tenantId: string, input: CreateTpPolicyInput): Promise<TpPolicy>;
  deactivate(id: string): Promise<TpPolicy>;
}
