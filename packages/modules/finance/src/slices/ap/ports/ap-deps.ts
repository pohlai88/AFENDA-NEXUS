import type { IApInvoiceRepo } from './ap-invoice-repo.js';
import type { IPaymentTermsRepo } from './payment-terms-repo.js';
import type { IApPaymentRunRepo } from './payment-run-repo.js';
import type { ISupplierRepo } from './supplier-repo.js';
import type { IApHoldRepo } from './ap-hold-repo.js';
import type { IMatchToleranceRepo } from './match-tolerance-repo.js';
import type { IApPrepaymentRepo } from './prepayment-repo.js';
import type { ISupplierDocumentRepo } from '../services/supplier-portal-document-vault.js';
import type { ISupplierDisputeRepo } from '../services/supplier-portal-dispute.js';
import type { ISupplierNotificationPrefRepo } from '../services/supplier-portal-notifications.js';
import type { ISupplierComplianceRepo } from '../services/supplier-portal-compliance.js';
import type { IInvoiceAttachmentRepo } from '../entities/invoice-attachment.js';

export interface ApDeps {
  readonly apInvoiceRepo: IApInvoiceRepo;
  readonly paymentTermsRepo: IPaymentTermsRepo;
  readonly apPaymentRunRepo: IApPaymentRunRepo;
  readonly supplierRepo: ISupplierRepo;
  readonly apHoldRepo: IApHoldRepo;
  readonly matchToleranceRepo: IMatchToleranceRepo;
  readonly apPrepaymentRepo: IApPrepaymentRepo;
  readonly invoiceAttachmentRepo: IInvoiceAttachmentRepo;
  readonly supplierDocumentRepo: ISupplierDocumentRepo;
  readonly supplierDisputeRepo: ISupplierDisputeRepo;
  readonly supplierNotificationPrefRepo: ISupplierNotificationPrefRepo;
  readonly supplierComplianceRepo: ISupplierComplianceRepo;
}
