/**
 * WHT certificate entity — withholding tax certificate issued to payees.
 */

export type WhtCertificateStatus = 'DRAFT' | 'ISSUED' | 'CANCELLED';

export interface WhtCertificate {
  readonly id: string;
  readonly tenantId: string;
  readonly payeeId: string;
  readonly payeeName: string;
  readonly payeeType: 'RESIDENT' | 'NON_RESIDENT';
  readonly countryCode: string;
  readonly incomeType: string;
  readonly grossAmount: bigint;
  readonly whtAmount: bigint;
  readonly netAmount: bigint;
  readonly currencyCode: string;
  readonly rateApplied: number;
  readonly treatyRate: number | null;
  readonly certificateNumber: string;
  readonly issueDate: Date;
  readonly taxPeriodStart: Date;
  readonly taxPeriodEnd: Date;
  readonly relatedInvoiceId: string | null;
  readonly relatedPaymentId: string | null;
  readonly status: WhtCertificateStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
