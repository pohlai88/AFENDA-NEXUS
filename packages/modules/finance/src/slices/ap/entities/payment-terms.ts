export interface PaymentTerms {
  readonly id: string;
  readonly tenantId: string;
  readonly code: string;
  readonly name: string;
  readonly netDays: number;
  readonly discountPercent: number;
  readonly discountDays: number;
  readonly isActive: boolean;
}

/**
 * Compute due date from invoice date + payment terms.
 */
export function computeDueDate(invoiceDate: Date, terms: PaymentTerms): Date {
  const due = new Date(invoiceDate);
  due.setDate(due.getDate() + terms.netDays);
  return due;
}

/**
 * Compute early payment discount deadline.
 * Returns null if terms have no discount.
 */
export function computeDiscountDeadline(invoiceDate: Date, terms: PaymentTerms): Date | null {
  if (terms.discountDays <= 0 || terms.discountPercent <= 0) return null;
  const deadline = new Date(invoiceDate);
  deadline.setDate(deadline.getDate() + terms.discountDays);
  return deadline;
}
