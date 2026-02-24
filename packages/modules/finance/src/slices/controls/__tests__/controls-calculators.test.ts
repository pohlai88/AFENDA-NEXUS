import { describe, it, expect } from "vitest";
import {
  reconcileSubledgers,
  type SubledgerBalanceInput,
} from "../calculators/subledger-reconciliation.js";
import {
  detectExceptions,
  type JournalEntryInput,
} from "../calculators/exception-reporting.js";
import {
  reviewUserAccess,
  type UserAccessRecord,
  type AccessReviewConfig,
} from "../calculators/access-review.js";
import {
  checkOptimisticConcurrency,
  type VersionedEntity,
} from "../calculators/optimistic-concurrency.js";
import {
  computePartitionStrategy,
  type TableVolumeMetrics,
} from "../calculators/partition-strategy.js";

// ── Subledger Reconciliation ────────────────────────────────────────────────

describe("reconcileSubledgers", () => {
  it("all reconciled when GL = subledger", () => {
    const inputs: SubledgerBalanceInput[] = [
      {
        subledgerType: "AP",
        controlAccountCode: "2100",
        glControlBalance: 500_000_00n,
        subledgerTotal: 500_000_00n,
        currencyCode: "USD",
        periodId: "2026-P01",
      },
      {
        subledgerType: "AR",
        controlAccountCode: "1200",
        glControlBalance: 300_000_00n,
        subledgerTotal: 300_000_00n,
        currencyCode: "USD",
        periodId: "2026-P01",
      },
    ];
    const { result } = reconcileSubledgers(inputs);
    expect(result.totalChecked).toBe(2);
    expect(result.totalReconciled).toBe(2);
    expect(result.totalUnreconciled).toBe(0);
    expect(result.unreconciledItems).toHaveLength(0);
  });

  it("detects unreconciled subledger", () => {
    const inputs: SubledgerBalanceInput[] = [
      {
        subledgerType: "AP",
        controlAccountCode: "2100",
        glControlBalance: 500_000_00n,
        subledgerTotal: 499_000_00n,
        currencyCode: "USD",
        periodId: "2026-P01",
      },
    ];
    const { result } = reconcileSubledgers(inputs);
    expect(result.totalUnreconciled).toBe(1);
    expect(result.unreconciledItems[0]!.difference).toBe(1_000_00n);
    expect(result.unreconciledItems[0]!.isReconciled).toBe(false);
  });

  it("handles negative differences (subledger > GL)", () => {
    const inputs: SubledgerBalanceInput[] = [
      {
        subledgerType: "FIXED_ASSETS",
        controlAccountCode: "1500",
        glControlBalance: 100_000_00n,
        subledgerTotal: 110_000_00n,
        currencyCode: "USD",
        periodId: "2026-P01",
      },
    ];
    const { result } = reconcileSubledgers(inputs);
    expect(result.unreconciledItems[0]!.difference).toBe(-10_000_00n);
  });

  it("mixes reconciled and unreconciled", () => {
    const inputs: SubledgerBalanceInput[] = [
      {
        subledgerType: "AP",
        controlAccountCode: "2100",
        glControlBalance: 500_000_00n,
        subledgerTotal: 500_000_00n,
        currencyCode: "USD",
        periodId: "2026-P01",
      },
      {
        subledgerType: "AR",
        controlAccountCode: "1200",
        glControlBalance: 300_000_00n,
        subledgerTotal: 290_000_00n,
        currencyCode: "USD",
        periodId: "2026-P01",
      },
      {
        subledgerType: "BANK",
        controlAccountCode: "1100",
        glControlBalance: 1_000_000_00n,
        subledgerTotal: 1_000_000_00n,
        currencyCode: "USD",
        periodId: "2026-P01",
      },
    ];
    const { result } = reconcileSubledgers(inputs);
    expect(result.totalReconciled).toBe(2);
    expect(result.totalUnreconciled).toBe(1);
  });

  it("throws on empty input", () => {
    expect(() => reconcileSubledgers([])).toThrow("At least one");
  });
});

// ── Exception Reporting ─────────────────────────────────────────────────────

describe("detectExceptions", () => {
  const baseEntry: JournalEntryInput = {
    journalId: "j-1",
    postingDate: new Date("2026-02-10"), // Tuesday
    totalAmount: 50_000_00n,
    lineCount: 4,
    maxLineAmount: 20_000_00n,
    debitAccountCodes: ["1100"],
    creditAccountCodes: ["4100"],
    currencyCode: "USD",
    postedBy: "user-1",
  };

  it("no exceptions for normal entries", () => {
    const { result } = detectExceptions([baseEntry]);
    expect(result.totalExceptions).toBe(0);
    expect(result.totalJournalsScanned).toBe(1);
  });

  it("detects amount exceeding threshold", () => {
    const { result } = detectExceptions([
      { ...baseEntry, totalAmount: 20_000_000_00n },
    ]);
    const found = result.exceptions.filter(
      (e) => e.exceptionType === "AMOUNT_EXCEEDS_THRESHOLD",
    );
    expect(found.length).toBeGreaterThanOrEqual(1);
  });

  it("detects weekend posting", () => {
    const { result } = detectExceptions([
      { ...baseEntry, postingDate: new Date("2026-02-14") }, // Saturday
    ]);
    const found = result.exceptions.filter(
      (e) => e.exceptionType === "WEEKEND_POSTING",
    );
    expect(found.length).toBe(1);
  });

  it("detects round number bias", () => {
    const { result } = detectExceptions([
      { ...baseEntry, totalAmount: 5_000_000_00n },
    ]);
    const found = result.exceptions.filter(
      (e) => e.exceptionType === "ROUND_NUMBER_BIAS",
    );
    expect(found.length).toBe(1);
  });

  it("detects duplicate amounts across journals", () => {
    const { result } = detectExceptions([
      { ...baseEntry, journalId: "j-1", totalAmount: 123_456_00n },
      { ...baseEntry, journalId: "j-2", totalAmount: 123_456_00n },
    ]);
    const found = result.exceptions.filter(
      (e) => e.exceptionType === "DUPLICATE_AMOUNT",
    );
    expect(found.length).toBe(2);
  });

  it("detects period-end clustering", () => {
    const { result } = detectExceptions([
      { ...baseEntry, postingDate: new Date("2026-02-27") }, // near month end
    ]);
    const found = result.exceptions.filter(
      (e) => e.exceptionType === "PERIOD_END_CLUSTERING",
    );
    expect(found.length).toBe(1);
  });

  it("detects single-line dominance", () => {
    const { result } = detectExceptions([
      {
        ...baseEntry,
        totalAmount: 100_000_00n,
        maxLineAmount: 98_000_00n,
        lineCount: 5,
      },
    ]);
    const found = result.exceptions.filter(
      (e) => e.exceptionType === "SINGLE_LINE_DOMINANCE",
    );
    expect(found.length).toBe(1);
  });

  it("respects custom config thresholds", () => {
    const { result } = detectExceptions(
      [{ ...baseEntry, totalAmount: 1_000_00n }],
      { amountThreshold: 500_00n },
    );
    const found = result.exceptions.filter(
      (e) => e.exceptionType === "AMOUNT_EXCEEDS_THRESHOLD",
    );
    expect(found.length).toBe(1);
  });

  it("throws on empty input", () => {
    expect(() => detectExceptions([])).toThrow("At least one");
  });
});

// ── Access Review ───────────────────────────────────────────────────────────

describe("reviewUserAccess", () => {
  const reviewDate = new Date("2026-02-24");
  const baseConfig: AccessReviewConfig = {
    dormantDays: 90,
    maxRolesPerUser: 5,
    reviewDate,
    sodRules: [
      {
        conflictingRoles: ["AP_CLERK", "AP_APPROVER"],
        description: "Cannot create and approve own AP invoices",
      },
    ],
    privilegedRoles: ["ADMIN", "FINANCE_ADMIN"],
  };

  const activeUser: UserAccessRecord = {
    userId: "u-1",
    userName: "Alice",
    roles: ["GL_CLERK"],
    lastLoginDate: new Date("2026-02-20"),
    department: "Finance",
    isActive: true,
    managerUserId: "u-mgr",
    grantedAt: new Date("2025-01-01"),
  };

  it("no findings for clean user", () => {
    const { result } = reviewUserAccess([activeUser], baseConfig);
    expect(result.totalFindings).toBe(0);
    expect(result.totalUsersReviewed).toBe(1);
  });

  it("detects dormant account", () => {
    const dormant: UserAccessRecord = {
      ...activeUser,
      userId: "u-2",
      userName: "Bob",
      lastLoginDate: new Date("2025-10-01"), // >90 days
    };
    const { result } = reviewUserAccess([dormant], baseConfig);
    const found = result.findings.filter((f) => f.finding === "DORMANT_ACCOUNT");
    expect(found.length).toBe(1);
  });

  it("detects never-logged-in account", () => {
    const neverUsed: UserAccessRecord = {
      ...activeUser,
      userId: "u-3",
      lastLoginDate: null,
    };
    const { result } = reviewUserAccess([neverUsed], baseConfig);
    const found = result.findings.filter((f) => f.finding === "DORMANT_ACCOUNT");
    expect(found.length).toBe(1);
  });

  it("detects orphaned account (inactive with roles)", () => {
    const orphaned: UserAccessRecord = {
      ...activeUser,
      userId: "u-4",
      isActive: false,
      roles: ["GL_CLERK", "AP_CLERK"],
    };
    const { result } = reviewUserAccess([orphaned], baseConfig);
    const found = result.findings.filter(
      (f) => f.finding === "ORPHANED_ACCOUNT",
    );
    expect(found.length).toBe(1);
  });

  it("detects SoD violation", () => {
    const sodUser: UserAccessRecord = {
      ...activeUser,
      userId: "u-5",
      roles: ["AP_CLERK", "AP_APPROVER"],
    };
    const { result } = reviewUserAccess([sodUser], baseConfig);
    const found = result.findings.filter((f) => f.finding === "SOD_VIOLATION");
    expect(found.length).toBe(1);
    expect(found[0]!.riskLevel).toBe("CRITICAL");
  });

  it("detects role accumulation", () => {
    const manyRoles: UserAccessRecord = {
      ...activeUser,
      userId: "u-6",
      roles: ["GL_CLERK", "AP_CLERK", "AR_CLERK", "TAX_CLERK", "BANK_CLERK", "FA_CLERK"],
    };
    const { result } = reviewUserAccess([manyRoles], baseConfig);
    const found = result.findings.filter(
      (f) => f.finding === "ROLE_ACCUMULATION",
    );
    expect(found.length).toBe(1);
  });

  it("detects excessive privilege", () => {
    const privUser: UserAccessRecord = {
      ...activeUser,
      userId: "u-7",
      roles: ["ADMIN", "GL_CLERK"],
      managerUserId: "u-mgr",
    };
    const { result } = reviewUserAccess([privUser], baseConfig);
    const found = result.findings.filter(
      (f) => f.finding === "EXCESSIVE_PRIVILEGE",
    );
    expect(found.length).toBe(1);
  });

  it("detects missing approval for privileged role", () => {
    const noManager: UserAccessRecord = {
      ...activeUser,
      userId: "u-8",
      roles: ["FINANCE_ADMIN"],
      managerUserId: null,
    };
    const { result } = reviewUserAccess([noManager], baseConfig);
    const found = result.findings.filter(
      (f) => f.finding === "MISSING_APPROVAL",
    );
    expect(found.length).toBe(1);
  });

  it("throws on empty input", () => {
    expect(() => reviewUserAccess([], baseConfig)).toThrow("At least one");
  });
});

// ── Optimistic Concurrency ──────────────────────────────────────────────────

describe("checkOptimisticConcurrency", () => {
  it("passes when versions match", () => {
    const entities: VersionedEntity[] = [
      {
        entityId: "bal-1",
        entityType: "GL_BALANCE",
        currentVersion: 5,
        expectedVersion: 5,
        updatedBy: "user-1",
        updatedAt: new Date(),
      },
    ];
    const { result } = checkOptimisticConcurrency(entities);
    expect(result.totalOk).toBe(1);
    expect(result.totalConflicts).toBe(0);
    expect(result.results[0]!.nextVersion).toBe(6);
  });

  it("detects stale read (expected < current)", () => {
    const entities: VersionedEntity[] = [
      {
        entityId: "bal-1",
        entityType: "GL_BALANCE",
        currentVersion: 7,
        expectedVersion: 5,
        updatedBy: "user-1",
        updatedAt: new Date(),
      },
    ];
    const { result } = checkOptimisticConcurrency(entities);
    expect(result.totalConflicts).toBe(1);
    expect(result.results[0]!.outcome).toBe("STALE_READ");
    expect(result.results[0]!.nextVersion).toBeNull();
  });

  it("detects version conflict (expected > current)", () => {
    const entities: VersionedEntity[] = [
      {
        entityId: "period-1",
        entityType: "FISCAL_PERIOD",
        currentVersion: 3,
        expectedVersion: 10,
        updatedBy: "user-1",
        updatedAt: new Date(),
      },
    ];
    const { result } = checkOptimisticConcurrency(entities);
    expect(result.totalConflicts).toBe(1);
    expect(result.results[0]!.outcome).toBe("VERSION_CONFLICT");
  });

  it("handles mixed results", () => {
    const entities: VersionedEntity[] = [
      {
        entityId: "bal-1",
        entityType: "GL_BALANCE",
        currentVersion: 5,
        expectedVersion: 5,
        updatedBy: "user-1",
        updatedAt: new Date(),
      },
      {
        entityId: "bal-2",
        entityType: "GL_BALANCE",
        currentVersion: 8,
        expectedVersion: 6,
        updatedBy: "user-2",
        updatedAt: new Date(),
      },
    ];
    const { result } = checkOptimisticConcurrency(entities);
    expect(result.totalOk).toBe(1);
    expect(result.totalConflicts).toBe(1);
  });

  it("throws on empty input", () => {
    expect(() => checkOptimisticConcurrency([])).toThrow("At least one");
  });
});

// ── Partition Strategy ──────────────────────────────────────────────────────

describe("computePartitionStrategy", () => {
  it("generates partition plan for large table", () => {
    const tables: TableVolumeMetrics[] = [
      {
        tableName: "erp.gl_journal_line",
        estimatedRowCount: 50_000_000n,
        avgRowSizeBytes: 256,
        oldestPeriod: "2024-P01",
        newestPeriod: "2026-P02",
        distinctPeriods: 26,
        partitionKeyColumn: "fiscal_period",
      },
    ];
    const { result } = computePartitionStrategy(tables);
    expect(result.plans.length).toBe(1);
    expect(result.plans[0]!.method).toBe("RANGE");
    expect(result.plans[0]!.totalPartitions).toBeGreaterThan(0);
    expect(result.plans[0]!.ddlStatements.length).toBeGreaterThan(0);
  });

  it("skips tables below row threshold", () => {
    const tables: TableVolumeMetrics[] = [
      {
        tableName: "erp.gl_balance",
        estimatedRowCount: 500_000n,
        avgRowSizeBytes: 128,
        oldestPeriod: "2025-P01",
        newestPeriod: "2026-P02",
        distinctPeriods: 14,
        partitionKeyColumn: "fiscal_period",
      },
    ];
    const { result } = computePartitionStrategy(tables);
    expect(result.plans.length).toBe(0);
    expect(result.recommendations.length).toBe(1);
    expect(result.recommendations[0]).toContain("not recommended");
  });

  it("handles multiple tables", () => {
    const tables: TableVolumeMetrics[] = [
      {
        tableName: "erp.gl_journal_line",
        estimatedRowCount: 100_000_000n,
        avgRowSizeBytes: 256,
        oldestPeriod: "2023-P01",
        newestPeriod: "2026-P02",
        distinctPeriods: 38,
        partitionKeyColumn: "fiscal_period",
      },
      {
        tableName: "erp.gl_balance",
        estimatedRowCount: 5_000_000n,
        avgRowSizeBytes: 128,
        oldestPeriod: "2023-P01",
        newestPeriod: "2026-P02",
        distinctPeriods: 38,
        partitionKeyColumn: "fiscal_period",
      },
    ];
    const { result } = computePartitionStrategy(tables);
    expect(result.plans.length).toBe(2);
  });

  it("throws on empty input", () => {
    expect(() => computePartitionStrategy([])).toThrow("At least one");
  });
});
