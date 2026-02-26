import type { IApInvoiceRepo } from './ap-invoice-repo.js';
import type { IPaymentTermsRepo } from './payment-terms-repo.js';
import type { IApPaymentRunRepo } from './payment-run-repo.js';

export interface ApDeps {
  readonly apInvoiceRepo: IApInvoiceRepo;
  readonly paymentTermsRepo: IPaymentTermsRepo;
  readonly apPaymentRunRepo: IApPaymentRunRepo;
}
