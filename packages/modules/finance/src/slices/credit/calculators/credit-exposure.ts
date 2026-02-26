/**
 * CM-02: Credit exposure calculator.
 * Computes total exposure = outstanding invoices + open orders - payments received.
 * Pure calculator — no DB, no side effects.
 */

export interface ExposureItem {
  readonly documentId: string;
  readonly documentType: 'INVOICE' | 'ORDER' | 'PAYMENT';
  readonly amount: bigint;
  readonly currencyCode: string;
}

export interface CreditExposureInput {
  readonly customerId: string;
  readonly creditLimit: bigint;
  readonly currencyCode: string;
  readonly items: readonly ExposureItem[];
}

export interface CreditExposureResult {
  readonly customerId: string;
  readonly totalOutstanding: bigint;
  readonly totalOpenOrders: bigint;
  readonly totalPayments: bigint;
  readonly currentExposure: bigint;
  readonly creditLimit: bigint;
  readonly availableCredit: bigint;
  readonly utilizationPct: number;
  readonly isOverLimit: boolean;
  readonly currencyCode: string;
}

/**
 * Compute credit exposure for a customer.
 */
export function computeCreditExposure(input: CreditExposureInput): CreditExposureResult {
  let totalOutstanding = 0n;
  let totalOpenOrders = 0n;
  let totalPayments = 0n;

  for (const item of input.items) {
    switch (item.documentType) {
      case 'INVOICE':
        totalOutstanding += item.amount;
        break;
      case 'ORDER':
        totalOpenOrders += item.amount;
        break;
      case 'PAYMENT':
        totalPayments += item.amount;
        break;
    }
  }

  const currentExposure = totalOutstanding + totalOpenOrders - totalPayments;
  const availableCredit = input.creditLimit - currentExposure;
  const isOverLimit = currentExposure > input.creditLimit;

  // Utilization as integer percentage (0-100+)
  const utilizationPct =
    input.creditLimit > 0n
      ? Number((currentExposure * 100n) / input.creditLimit)
      : currentExposure > 0n
        ? 999
        : 0;

  return {
    customerId: input.customerId,
    totalOutstanding,
    totalOpenOrders,
    totalPayments,
    currentExposure,
    creditLimit: input.creditLimit,
    availableCredit,
    utilizationPct,
    isOverLimit,
    currencyCode: input.currencyCode,
  };
}
