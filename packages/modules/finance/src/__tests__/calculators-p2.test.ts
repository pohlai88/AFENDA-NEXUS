import { describe, it, expect } from "vitest";
import {
  validateCoaIntegrity,
  getSubtree,
  getAncestors,
  validateDimensions,
} from "../domain/calculators/index.js";
import { createFinanceContext } from "../domain/finance-context.js";
import type { AccountNode } from "../domain/calculators/coa-hierarchy.js";
import type { DimensionValue, JournalLineDimensions } from "../domain/calculators/segment-dimension.js";

function makeNode(overrides: Partial<AccountNode> = {}): AccountNode {
  return {
    id: "a1",
    accountCode: "1000",
    accountName: "Cash",
    accountType: "ASSET",
    normalBalance: "DEBIT",
    parentId: null,
    isPostable: true,
    ...overrides,
  };
}

const SAMPLE_COA: AccountNode[] = [
  makeNode({ id: "root-a", accountCode: "1000", accountName: "Assets", parentId: null, isPostable: false }),
  makeNode({ id: "a1", accountCode: "1100", accountName: "Cash", parentId: "root-a" }),
  makeNode({ id: "a2", accountCode: "1200", accountName: "AR", parentId: "root-a" }),
  makeNode({ id: "root-l", accountCode: "2000", accountName: "Liabilities", accountType: "LIABILITY", normalBalance: "CREDIT", parentId: null, isPostable: false }),
  makeNode({ id: "l1", accountCode: "2100", accountName: "AP", accountType: "LIABILITY", normalBalance: "CREDIT", parentId: "root-l" }),
];

describe("validateCoaIntegrity", () => {
  it("validates a well-formed CoA", () => {
    const result = validateCoaIntegrity(SAMPLE_COA);
    expect(result.result.valid).toBe(true);
    expect(result.result.accountCount).toBe(5);
    expect(result.result.rootCount).toBe(2);
    expect(result.result.maxDepth).toBe(2);
    expect(result.result.errors).toHaveLength(0);
  });

  it("detects missing parent reference", () => {
    const broken = [
      makeNode({ id: "a1", parentId: "nonexistent" }),
    ];
    const result = validateCoaIntegrity(broken);
    expect(result.result.valid).toBe(false);
    expect(result.result.errors[0]).toContain("non-existent parent");
  });

  it("detects cycle in hierarchy", () => {
    const cyclic = [
      makeNode({ id: "a1", accountCode: "1000", parentId: "a2" }),
      makeNode({ id: "a2", accountCode: "2000", parentId: "a1" }),
    ];
    const result = validateCoaIntegrity(cyclic);
    expect(result.result.valid).toBe(false);
    expect(result.result.errors[0]).toContain("Cycle");
  });

  it("handles empty CoA", () => {
    const result = validateCoaIntegrity([]);
    expect(result.result.valid).toBe(true);
    expect(result.result.accountCount).toBe(0);
  });
});

describe("getSubtree", () => {
  it("returns all children of a root node", () => {
    const result = getSubtree("root-a", SAMPLE_COA);
    expect(result.result).toHaveLength(2);
    expect(result.result.map((n) => n.accountCode)).toContain("1100");
    expect(result.result.map((n) => n.accountCode)).toContain("1200");
  });

  it("returns all root nodes when rootId is null", () => {
    const result = getSubtree(null, SAMPLE_COA);
    expect(result.result.length).toBeGreaterThanOrEqual(2);
  });

  it("returns empty for leaf node with no children", () => {
    const result = getSubtree("a1", SAMPLE_COA);
    expect(result.result).toHaveLength(0);
  });
});

describe("getAncestors", () => {
  it("returns ancestor chain from leaf to root", () => {
    const result = getAncestors("a1", SAMPLE_COA);
    expect(result.result).toHaveLength(2);
    expect(result.result[0].id).toBe("a1");
    expect(result.result[1].id).toBe("root-a");
  });

  it("returns single node for root", () => {
    const result = getAncestors("root-a", SAMPLE_COA);
    expect(result.result).toHaveLength(1);
  });

  it("throws on cycle", () => {
    const cyclic = [
      makeNode({ id: "a1", parentId: "a2" }),
      makeNode({ id: "a2", parentId: "a1" }),
    ];
    expect(() => getAncestors("a1", cyclic)).toThrow("Cycle");
  });
});

describe("validateDimensions", () => {
  const dims: DimensionValue[] = [
    { dimensionType: "segment", code: "SEG-01", label: "Segment 1", parentCode: null, isActive: true },
    { dimensionType: "segment", code: "SEG-02", label: "Segment 2", parentCode: null, isActive: true },
    { dimensionType: "cost_center", code: "CC-100", label: "Engineering", parentCode: null, isActive: true },
    { dimensionType: "cost_center", code: "CC-200", label: "Sales", parentCode: null, isActive: false },
    { dimensionType: "profit_center", code: "PC-A", label: "Region A", parentCode: null, isActive: true },
    { dimensionType: "project", code: "PRJ-001", label: "Project Alpha", parentCode: null, isActive: true },
  ];

  it("validates all lines with valid dimensions", () => {
    const lines: JournalLineDimensions[] = [
      { lineId: "L1", accountId: "a1", segment: "SEG-01", costCenter: "CC-100" },
      { lineId: "L2", accountId: "a2", profitCenter: "PC-A" },
    ];
    const result = validateDimensions(lines, dims);
    expect(result.result.allValid).toBe(true);
    expect(result.result.validLines).toHaveLength(2);
    expect(result.result.invalidLines).toHaveLength(0);
  });

  it("rejects lines with invalid segment", () => {
    const lines: JournalLineDimensions[] = [
      { lineId: "L1", accountId: "a1", segment: "SEG-INVALID" },
    ];
    const result = validateDimensions(lines, dims);
    expect(result.result.allValid).toBe(false);
    expect(result.result.invalidLines[0].errors[0]).toContain("Invalid segment");
  });

  it("rejects inactive dimension values", () => {
    const lines: JournalLineDimensions[] = [
      { lineId: "L1", accountId: "a1", costCenter: "CC-200" },
    ];
    const result = validateDimensions(lines, dims);
    expect(result.result.allValid).toBe(false);
    expect(result.result.invalidLines[0].errors[0]).toContain("Invalid cost center");
  });

  it("validates project dimension", () => {
    const lines: JournalLineDimensions[] = [
      { lineId: "L1", accountId: "a1", project: "PRJ-001" },
    ];
    const result = validateDimensions(lines, dims);
    expect(result.result.allValid).toBe(true);
  });

  it("allows lines with no dimensions", () => {
    const lines: JournalLineDimensions[] = [
      { lineId: "L1", accountId: "a1" },
    ];
    const result = validateDimensions(lines, dims);
    expect(result.result.allValid).toBe(true);
  });

  it("throws on empty lines", () => {
    expect(() => validateDimensions([], dims)).toThrow("empty");
  });
});

describe("createFinanceContext", () => {
  it("creates context with defaults", () => {
    const ctx = createFinanceContext({
      tenantId: "t1",
      userId: "u1",
      companyId: "c1",
    });
    expect(ctx.tenantId).toBe("t1");
    expect(ctx.actor.userId).toBe("u1");
    expect(String(ctx.companyId)).toBe("c1");
    expect(ctx.currency).toBe("USD");
    expect(ctx.actor.roles).toEqual([]);
    expect(ctx.asOf).toBeInstanceOf(Date);
  });

  it("accepts overrides", () => {
    const asOf = new Date("2025-01-01");
    const ctx = createFinanceContext({
      tenantId: "t1",
      userId: "u1",
      companyId: "c1",
      currency: "MYR",
      roles: ["ADMIN", "GL_POST"],
      asOf,
    });
    expect(ctx.currency).toBe("MYR");
    expect(ctx.actor.roles).toEqual(["ADMIN", "GL_POST"]);
    expect(ctx.asOf).toBe(asOf);
  });
});
