import type { Result } from '@afenda/core';
import { ok } from '@afenda/core';
import type { IApInvoiceRepo } from '../ports/ap-invoice-repo.js';
import type { IPaymentTermsRepo } from '../ports/payment-terms-repo.js';
import { computeEarlyPaymentDiscount } from '../calculators/early-payment-discount.js';
import type { FinanceContext } from '../../../shared/finance-context.js';

/**
 * Returns early payment discount info for an invoice using the given payment date.
 * Used to show "Pay by X to save Y%" badge on invoice detail.
 */

export interface InvoiceEarlyDiscountInput {
  readonly tenantId: string;
  readonly invoiceId: string;
  /** Payment date for eligibility (e.g. today or payment run date). */
  readonly paymentDate: Date;
}

export interface InvoiceEarlyDiscountResult {
  readonly eligible: boolean;
  readonly discountDeadline: string | null;
  readonly savingsPercent: number;
  readonly discountAmount: string;
  readonly netPayable: string;
  readonly currencyCode: string;
}

export async function getInvoiceEarlyDiscount(
  input: InvoiceEarlyDiscountInput,
  deps: {
    apInvoiceRepo: IApInvoiceRepo;
    paymentTermsRepo: IPaymentTermsRepo;
  },
  _ctx?: FinanceContext
): Promise<Result<InvoiceEarlyDiscountResult | null>> {
  const invResult = await deps.apInvoiceRepo.findById(input.invoiceId);
  if (!invResult.ok) return invResult as Result<null>;
  const inv = invResult.value;

  if (!inv.paymentTermsId) return ok(null);

  const termsResult = await deps.paymentTermsRepo.findById(inv.paymentTermsId);
  if (!termsResult.ok) return ok(null);

  const outstanding = inv.totalAmount.amount - inv.paidAmount.amount;
  if (outstanding <= 0n) return ok(null);

  const discount = computeEarlyPaymentDiscount(
    outstanding,
    inv.invoiceDate,
    input.paymentDate,
    termsResult.value
  );

  return ok({
    eligible: discount.eligible,
    discountDeadline: discount.discountDeadline?.toISOString() ?? null,
    savingsPercent: discount.savingsPercent,
    discountAmount: String(discount.discountAmount),
    netPayable: String(discount.netPayable),
    currencyCode: inv.totalAmount.currency,
  });
}
