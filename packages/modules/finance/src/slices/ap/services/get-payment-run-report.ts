import type { Result } from '@afenda/core';
import { ok } from '@afenda/core';
import type { IApPaymentRunRepo } from '../ports/payment-run-repo.js';
import type { ISupplierRepo } from '../ports/supplier-repo.js';
import type { PaymentRunItem } from '../entities/payment-run.js';
import type { FinanceContext } from '../../../shared/finance-context.js';

/**
 * W3-3: Payment run reporting service.
 *
 * Generates a per-supplier breakdown report for an executed payment run.
 */

export interface PaymentRunReportInput {
  readonly tenantId: string;
  readonly paymentRunId: string;
}

export interface PaymentRunSupplierBreakdown {
  readonly supplierId: string;
  readonly supplierName: string;
  readonly itemCount: number;
  readonly totalGross: bigint;
  readonly totalDiscount: bigint;
  readonly totalNet: bigint;
  readonly items: readonly PaymentRunReportItem[];
}

export interface PaymentRunReportItem {
  readonly invoiceId: string;
  readonly amount: bigint;
  readonly discountAmount: bigint;
  readonly netAmount: bigint;
}

export interface PaymentRunReport {
  readonly paymentRunId: string;
  readonly runNumber: string;
  readonly status: string;
  readonly runDate: Date;
  readonly executedAt: Date | null;
  readonly executedBy: string | null;
  readonly currencyCode: string;
  readonly totalAmount: bigint;
  readonly suppliers: readonly PaymentRunSupplierBreakdown[];
  readonly summary: {
    readonly supplierCount: number;
    readonly itemCount: number;
    readonly totalGross: bigint;
    readonly totalDiscount: bigint;
    readonly totalNet: bigint;
  };
}

export async function getPaymentRunReport(
  input: PaymentRunReportInput,
  deps: {
    apPaymentRunRepo: IApPaymentRunRepo;
    supplierRepo?: ISupplierRepo;
  },
  _ctx?: FinanceContext
): Promise<Result<PaymentRunReport>> {
  const runResult = await deps.apPaymentRunRepo.findById(input.paymentRunId);
  if (!runResult.ok) return runResult;

  const run = runResult.value;

  // Group items by supplier
  const supplierMap = new Map<
    string,
    {
      items: PaymentRunItem[];
    }
  >();

  for (const item of run.items) {
    let group = supplierMap.get(item.supplierId);
    if (!group) {
      group = { items: [] };
      supplierMap.set(item.supplierId, group);
    }
    group.items.push(item);
  }

  // Build per-supplier breakdowns
  const suppliers: PaymentRunSupplierBreakdown[] = [];

  for (const [supplierId, group] of supplierMap) {
    let supplierName = supplierId;
    if (deps.supplierRepo) {
      const supplierResult = await deps.supplierRepo.findById(supplierId);
      if (supplierResult.ok) {
        supplierName = supplierResult.value.name;
      }
    }

    const reportItems: PaymentRunReportItem[] = group.items.map((i) => ({
      invoiceId: i.invoiceId,
      amount: i.amount.amount,
      discountAmount: i.discountAmount.amount,
      netAmount: i.netAmount.amount,
    }));

    const totalGross = reportItems.reduce((s, i) => s + i.amount, 0n);
    const totalDiscount = reportItems.reduce((s, i) => s + i.discountAmount, 0n);
    const totalNet = reportItems.reduce((s, i) => s + i.netAmount, 0n);

    suppliers.push({
      supplierId,
      supplierName,
      itemCount: reportItems.length,
      totalGross,
      totalDiscount,
      totalNet,
      items: reportItems,
    });
  }

  // Sort suppliers deterministically by name
  suppliers.sort((a, b) => a.supplierName.localeCompare(b.supplierName));

  const summary = {
    supplierCount: suppliers.length,
    itemCount: run.items.length,
    totalGross: suppliers.reduce((s, sup) => s + sup.totalGross, 0n),
    totalDiscount: suppliers.reduce((s, sup) => s + sup.totalDiscount, 0n),
    totalNet: suppliers.reduce((s, sup) => s + sup.totalNet, 0n),
  };

  return ok({
    paymentRunId: run.id,
    runNumber: run.runNumber,
    status: run.status,
    runDate: run.runDate,
    executedAt: run.executedAt,
    executedBy: run.executedBy,
    currencyCode: run.currencyCode,
    totalAmount: run.totalAmount.amount,
    suppliers,
    summary,
  });
}
