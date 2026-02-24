import { describe, it, expect } from "vitest";
import { money } from "@afenda/core";
import { postArInvoice } from "../slices/ar/services/post-ar-invoice.js";
import { allocatePayment } from "../slices/ar/services/allocate-payment.js";
import { writeOffInvoice } from "../slices/ar/services/write-off-invoice.js";
import { createCreditNote } from "../slices/ar/services/create-credit-note.js";
import { getArAging } from "../slices/ar/services/get-ar-aging.js";
import { runDunning } from "../slices/ar/services/run-dunning.js";
import {
  IDS,
  AR_IDS,
  makeArInvoice,
  mockArInvoiceRepo,
  mockArPaymentAllocationRepo,
  mockDunningRepo,
  mockJournalRepo,
  mockOutboxWriter,
  mockDocumentNumberGenerator,
} from "./helpers.js";

// ─── postArInvoice ─────────────────────────────────────────────────────────

describe("postArInvoice", () => {
  it("posts an APPROVED AR invoice and creates GL journal", async () => {
    const inv = makeArInvoice({ status: "APPROVED" });
    const invoices = new Map([[inv.id, inv]]);
    const arInvoiceRepo = mockArInvoiceRepo(invoices);
    const journalRepo = mockJournalRepo();
    const outboxWriter = mockOutboxWriter();
    const documentNumberGenerator = mockDocumentNumberGenerator();

    const result = await postArInvoice(
      { tenantId: "t1", userId: "u1", invoiceId: inv.id, fiscalPeriodId: IDS.period, arAccountId: AR_IDS.arAccount },
      { arInvoiceRepo, journalRepo, outboxWriter, documentNumberGenerator },
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.status).toBe("POSTED");
      expect(result.value.journalId).toBeTruthy();
    }
    expect(outboxWriter.events).toHaveLength(1);
    expect(outboxWriter.events[0]!.eventType).toBe("AR_INVOICE_POSTED");
  });

  it("rejects non-APPROVED invoice", async () => {
    const inv = makeArInvoice({ status: "DRAFT" });
    const invoices = new Map([[inv.id, inv]]);
    const arInvoiceRepo = mockArInvoiceRepo(invoices);

    const result = await postArInvoice(
      { tenantId: "t1", userId: "u1", invoiceId: inv.id, fiscalPeriodId: IDS.period, arAccountId: AR_IDS.arAccount },
      { arInvoiceRepo, journalRepo: mockJournalRepo(), outboxWriter: mockOutboxWriter(), documentNumberGenerator: mockDocumentNumberGenerator() },
    );

    expect(result.ok).toBe(false);
  });
});

// ─── allocatePayment ───────────────────────────────────────────────────────

describe("allocatePayment", () => {
  it("allocates payment to unpaid invoices via FIFO", async () => {
    const inv1 = makeArInvoice({
      id: AR_IDS.invoice,
      customerId: AR_IDS.customer,
      status: "POSTED",
      dueDate: new Date("2025-01-01"),
      totalAmount: money(30000n, "USD"),
      paidAmount: money(0n, "USD"),
    });
    const inv2 = makeArInvoice({
      id: AR_IDS.invoice2,
      customerId: AR_IDS.customer,
      status: "POSTED",
      dueDate: new Date("2025-02-01"),
      totalAmount: money(20000n, "USD"),
      paidAmount: money(0n, "USD"),
    });
    const invoices = new Map([[inv1.id, inv1], [inv2.id, inv2]]);
    const arInvoiceRepo = mockArInvoiceRepo(invoices);
    const arPaymentAllocationRepo = mockArPaymentAllocationRepo();
    const outboxWriter = mockOutboxWriter();

    const result = await allocatePayment(
      {
        tenantId: "t1",
        userId: "u1",
        customerId: AR_IDS.customer,
        paymentDate: new Date("2025-03-01"),
        paymentRef: "PAY-001",
        paymentAmount: 40000n,
        currencyCode: "USD",
      },
      { arInvoiceRepo, arPaymentAllocationRepo, outboxWriter },
    );

    expect(result.ok).toBe(true);
    expect(outboxWriter.events).toHaveLength(1);
    expect(outboxWriter.events[0]!.eventType).toBe("AR_PAYMENT_ALLOCATED");
  });

  it("rejects when no unpaid invoices for customer", async () => {
    const arInvoiceRepo = mockArInvoiceRepo();
    const arPaymentAllocationRepo = mockArPaymentAllocationRepo();
    const outboxWriter = mockOutboxWriter();

    const result = await allocatePayment(
      {
        tenantId: "t1",
        userId: "u1",
        customerId: "nonexistent",
        paymentDate: new Date("2025-03-01"),
        paymentRef: "PAY-002",
        paymentAmount: 10000n,
        currencyCode: "USD",
      },
      { arInvoiceRepo, arPaymentAllocationRepo, outboxWriter },
    );

    expect(result.ok).toBe(false);
  });
});

// ─── writeOffInvoice ───────────────────────────────────────────────────────

describe("writeOffInvoice", () => {
  it("writes off a POSTED invoice", async () => {
    const inv = makeArInvoice({ status: "POSTED" });
    const invoices = new Map([[inv.id, inv]]);
    const arInvoiceRepo = mockArInvoiceRepo(invoices);
    const outboxWriter = mockOutboxWriter();

    const result = await writeOffInvoice(
      { tenantId: "t1", userId: "u1", invoiceId: inv.id, reason: "Bad debt" },
      { arInvoiceRepo, outboxWriter },
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.status).toBe("WRITTEN_OFF");
    }
    expect(outboxWriter.events).toHaveLength(1);
    expect(outboxWriter.events[0]!.eventType).toBe("AR_WRITE_OFF_APPROVED");
  });

  it("rejects write-off of DRAFT invoice", async () => {
    const inv = makeArInvoice({ status: "DRAFT" });
    const invoices = new Map([[inv.id, inv]]);
    const arInvoiceRepo = mockArInvoiceRepo(invoices);
    const outboxWriter = mockOutboxWriter();

    const result = await writeOffInvoice(
      { tenantId: "t1", userId: "u1", invoiceId: inv.id, reason: "Bad debt" },
      { arInvoiceRepo, outboxWriter },
    );

    expect(result.ok).toBe(false);
  });
});

// ─── createCreditNote ──────────────────────────────────────────────────────

describe("createCreditNote", () => {
  it("creates a credit note for a POSTED invoice", async () => {
    const inv = makeArInvoice({ status: "POSTED" });
    const invoices = new Map([[inv.id, inv]]);
    const arInvoiceRepo = mockArInvoiceRepo(invoices);
    const outboxWriter = mockOutboxWriter();

    const result = await createCreditNote(
      { tenantId: "t1", userId: "u1", originalInvoiceId: inv.id, reason: "Overcharge" },
      { arInvoiceRepo, outboxWriter },
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.invoiceNumber).toContain("CN-");
    }
    expect(outboxWriter.events).toHaveLength(1);
    expect(outboxWriter.events[0]!.eventType).toBe("AR_CREDIT_NOTE_CREATED");
  });

  it("rejects credit note for DRAFT invoice", async () => {
    const inv = makeArInvoice({ status: "DRAFT" });
    const invoices = new Map([[inv.id, inv]]);
    const arInvoiceRepo = mockArInvoiceRepo(invoices);
    const outboxWriter = mockOutboxWriter();

    const result = await createCreditNote(
      { tenantId: "t1", userId: "u1", originalInvoiceId: inv.id, reason: "Overcharge" },
      { arInvoiceRepo, outboxWriter },
    );

    expect(result.ok).toBe(false);
  });
});

// ─── getArAging ────────────────────────────────────────────────────────────

describe("getArAging", () => {
  it("returns aging report from unpaid invoices", async () => {
    const inv = makeArInvoice({ status: "POSTED", dueDate: new Date("2025-03-01") });
    const invoices = new Map([[inv.id, inv]]);
    const arInvoiceRepo = mockArInvoiceRepo(invoices);

    const result = await getArAging(
      { tenantId: "t1", asOfDate: new Date("2025-04-15") },
      { arInvoiceRepo },
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.rows).toHaveLength(1);
      expect(result.value.totals.total).toBeGreaterThan(0n);
    }
  });
});

// ─── runDunning ────────────────────────────────────────────────────────────

describe("runDunning", () => {
  it("creates dunning run with letters for overdue invoices", async () => {
    const inv = makeArInvoice({
      status: "POSTED",
      dueDate: new Date("2025-01-01"),
      customerId: AR_IDS.customer,
    });
    const invoices = new Map([[inv.id, inv]]);
    const arInvoiceRepo = mockArInvoiceRepo(invoices);
    const dunningRepo = mockDunningRepo();
    const outboxWriter = mockOutboxWriter();

    const result = await runDunning(
      { tenantId: "t1", userId: "u1", runDate: new Date("2025-04-15") },
      { arInvoiceRepo, dunningRepo, outboxWriter },
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.letters).toHaveLength(1);
    }
    expect(outboxWriter.events).toHaveLength(1);
    expect(outboxWriter.events[0]!.eventType).toBe("AR_DUNNING_RUN_CREATED");
  });

  it("rejects when no overdue invoices", async () => {
    const arInvoiceRepo = mockArInvoiceRepo();
    const dunningRepo = mockDunningRepo();
    const outboxWriter = mockOutboxWriter();

    const result = await runDunning(
      { tenantId: "t1", userId: "u1", runDate: new Date("2025-04-15") },
      { arInvoiceRepo, dunningRepo, outboxWriter },
    );

    expect(result.ok).toBe(false);
  });
});
