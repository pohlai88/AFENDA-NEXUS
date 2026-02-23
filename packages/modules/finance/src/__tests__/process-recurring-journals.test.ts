import { describe, it, expect } from "vitest";
import { processRecurringJournals } from "../slices/gl/services/process-recurring-journals.js";
import { money } from "@afenda/core";
import {
  makeRecurringTemplate,
  mockRecurringTemplateRepo,
  mockJournalRepo,
  mockAccountRepo,
  mockPeriodRepo,
  mockOutboxWriter,
  mockJournalAuditRepo,
  makeAccount,
  makePeriod,
  IDS,
} from "./helpers.js";

function buildDeps(overrides: Record<string, unknown> = {}) {
  return {
    recurringTemplateRepo: mockRecurringTemplateRepo(),
    journalRepo: mockJournalRepo(),
    accountRepo: mockAccountRepo([
      makeAccount({ id: IDS.account1, code: "1000" }),
      makeAccount({ id: IDS.account2, code: "2000" }),
    ]),
    periodRepo: mockPeriodRepo([makePeriod()]),
    outboxWriter: mockOutboxWriter(),
    journalAuditRepo: mockJournalAuditRepo(),
    ...overrides,
  };
}

describe("processRecurringJournals", () => {
  it("returns 0 processed when no templates are due", async () => {
    const deps = buildDeps();
    const result = await processRecurringJournals(
      { tenantId: "t1", userId: "u1", asOfDate: new Date("2025-06-01") },
      deps,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.processed).toBe(0);
      expect(result.value.failed).toBe(0);
      expect(result.value.journals).toHaveLength(0);
    }
  });

  it("processes due templates and creates journals", async () => {
    const template = makeRecurringTemplate({ nextRunDate: new Date("2025-06-01") });
    const repo = mockRecurringTemplateRepo([template]);
    const deps = buildDeps({ recurringTemplateRepo: repo });

    const result = await processRecurringJournals(
      { tenantId: "t1", userId: "u1", asOfDate: new Date("2025-06-15") },
      deps,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.processed).toBe(1);
      expect(result.value.failed).toBe(0);
      expect(result.value.journals).toHaveLength(1);
    }
  });

  it("advances nextRunDate after processing", async () => {
    const template = makeRecurringTemplate({
      nextRunDate: new Date("2025-06-01"),
      frequency: "MONTHLY",
    });
    const repo = mockRecurringTemplateRepo([template]);
    const deps = buildDeps({ recurringTemplateRepo: repo });

    await processRecurringJournals(
      { tenantId: "t1", userId: "u1", asOfDate: new Date("2025-06-15") },
      deps,
    );

    // nextRunDate should have advanced by 1 month
    expect(repo.templates[0]!.nextRunDate.getMonth()).toBe(6); // July = 6 (0-indexed)
  });

  it("skips inactive templates", async () => {
    const template = makeRecurringTemplate({
      nextRunDate: new Date("2025-06-01"),
      isActive: false,
    });
    const repo = mockRecurringTemplateRepo([template]);
    const deps = buildDeps({ recurringTemplateRepo: repo });

    const result = await processRecurringJournals(
      { tenantId: "t1", userId: "u1", asOfDate: new Date("2025-06-15") },
      deps,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.processed).toBe(0);
    }
  });

  it("counts failed templates when account resolution fails", async () => {
    const template = makeRecurringTemplate({
      nextRunDate: new Date("2025-06-01"),
      lines: [
        { accountCode: "NONEXISTENT", debit: money(5000n, "USD"), credit: money(0n, "USD") },
        { accountCode: "2000", debit: money(0n, "USD"), credit: money(5000n, "USD") },
      ],
    });
    const repo = mockRecurringTemplateRepo([template]);
    const deps = buildDeps({ recurringTemplateRepo: repo });

    const result = await processRecurringJournals(
      { tenantId: "t1", userId: "u1", asOfDate: new Date("2025-06-15") },
      deps,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.processed).toBe(0);
      expect(result.value.failed).toBe(1);
    }
  });

  it("emits RECURRING_JOURNAL_CREATED outbox event", async () => {
    const template = makeRecurringTemplate({ nextRunDate: new Date("2025-06-01") });
    const repo = mockRecurringTemplateRepo([template]);
    const outbox = mockOutboxWriter();
    const deps = buildDeps({ recurringTemplateRepo: repo, outboxWriter: outbox });

    await processRecurringJournals(
      { tenantId: "t1", userId: "u1", asOfDate: new Date("2025-06-15") },
      deps,
    );

    expect(outbox.events).toHaveLength(1);
    expect(outbox.events[0]!.eventType).toBe("RECURRING_JOURNAL_CREATED");
  });
});
