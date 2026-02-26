import type { PaymentMethodType } from '../entities/supplier.js';
import type { PaymentTerms } from '../entities/payment-terms.js';
import { computeEarlyPaymentDiscount, type DiscountResult } from './early-payment-discount.js';

/**
 * W3-1: Payment proposal auto-selection calculator.
 * Selects invoices eligible for payment based on due date / discount deadline,
 * groups them by stable keys (supplier + payment method + bank account + currency),
 * and produces a deterministic proposal (same inputs → same output).
 *
 * Pure calculator — no DB, no side effects, all amounts in bigint minor units.
 */

// ─── Input types ────────────────────────────────────────────────────────────

export interface PaymentProposalInput {
  /** Invoices available for payment (caller should pre-filter to APPROVED/POSTED). */
  readonly invoices: readonly ProposableInvoice[];
  /** Supplier lookup — keyed by supplierId. */
  readonly suppliers: ReadonlyMap<string, ProposableSupplier>;
  /** Payment terms lookup — keyed by paymentTermsId. */
  readonly paymentTerms: ReadonlyMap<string, PaymentTerms>;
  /** The date the payment run will execute (used for discount eligibility). */
  readonly paymentDate: Date;
  /** Cut-off date — only invoices due on or before this date are included. */
  readonly cutoffDate: Date;
  /** If true, also include invoices whose discount deadline is before cutoffDate
   *  even if their due date is after cutoffDate (capture early-pay savings). */
  readonly includeDiscountOpportunities?: boolean;
  /** Optional: only select invoices for these supplier IDs. */
  readonly supplierFilter?: readonly string[];
  /** Optional: only select invoices with this payment method. */
  readonly paymentMethodFilter?: PaymentMethodType;
  /** Optional: only select invoices in this currency. */
  readonly currencyFilter?: string;
}

export interface ProposableInvoice {
  readonly id: string;
  readonly supplierId: string;
  readonly invoiceNumber: string;
  readonly invoiceDate: Date;
  readonly dueDate: Date;
  readonly totalAmount: bigint;
  readonly paidAmount: bigint;
  readonly currencyCode: string;
  readonly paymentTermsId: string | null;
}

export interface ProposableSupplier {
  readonly id: string;
  readonly name: string;
  readonly currencyCode: string;
  readonly defaultPaymentMethod: PaymentMethodType | null;
  readonly primaryBankAccountId: string | null;
}

// ─── Output types ───────────────────────────────────────────────────────────

export interface PaymentProposal {
  readonly paymentDate: Date;
  readonly cutoffDate: Date;
  readonly groups: readonly PaymentProposalGroup[];
  readonly summary: PaymentProposalSummary;
}

export interface PaymentProposalGroup {
  /** Stable grouping key: supplier|method|bankAccount|currency */
  readonly groupKey: string;
  readonly supplierId: string;
  readonly supplierName: string;
  readonly paymentMethod: PaymentMethodType;
  readonly bankAccountId: string | null;
  readonly currencyCode: string;
  readonly items: readonly PaymentProposalItem[];
  readonly totalGross: bigint;
  readonly totalDiscount: bigint;
  readonly totalNet: bigint;
}

export interface PaymentProposalItem {
  readonly invoiceId: string;
  readonly invoiceNumber: string;
  readonly dueDate: Date;
  readonly outstandingAmount: bigint;
  readonly discountAmount: bigint;
  readonly netPayable: bigint;
  readonly discountEligible: boolean;
  readonly selectionReason: 'DUE' | 'DISCOUNT_OPPORTUNITY';
}

export interface PaymentProposalSummary {
  readonly totalInvoices: number;
  readonly totalGroups: number;
  readonly totalGross: bigint;
  readonly totalDiscount: bigint;
  readonly totalNet: bigint;
  readonly discountOpportunityCount: number;
  readonly discountSavings: bigint;
}

// ─── Calculator ─────────────────────────────────────────────────────────────

export function computePaymentProposal(input: PaymentProposalInput): PaymentProposal {
  const {
    invoices,
    suppliers,
    paymentTerms,
    paymentDate,
    cutoffDate,
    includeDiscountOpportunities = false,
    supplierFilter,
    paymentMethodFilter,
    currencyFilter,
  } = input;

  // Phase 1: Select eligible invoices
  const selectedItems: Array<PaymentProposalItem & { supplierId: string }> = [];

  // Sort invoices deterministically: by dueDate ASC, then by id ASC
  const sorted = [...invoices].sort((a, b) => {
    const dateDiff = a.dueDate.getTime() - b.dueDate.getTime();
    if (dateDiff !== 0) return dateDiff;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });

  for (const inv of sorted) {
    const outstanding = inv.totalAmount - inv.paidAmount;
    if (outstanding <= 0n) continue;

    // Apply filters
    if (supplierFilter && !supplierFilter.includes(inv.supplierId)) continue;
    if (currencyFilter && inv.currencyCode !== currencyFilter) continue;

    const supplier = suppliers.get(inv.supplierId);
    if (paymentMethodFilter && supplier?.defaultPaymentMethod !== paymentMethodFilter) continue;

    // Compute discount if terms exist
    let discount: DiscountResult | null = null;
    if (inv.paymentTermsId) {
      const terms = paymentTerms.get(inv.paymentTermsId);
      if (terms) {
        discount = computeEarlyPaymentDiscount(outstanding, inv.invoiceDate, paymentDate, terms);
      }
    }

    // Selection logic
    const isDue = inv.dueDate <= cutoffDate;
    const isDiscountOpportunity =
      includeDiscountOpportunities &&
      !isDue &&
      discount !== null &&
      discount.eligible &&
      discount.discountDeadline !== null &&
      discount.discountDeadline <= cutoffDate;

    if (!isDue && !isDiscountOpportunity) continue;

    const discountAmount = discount?.eligible ? discount.discountAmount : 0n;
    const netPayable = outstanding - discountAmount;

    selectedItems.push({
      supplierId: inv.supplierId,
      invoiceId: inv.id,
      invoiceNumber: inv.invoiceNumber,
      dueDate: inv.dueDate,
      outstandingAmount: outstanding,
      discountAmount,
      netPayable,
      discountEligible: discount?.eligible ?? false,
      selectionReason: isDue ? 'DUE' : 'DISCOUNT_OPPORTUNITY',
    });
  }

  // Phase 2: Group by stable keys (supplier + method + bankAccount + currency)
  const groupMap = new Map<
    string,
    {
      supplierId: string;
      supplierName: string;
      paymentMethod: PaymentMethodType;
      bankAccountId: string | null;
      currencyCode: string;
      items: Array<PaymentProposalItem>;
    }
  >();

  for (const item of selectedItems) {
    const inv = sorted.find((i) => i.id === item.invoiceId)!;
    const supplier = suppliers.get(item.supplierId);
    const method: PaymentMethodType = supplier?.defaultPaymentMethod ?? 'BANK_TRANSFER';
    const bankAccountId = supplier?.primaryBankAccountId ?? null;
    const ccy = inv.currencyCode;

    const groupKey = `${item.supplierId}|${method}|${bankAccountId ?? 'NONE'}|${ccy}`;

    let group = groupMap.get(groupKey);
    if (!group) {
      group = {
        supplierId: item.supplierId,
        supplierName: supplier?.name ?? item.supplierId,
        paymentMethod: method,
        bankAccountId,
        currencyCode: ccy,
        items: [],
      };
      groupMap.set(groupKey, group);
    }
    group.items.push(item);
  }

  // Phase 3: Build output — sort groups deterministically by groupKey
  const sortedGroupKeys = [...groupMap.keys()].sort();
  const groups: PaymentProposalGroup[] = sortedGroupKeys.map((groupKey) => {
    const g = groupMap.get(groupKey)!;
    const totalGross = g.items.reduce((s, i) => s + i.outstandingAmount, 0n);
    const totalDiscount = g.items.reduce((s, i) => s + i.discountAmount, 0n);
    const totalNet = g.items.reduce((s, i) => s + i.netPayable, 0n);

    return {
      groupKey,
      supplierId: g.supplierId,
      supplierName: g.supplierName,
      paymentMethod: g.paymentMethod,
      bankAccountId: g.bankAccountId,
      currencyCode: g.currencyCode,
      items: g.items,
      totalGross,
      totalDiscount,
      totalNet,
    };
  });

  // Summary
  const discountItems = selectedItems.filter((i) => i.selectionReason === 'DISCOUNT_OPPORTUNITY');
  const summary: PaymentProposalSummary = {
    totalInvoices: selectedItems.length,
    totalGroups: groups.length,
    totalGross: groups.reduce((s, g) => s + g.totalGross, 0n),
    totalDiscount: groups.reduce((s, g) => s + g.totalDiscount, 0n),
    totalNet: groups.reduce((s, g) => s + g.totalNet, 0n),
    discountOpportunityCount: discountItems.length,
    discountSavings: discountItems.reduce((s, i) => s + i.discountAmount, 0n),
  };

  return { paymentDate, cutoffDate, groups, summary };
}
