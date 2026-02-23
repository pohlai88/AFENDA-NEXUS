import { describe, it, expect } from "vitest";
import {
  PaginationSchema,
  IdParamSchema,
  CreateJournalSchema,
  PostJournalSchema,
  ReasonBodySchema,
  OptionalReasonBodySchema,
  JournalStatusSchema,
  FxRateQuerySchema,
  BalanceSheetQuerySchema,
  TrialBalanceQuerySchema,
  ReportingStandardSchema,
} from "./index.js";

const UUID = "00000000-0000-4000-8000-000000000001";

// ─── PaginationSchema ──────────────────────────────────────────────────────────

describe("PaginationSchema", () => {
  it("applies defaults", () => {
    const r = PaginationSchema.parse({});
    expect(r.page).toBe(1);
    expect(r.limit).toBe(20);
  });

  it("coerces string numbers", () => {
    const r = PaginationSchema.parse({ page: "3", limit: "50" });
    expect(r.page).toBe(3);
    expect(r.limit).toBe(50);
  });

  it("rejects page < 1", () => {
    expect(() => PaginationSchema.parse({ page: 0 })).toThrow();
  });

  it("rejects limit > 100", () => {
    expect(() => PaginationSchema.parse({ limit: 101 })).toThrow();
  });
});

// ─── IdParamSchema ─────────────────────────────────────────────────────────────

describe("IdParamSchema", () => {
  it("accepts valid UUID", () => {
    const r = IdParamSchema.parse({ id: UUID });
    expect(r.id).toBe(UUID);
  });

  it("rejects non-UUID", () => {
    expect(() => IdParamSchema.parse({ id: "not-a-uuid" })).toThrow();
  });
});

// ─── JournalStatusSchema ───────────────────────────────────────────────────────

describe("JournalStatusSchema", () => {
  it("accepts valid statuses", () => {
    for (const s of ["DRAFT", "POSTED", "REVERSED", "VOIDED"]) {
      expect(JournalStatusSchema.parse(s)).toBe(s);
    }
  });

  it("rejects invalid status", () => {
    expect(() => JournalStatusSchema.parse("PENDING")).toThrow();
  });
});

// ─── CreateJournalSchema ───────────────────────────────────────────────────────

describe("CreateJournalSchema", () => {
  const validJournal = {
    companyId: UUID,
    ledgerId: UUID,
    description: "Test journal",
    date: "2025-06-15",
    lines: [
      { accountCode: "1000", debit: 100, credit: 0, currency: "USD" },
      { accountCode: "2000", debit: 0, credit: 100, currency: "USD" },
    ],
  };

  it("accepts valid input", () => {
    const r = CreateJournalSchema.parse(validJournal);
    expect(r.lines).toHaveLength(2);
  });

  it("rejects fewer than 2 lines", () => {
    expect(() =>
      CreateJournalSchema.parse({
        ...validJournal,
        lines: [{ accountCode: "1000", debit: 100, credit: 0, currency: "USD" }],
      }),
    ).toThrow();
  });

  it("rejects empty description", () => {
    expect(() =>
      CreateJournalSchema.parse({ ...validJournal, description: "" }),
    ).toThrow();
  });
});

// ─── PostJournalSchema ─────────────────────────────────────────────────────────

describe("PostJournalSchema", () => {
  it("accepts valid UUIDs", () => {
    const r = PostJournalSchema.parse({ journalId: UUID, idempotencyKey: UUID });
    expect(r.journalId).toBe(UUID);
  });

  it("rejects non-UUID journalId", () => {
    expect(() =>
      PostJournalSchema.parse({ journalId: "bad", idempotencyKey: UUID }),
    ).toThrow();
  });
});

// ─── ReasonBodySchema ──────────────────────────────────────────────────────────

describe("ReasonBodySchema", () => {
  it("accepts valid reason", () => {
    const r = ReasonBodySchema.parse({ reason: "Year-end adjustment" });
    expect(r.reason).toBe("Year-end adjustment");
  });

  it("rejects empty reason", () => {
    expect(() => ReasonBodySchema.parse({ reason: "" })).toThrow();
  });

  it("rejects missing reason", () => {
    expect(() => ReasonBodySchema.parse({})).toThrow();
  });
});

describe("OptionalReasonBodySchema", () => {
  it("accepts missing reason", () => {
    const r = OptionalReasonBodySchema.parse({});
    expect(r.reason).toBeUndefined();
  });

  it("accepts provided reason", () => {
    const r = OptionalReasonBodySchema.parse({ reason: "optional note" });
    expect(r.reason).toBe("optional note");
  });
});

// ─── Report Query Schemas ──────────────────────────────────────────────────────

describe("FxRateQuerySchema", () => {
  it("accepts valid FX rate query", () => {
    const r = FxRateQuerySchema.parse({ from: "USD", to: "EUR", date: "2025-06-15" });
    expect(r.from).toBe("USD");
  });

  it("rejects wrong currency length", () => {
    expect(() => FxRateQuerySchema.parse({ from: "US", to: "EUR", date: "2025-06-15" })).toThrow();
  });
});

describe("BalanceSheetQuerySchema", () => {
  it("accepts valid query", () => {
    const r = BalanceSheetQuerySchema.parse({ ledgerId: UUID, periodId: UUID });
    expect(r.ledgerId).toBe(UUID);
  });
});

describe("TrialBalanceQuerySchema", () => {
  it("accepts year and optional period", () => {
    const r = TrialBalanceQuerySchema.parse({ ledgerId: UUID, year: "2025" });
    expect(r.period).toBeUndefined();
  });

  it("accepts year with period", () => {
    const r = TrialBalanceQuerySchema.parse({ ledgerId: UUID, year: "2025", period: 6 });
    expect(r.period).toBe(6);
  });
});

describe("ReportingStandardSchema", () => {
  it("accepts IFRS, US_GAAP, LOCAL", () => {
    expect(ReportingStandardSchema.parse("IFRS")).toBe("IFRS");
    expect(ReportingStandardSchema.parse("US_GAAP")).toBe("US_GAAP");
    expect(ReportingStandardSchema.parse("LOCAL")).toBe("LOCAL");
  });

  it("rejects unknown standard", () => {
    expect(() => ReportingStandardSchema.parse("GAAP")).toThrow();
  });
});
