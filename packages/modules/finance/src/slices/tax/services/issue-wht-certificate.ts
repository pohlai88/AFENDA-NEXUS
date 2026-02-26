/**
 * TX-06 service: Issue WHT certificate for a payee.
 */

import type { Result } from '@afenda/core';
import type { WhtCertificate } from '../entities/wht-certificate.js';
import type { IWhtCertificateRepo } from '../ports/wht-certificate-repo.js';
import type { IOutboxWriter } from '../../../shared/ports/outbox-writer.js';
import type { IDocumentNumberGenerator } from '../../../shared/ports/journal-posting-port.js';
import { FinanceEventType } from '../../../shared/events.js';

export interface IssueWhtCertificateInput {
  readonly tenantId: string;
  readonly userId: string;
  readonly payeeId: string;
  readonly payeeName: string;
  readonly payeeType: 'RESIDENT' | 'NON_RESIDENT';
  readonly countryCode: string;
  readonly incomeType: string;
  readonly grossAmount: bigint;
  readonly whtAmount: bigint;
  readonly currencyCode: string;
  readonly rateApplied: number;
  readonly treatyRate: number | null;
  readonly issueDate: Date;
  readonly taxPeriodStart: Date;
  readonly taxPeriodEnd: Date;
  readonly relatedInvoiceId: string | null;
  readonly relatedPaymentId: string | null;
}

export async function issueWhtCertificate(
  input: IssueWhtCertificateInput,
  deps: {
    whtCertificateRepo: IWhtCertificateRepo;
    outboxWriter: IOutboxWriter;
    documentNumberGenerator: IDocumentNumberGenerator;
  }
): Promise<Result<WhtCertificate>> {
  const certNumResult = await deps.documentNumberGenerator.next(input.tenantId, 'WHT');
  if (!certNumResult.ok) return certNumResult;
  const certificateNumber = certNumResult.value;

  const cert = await deps.whtCertificateRepo.create(input.tenantId, {
    payeeId: input.payeeId,
    payeeName: input.payeeName,
    payeeType: input.payeeType,
    countryCode: input.countryCode,
    incomeType: input.incomeType,
    grossAmount: input.grossAmount,
    whtAmount: input.whtAmount,
    netAmount: input.grossAmount - input.whtAmount,
    currencyCode: input.currencyCode,
    rateApplied: input.rateApplied,
    treatyRate: input.treatyRate,
    certificateNumber,
    issueDate: input.issueDate,
    taxPeriodStart: input.taxPeriodStart,
    taxPeriodEnd: input.taxPeriodEnd,
    relatedInvoiceId: input.relatedInvoiceId,
    relatedPaymentId: input.relatedPaymentId,
  });

  await deps.outboxWriter.write({
    tenantId: input.tenantId,
    eventType: FinanceEventType.WHT_CERTIFICATE_ISSUED,
    payload: { certificateId: cert.id, payeeId: input.payeeId, userId: input.userId },
  });

  return { ok: true, value: cert };
}
