import type { Money } from '@afenda/core';

/**
 * W4-7: WHT certificate / exemption entity.
 *
 * Tracks withholding tax certificates issued for supplier payments
 * and exemption records that skip WHT computation.
 */
export interface WhtCertificate {
  readonly id: string;
  readonly tenantId: string;
  readonly supplierId: string;
  readonly certificateNumber: string;
  readonly certificateType: WhtCertificateType;
  readonly taxYear: number;
  readonly taxPeriod: string;
  readonly incomeType: string;
  readonly grossAmount: Money;
  readonly whtAmount: Money;
  readonly netAmount: Money;
  readonly effectiveRate: number;
  readonly paymentRunId: string | null;
  readonly issuedAt: Date;
  readonly issuedBy: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export type WhtCertificateType = 'STANDARD' | 'EXEMPTION';

export interface WhtExemption {
  readonly id: string;
  readonly tenantId: string;
  readonly supplierId: string;
  readonly incomeType: string;
  readonly exemptionReason: string;
  readonly effectiveFrom: Date;
  readonly effectiveTo: Date;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
