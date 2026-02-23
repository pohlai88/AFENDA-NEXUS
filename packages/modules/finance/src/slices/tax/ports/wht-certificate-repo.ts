import type { WhtCertificate } from "../entities/wht-certificate.js";

export interface CreateWhtCertificateInput {
  readonly payeeId: string;
  readonly payeeName: string;
  readonly payeeType: WhtCertificate["payeeType"];
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
}

export interface IWhtCertificateRepo {
  findById(id: string): Promise<WhtCertificate | null>;
  findByPayee(payeeId: string): Promise<readonly WhtCertificate[]>;
  findByPeriod(periodStart: Date, periodEnd: Date): Promise<readonly WhtCertificate[]>;
  findAll(): Promise<readonly WhtCertificate[]>;
  create(tenantId: string, input: CreateWhtCertificateInput): Promise<WhtCertificate>;
  updateStatus(id: string, status: WhtCertificate["status"]): Promise<WhtCertificate>;
}
