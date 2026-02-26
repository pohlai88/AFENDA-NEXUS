import type { Result, PaginationParams, PaginatedResult } from '@afenda/core';
import type { WhtCertificate, WhtExemption } from '../entities/wht-certificate.js';

export interface CreateWhtCertificateInput {
  readonly tenantId: string;
  readonly supplierId: string;
  readonly certificateNumber: string;
  readonly certificateType: 'STANDARD' | 'EXEMPTION';
  readonly taxYear: number;
  readonly taxPeriod: string;
  readonly incomeType: string;
  readonly grossAmount: bigint;
  readonly whtAmount: bigint;
  readonly netAmount: bigint;
  readonly effectiveRate: number;
  readonly paymentRunId: string | null;
  readonly issuedBy: string;
}

export interface CreateWhtExemptionInput {
  readonly tenantId: string;
  readonly supplierId: string;
  readonly incomeType: string;
  readonly exemptionReason: string;
  readonly effectiveFrom: Date;
  readonly effectiveTo: Date;
}

export interface IWhtCertificateRepo {
  createCertificate(input: CreateWhtCertificateInput): Promise<Result<WhtCertificate>>;
  findCertificateById(id: string): Promise<Result<WhtCertificate>>;
  findCertificatesBySupplier(
    supplierId: string,
    params?: PaginationParams
  ): Promise<PaginatedResult<WhtCertificate>>;
  findCertificatesByTaxYear(
    taxYear: number,
    params?: PaginationParams
  ): Promise<PaginatedResult<WhtCertificate>>;

  createExemption(input: CreateWhtExemptionInput): Promise<Result<WhtExemption>>;
  findActiveExemption(
    supplierId: string,
    incomeType: string,
    asOf: Date
  ): Promise<WhtExemption | null>;
  deactivateExemption(id: string): Promise<Result<WhtExemption>>;
}
