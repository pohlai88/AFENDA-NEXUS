import type { Result } from '@afenda/core';
import { ok } from '@afenda/core';
import type { IApInvoiceRepo } from '../ports/ap-invoice-repo.js';
import type { ISupplierRepo } from '../ports/supplier-repo.js';
import type { IPaymentTermsRepo } from '../ports/payment-terms-repo.js';
import { computePaymentProposal } from '../calculators/payment-proposal.js';
import type { PaymentProposal, ProposableSupplier } from '../calculators/payment-proposal.js';
import type { FinanceContext } from '../../../shared/finance-context.js';

/**
 * W3-1: Payment proposal service.
 * Fetches unpaid invoices, suppliers, payment terms, and runs computePaymentProposal.
 */

export interface GetPaymentProposalInput {
  readonly tenantId: string;
  readonly companyId: string;
  readonly runDate: Date;
  readonly cutoffDate: Date;
  readonly currencyCode: string;
  readonly includeDiscountOpportunities?: boolean;
}

export async function getPaymentProposal(
  input: GetPaymentProposalInput,
  deps: {
    apInvoiceRepo: IApInvoiceRepo;
    supplierRepo: ISupplierRepo;
    paymentTermsRepo: IPaymentTermsRepo;
  },
  _ctx?: FinanceContext
): Promise<Result<PaymentProposal>> {
  const unpaid = await deps.apInvoiceRepo.findUnpaid();

  const proposableInvoices = unpaid
    .filter(
      (inv) =>
        inv.status === 'POSTED' ||
        inv.status === 'APPROVED' ||
        inv.status === 'PARTIALLY_PAID'
    )
    .filter((inv) => inv.totalAmount.currency === input.currencyCode)
    .map((inv) => ({
      id: inv.id,
      supplierId: inv.supplierId,
      invoiceNumber: inv.invoiceNumber,
      invoiceDate: inv.invoiceDate,
      dueDate: inv.dueDate,
      totalAmount: inv.totalAmount.amount,
      paidAmount: inv.paidAmount.amount,
      currencyCode: inv.totalAmount.currency,
      paymentTermsId: inv.paymentTermsId,
    }));

  const supplierIds = [...new Set(proposableInvoices.map((i) => i.supplierId))];
  const suppliers = new Map<string, ProposableSupplier>();
  for (const sid of supplierIds) {
    const s = await deps.supplierRepo.findById(sid);
    if (s.ok) {
      const primary = s.value.bankAccounts.find((b) => b.isPrimary) ?? s.value.bankAccounts[0];
      suppliers.set(sid, {
        id: s.value.id,
        name: s.value.name,
        currencyCode: s.value.currencyCode,
        defaultPaymentMethod: s.value.defaultPaymentMethod,
        primaryBankAccountId: primary?.id ?? null,
      });
    }
  }

  const termsIds = [
    ...new Set(
      proposableInvoices
        .map((i) => i.paymentTermsId)
        .filter((id): id is string => id != null)
    ),
  ];
  const paymentTerms = new Map<string, import('../entities/payment-terms.js').PaymentTerms>();
  for (const tid of termsIds) {
    const t = await deps.paymentTermsRepo.findById(tid);
    if (t.ok) paymentTerms.set(tid, t.value);
  }

  const proposal = computePaymentProposal({
    invoices: proposableInvoices,
    suppliers,
    paymentTerms,
    paymentDate: input.runDate,
    cutoffDate: input.cutoffDate,
    includeDiscountOpportunities: input.includeDiscountOpportunities ?? true,
    currencyFilter: input.currencyCode,
  });

  return ok(proposal);
}
