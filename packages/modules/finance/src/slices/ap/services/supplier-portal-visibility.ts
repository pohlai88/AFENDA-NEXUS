import type { Result, PaginatedResult } from '@afenda/core';
import { ok, err, AppError } from '@afenda/core';
import type { ApInvoice } from '../entities/ap-invoice.js';
import type { IApInvoiceRepo } from '../ports/ap-invoice-repo.js';
import type { IApPaymentRunRepo } from '../ports/payment-run-repo.js';
import type { ISupplierRepo } from '../ports/supplier-repo.js';
import type { AgingReport } from '../calculators/ap-aging.js';
import { computeApAging } from '../calculators/ap-aging.js';
import type { PaymentRunReport } from './get-payment-run-report.js';
import { getPaymentRunReport } from './get-payment-run-report.js';

/**
 * N2: Supplier self-service visibility services.
 *
 * Provides supplier-scoped read access to invoices, payments, and aging.
 * All queries are filtered to the authenticated supplier's own data.
 */

export interface SupplierVisibilityDeps {
  readonly apInvoiceRepo: IApInvoiceRepo;
  readonly apPaymentRunRepo: IApPaymentRunRepo;
  readonly supplierRepo: ISupplierRepo;
}

// ── Supplier Invoice Visibility ─────────────────────────────────────────────

export interface GetSupplierInvoicesInput {
  readonly tenantId: string;
  readonly supplierId: string;
  readonly page?: number;
  readonly limit?: number;
}

export async function getSupplierInvoices(
  input: GetSupplierInvoicesInput,
  deps: Pick<SupplierVisibilityDeps, 'apInvoiceRepo' | 'supplierRepo'>
): Promise<Result<PaginatedResult<ApInvoice>>> {
  const supplierResult = await deps.supplierRepo.findById(input.supplierId);
  if (!supplierResult.ok) {
    return err(new AppError('VALIDATION', 'Supplier not found'));
  }

  const result = await deps.apInvoiceRepo.findBySupplier(input.supplierId, {
    page: input.page ?? 1,
    limit: input.limit ?? 20,
  });
  return ok(result);
}

// ── Supplier Aging Visibility ───────────────────────────────────────────────

export interface GetSupplierAgingInput {
  readonly tenantId: string;
  readonly supplierId: string;
  readonly asOfDate?: Date;
}

export async function getSupplierAging(
  input: GetSupplierAgingInput,
  deps: Pick<SupplierVisibilityDeps, 'apInvoiceRepo' | 'supplierRepo'>
): Promise<Result<AgingReport>> {
  const supplierResult = await deps.supplierRepo.findById(input.supplierId);
  if (!supplierResult.ok) {
    return err(new AppError('VALIDATION', 'Supplier not found'));
  }

  const asOfDate = input.asOfDate ?? new Date();
  const invoices = await deps.apInvoiceRepo.findUnpaid();
  const supplierInvoices = invoices.filter((inv) => inv.supplierId === input.supplierId);
  const report = computeApAging(supplierInvoices, asOfDate);
  return ok(report);
}

// ── Supplier Payment Run Visibility ─────────────────────────────────────────

export interface GetSupplierPaymentRunInput {
  readonly tenantId: string;
  readonly supplierId: string;
  readonly paymentRunId: string;
}

export async function getSupplierPaymentRunReport(
  input: GetSupplierPaymentRunInput,
  deps: Pick<SupplierVisibilityDeps, 'apPaymentRunRepo' | 'supplierRepo'>
): Promise<Result<PaymentRunReport>> {
  const reportResult = await getPaymentRunReport(
    { tenantId: input.tenantId, paymentRunId: input.paymentRunId },
    deps
  );

  if (!reportResult.ok) return reportResult;

  const report = reportResult.value;
  const supplierBreakdown = report.suppliers.filter((s) => s.supplierId === input.supplierId);

  if (supplierBreakdown.length === 0) {
    return err(new AppError('VALIDATION', 'No payments found for this supplier in the run'));
  }

  const totalGross = supplierBreakdown.reduce((s, sup) => s + sup.totalGross, 0n);
  const totalDiscount = supplierBreakdown.reduce((s, sup) => s + sup.totalDiscount, 0n);
  const totalNet = supplierBreakdown.reduce((s, sup) => s + sup.totalNet, 0n);
  const itemCount = supplierBreakdown.reduce((s, sup) => s + sup.itemCount, 0);

  return ok({
    ...report,
    suppliers: supplierBreakdown,
    summary: {
      supplierCount: supplierBreakdown.length,
      itemCount,
      totalGross,
      totalDiscount,
      totalNet,
    },
  });
}
