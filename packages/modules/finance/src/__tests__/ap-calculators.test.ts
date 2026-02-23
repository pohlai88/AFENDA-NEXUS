import { describe, it, expect } from "vitest";
import { money } from "@afenda/core";
import { threeWayMatch } from "../slices/ap/calculators/three-way-match.js";
import { computeApAging } from "../slices/ap/calculators/ap-aging.js";
import { computeEarlyPaymentDiscount } from "../slices/ap/calculators/early-payment-discount.js";
import { detectDuplicates } from "../slices/ap/calculators/duplicate-detection.js";
import { computeWht } from "../slices/ap/calculators/wht-calculator.js";
import { buildPain001 } from "../slices/ap/calculators/payment-file-builder.js";
import { computeAccruedLiabilities } from "../slices/ap/calculators/accrued-liabilities.js";
import type { ApInvoice } from "../slices/ap/entities/ap-invoice.js";
import type { PaymentTerms } from "../slices/ap/entities/payment-terms.js";

// ─── Helpers ───────────────────────────────────────────────────────────────

function makeInvoice(overrides: Partial<ApInvoice> & { totalAmount: ApInvoice["totalAmount"]; paidAmount: ApInvoice["paidAmount"] }): ApInvoice {
  return {
    id: "inv-1",
    tenantId: "t-1",
    companyId: "c-1" as ApInvoice["companyId"],
    supplierId: "s-1",
    ledgerId: "l-1" as ApInvoice["ledgerId"],
    invoiceNumber: "INV-001",
    supplierRef: null,
    invoiceDate: new Date("2025-01-15"),
    dueDate: new Date("2025-02-14"),
    status: "POSTED",
    description: null,
    poRef: null,
    receiptRef: null,
    paymentTermsId: null,
    journalId: null,
    lines: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeTerms(overrides?: Partial<PaymentTerms>): PaymentTerms {
  return {
    id: "pt-1",
    tenantId: "t-1",
    code: "NET30",
    name: "Net 30",
    netDays: 30,
    discountPercent: 0,
    discountDays: 0,
    isActive: true,
    ...overrides,
  };
}

// ─── 3-Way Match ───────────────────────────────────────────────────────────

describe("threeWayMatch", () => {
  it("returns MATCHED when PO = receipt = invoice", () => {
    const result = threeWayMatch({
      poAmount: money(10000n, "USD"),
      receiptAmount: money(10000n, "USD"),
      invoiceAmount: money(10000n, "USD"),
      tolerancePercent: 1,
    });
    expect(result.status).toBe("MATCHED");
  });

  it("returns QUANTITY_MISMATCH when PO ≠ receipt", () => {
    const result = threeWayMatch({
      poAmount: money(10000n, "USD"),
      receiptAmount: money(8000n, "USD"),
      invoiceAmount: money(8000n, "USD"),
      tolerancePercent: 1,
    });
    expect(result.status).toBe("QUANTITY_MISMATCH");
  });

  it("returns WITHIN_TOLERANCE for small variance", () => {
    const result = threeWayMatch({
      poAmount: money(10000n, "USD"),
      receiptAmount: money(10000n, "USD"),
      invoiceAmount: money(10050n, "USD"),
      tolerancePercent: 1,
    });
    expect(result.status).toBe("WITHIN_TOLERANCE");
  });

  it("returns OVER_TOLERANCE for large variance", () => {
    const result = threeWayMatch({
      poAmount: money(10000n, "USD"),
      receiptAmount: money(10000n, "USD"),
      invoiceAmount: money(12000n, "USD"),
      tolerancePercent: 1,
    });
    expect(result.status).toBe("OVER_TOLERANCE");
  });

  it("returns PRICE_MISMATCH when receipt is zero", () => {
    const result = threeWayMatch({
      poAmount: money(0n, "USD"),
      receiptAmount: money(0n, "USD"),
      invoiceAmount: money(5000n, "USD"),
      tolerancePercent: 1,
    });
    expect(result.status).toBe("PRICE_MISMATCH");
  });
});

// ─── AP Aging ──────────────────────────────────────────────────────────────

describe("computeApAging", () => {
  it("buckets invoices by days overdue", () => {
    const asOf = new Date("2025-04-01");
    const invoices = [
      makeInvoice({ id: "i1", supplierId: "s1", totalAmount: money(10000n, "USD"), paidAmount: money(0n, "USD"), dueDate: new Date("2025-03-25") }),
      makeInvoice({ id: "i2", supplierId: "s1", totalAmount: money(5000n, "USD"), paidAmount: money(0n, "USD"), dueDate: new Date("2025-02-15") }),
      makeInvoice({ id: "i3", supplierId: "s2", totalAmount: money(20000n, "USD"), paidAmount: money(0n, "USD"), dueDate: new Date("2024-12-01") }),
    ];

    const report = computeApAging(invoices, asOf);
    expect(report.rows).toHaveLength(2);
    expect(report.totals.total).toBe(35000n);
    // i1: 7 days overdue → current bucket (≤0 means not overdue, but 7 > 0 so days30)
    // i2: 45 days → days60
    // i3: 121 days → over90
  });

  it("excludes PAID and CANCELLED invoices", () => {
    const asOf = new Date("2025-04-01");
    const invoices = [
      makeInvoice({ status: "PAID", totalAmount: money(10000n, "USD"), paidAmount: money(10000n, "USD") }),
      makeInvoice({ status: "CANCELLED", totalAmount: money(5000n, "USD"), paidAmount: money(0n, "USD") }),
    ];

    const report = computeApAging(invoices, asOf);
    expect(report.rows).toHaveLength(0);
    expect(report.totals.total).toBe(0n);
  });

  it("uses outstanding amount (total - paid)", () => {
    const asOf = new Date("2025-04-01");
    const invoices = [
      makeInvoice({
        supplierId: "s1",
        totalAmount: money(10000n, "USD"),
        paidAmount: money(3000n, "USD"),
        dueDate: new Date("2025-03-25"),
        status: "PARTIALLY_PAID",
      }),
    ];

    const report = computeApAging(invoices, asOf);
    expect(report.totals.total).toBe(7000n);
  });
});

// ─── Early Payment Discount ────────────────────────────────────────────────

describe("computeEarlyPaymentDiscount", () => {
  it("returns eligible with discount for 2/10 net 30 paid within 10 days", () => {
    const terms = makeTerms({ discountPercent: 2, discountDays: 10 });
    const result = computeEarlyPaymentDiscount(
      100000n,
      new Date("2025-01-01"),
      new Date("2025-01-08"),
      terms,
    );
    expect(result.eligible).toBe(true);
    expect(result.discountAmount).toBe(2000n);
    expect(result.netPayable).toBe(98000n);
  });

  it("returns not eligible when paid after discount deadline", () => {
    const terms = makeTerms({ discountPercent: 2, discountDays: 10 });
    const result = computeEarlyPaymentDiscount(
      100000n,
      new Date("2025-01-01"),
      new Date("2025-01-15"),
      terms,
    );
    expect(result.eligible).toBe(false);
    expect(result.netPayable).toBe(100000n);
  });

  it("returns not eligible when terms have no discount", () => {
    const terms = makeTerms();
    const result = computeEarlyPaymentDiscount(
      100000n,
      new Date("2025-01-01"),
      new Date("2025-01-05"),
      terms,
    );
    expect(result.eligible).toBe(false);
  });
});

// ─── Duplicate Detection ───────────────────────────────────────────────────

describe("detectDuplicates", () => {
  it("detects duplicate invoices by supplier + ref + amount + date", () => {
    const fingerprints = [
      { invoiceId: "i1", supplierId: "s1", supplierRef: "REF-001", totalAmount: 10000n, invoiceDate: new Date("2025-01-15") },
      { invoiceId: "i2", supplierId: "s1", supplierRef: "REF-001", totalAmount: 10000n, invoiceDate: new Date("2025-01-15") },
      { invoiceId: "i3", supplierId: "s1", supplierRef: "REF-002", totalAmount: 10000n, invoiceDate: new Date("2025-01-15") },
    ];

    const groups = detectDuplicates(fingerprints);
    expect(groups).toHaveLength(1);
    expect(groups[0]!.invoices).toHaveLength(2);
  });

  it("returns empty when no duplicates", () => {
    const fingerprints = [
      { invoiceId: "i1", supplierId: "s1", supplierRef: "REF-001", totalAmount: 10000n, invoiceDate: new Date("2025-01-15") },
      { invoiceId: "i2", supplierId: "s2", supplierRef: "REF-002", totalAmount: 5000n, invoiceDate: new Date("2025-01-16") },
    ];

    const groups = detectDuplicates(fingerprints);
    expect(groups).toHaveLength(0);
  });
});

// ─── WHT Calculator ────────────────────────────────────────────────────────

describe("computeWht", () => {
  it("computes withholding tax at standard rate", () => {
    const result = computeWht(100000n, {
      countryCode: "TH",
      payeeType: "NON_RESIDENT",
      incomeType: "SERVICE",
      rate: 15,
      treatyRate: null,
    });
    expect(result.whtAmount).toBe(15000n);
    expect(result.netPayable).toBe(85000n);
    expect(result.effectiveRate).toBe(15);
  });

  it("uses treaty rate when available", () => {
    const result = computeWht(100000n, {
      countryCode: "TH",
      payeeType: "NON_RESIDENT",
      incomeType: "SERVICE",
      rate: 15,
      treatyRate: 10,
    });
    expect(result.whtAmount).toBe(10000n);
    expect(result.netPayable).toBe(90000n);
    expect(result.effectiveRate).toBe(10);
  });
});

// ─── Pain.001 Builder ──────────────────────────────────────────────────────

describe("buildPain001", () => {
  it("generates valid XML with control sum", () => {
    const output = buildPain001("MSG-001", "ACME Corp", [
      {
        paymentId: "PAY-001",
        debtorName: "ACME Corp",
        debtorIban: "DE89370400440532013000",
        debtorBic: "COBADEFFXXX",
        creditorName: "Supplier A",
        creditorIban: "GB29NWBK60161331926819",
        creditorBic: "NWBKGB2L",
        amount: 50000n,
        currencyCode: "EUR",
        remittanceInfo: "INV-001",
        executionDate: new Date("2025-03-01"),
      },
      {
        paymentId: "PAY-002",
        debtorName: "ACME Corp",
        debtorIban: "DE89370400440532013000",
        debtorBic: "COBADEFFXXX",
        creditorName: "Supplier B",
        creditorIban: "FR7630006000011234567890189",
        creditorBic: "BNPAFRPP",
        amount: 30000n,
        currencyCode: "EUR",
        remittanceInfo: "INV-002",
        executionDate: new Date("2025-03-01"),
      },
    ]);

    expect(output.messageId).toBe("MSG-001");
    expect(output.numberOfTransactions).toBe(2);
    expect(output.controlSum).toBe(80000n);
    expect(output.xml).toContain("pain.001.001.03");
    expect(output.xml).toContain("PAY-001");
    expect(output.xml).toContain("PAY-002");
    expect(output.xml).toContain("Supplier A");
  });

  it("handles empty instructions", () => {
    const output = buildPain001("MSG-002", "ACME Corp", []);
    expect(output.numberOfTransactions).toBe(0);
    expect(output.controlSum).toBe(0n);
  });
});

// ─── Accrued Liabilities ───────────────────────────────────────────────────

describe("computeAccruedLiabilities", () => {
  it("generates accrual entries for uninvoiced receipts", () => {
    const entries = computeAccruedLiabilities(
      [
        {
          receiptId: "r1",
          poRef: "PO-001",
          supplierId: "s1",
          receiptDate: new Date("2025-01-15"),
          amount: 10000n,
          currencyCode: "USD",
          accountId: "acc-expense",
        },
        {
          receiptId: "r2",
          poRef: "PO-002",
          supplierId: "s2",
          receiptDate: new Date("2025-01-20"),
          amount: 5000n,
          currencyCode: "USD",
          accountId: "acc-expense-2",
        },
      ],
      "acc-accrued-liabilities",
    );

    expect(entries).toHaveLength(2);
    expect(entries[0]!.debitAccountId).toBe("acc-expense");
    expect(entries[0]!.creditAccountId).toBe("acc-accrued-liabilities");
    expect(entries[0]!.amount).toBe(10000n);
    expect(entries[1]!.amount).toBe(5000n);
  });

  it("returns empty for no receipts", () => {
    const entries = computeAccruedLiabilities([], "acc-accrued");
    expect(entries).toHaveLength(0);
  });
});
