import type { DeferredTaxItem } from '../entities/deferred-tax-item.js';

export interface CreateDeferredTaxItemInput {
  readonly companyId: string;
  readonly itemName: string;
  readonly origin: string;
  readonly carryingAmount: bigint;
  readonly taxBase: bigint;
  readonly temporaryDifference: bigint;
  readonly taxRateBps: number;
  readonly deferredTaxAsset: bigint;
  readonly deferredTaxLiability: bigint;
  readonly isRecognized: boolean;
  readonly currencyCode: string;
  readonly periodId: string;
}

export interface IDeferredTaxItemRepo {
  findById(id: string): Promise<DeferredTaxItem | null>;
  findAll(): Promise<readonly DeferredTaxItem[]>;
  findByCompany(companyId: string): Promise<readonly DeferredTaxItem[]>;
  findByPeriod(periodId: string): Promise<readonly DeferredTaxItem[]>;
  create(tenantId: string, input: CreateDeferredTaxItemInput): Promise<DeferredTaxItem>;
  updateRecognition(id: string, isRecognized: boolean): Promise<DeferredTaxItem>;
}
