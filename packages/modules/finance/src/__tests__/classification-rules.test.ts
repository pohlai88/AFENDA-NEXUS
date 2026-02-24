import { describe, it, expect } from "vitest";
import { resolveCategory, defaultIfrsRules } from "../slices/hub/entities/classification-rule.js";
import type { ClassificationRuleSet, ClassificationRule, ReportingStandard } from "../slices/hub/entities/classification-rule.js";

describe("resolveCategory (A-18)", () => {
  const ifrs = defaultIfrsRules();

  it("resolves ASSET to CURRENT_ASSETS under default IFRS rules", () => {
    expect(resolveCategory("1000", "ASSET", ifrs)).toBe("CURRENT_ASSETS");
  });

  it("resolves REVENUE to OPERATING_REVENUE under default IFRS rules", () => {
    expect(resolveCategory("4000", "REVENUE", ifrs)).toBe("OPERATING_REVENUE");
  });

  it("resolves EXPENSE to OPERATING_EXPENSES under default IFRS rules", () => {
    expect(resolveCategory("5000", "EXPENSE", ifrs)).toBe("OPERATING_EXPENSES");
  });

  it("resolves LIABILITY to CURRENT_LIABILITIES under default IFRS rules", () => {
    expect(resolveCategory("2000", "LIABILITY", ifrs)).toBe("CURRENT_LIABILITIES");
  });

  it("resolves EQUITY to EQUITY under default IFRS rules", () => {
    expect(resolveCategory("3000", "EQUITY", ifrs)).toBe("EQUITY");
  });

  it("prefers code pattern match over type fallback", () => {
    const now = new Date();
    const base: Omit<ClassificationRule, "id" | "accountType" | "statementCategory" | "accountCodePattern"> = {
      standard: "IFRS" as ReportingStandard,
      version: 2,
      effectiveFrom: new Date("2020-01-01"),
      createdBy: "system",
      createdAt: now,
    };
    const ruleSet: ClassificationRuleSet = {
      standard: "IFRS",
      version: 2,
      effectiveFrom: new Date("2020-01-01"),
      rules: [
        { ...base, id: "r1", accountType: "ASSET", statementCategory: "CURRENT_ASSETS" },
        { ...base, id: "r2", accountType: "ASSET", accountCodePattern: "15*", statementCategory: "NON_CURRENT_ASSETS" },
      ],
    };

    expect(resolveCategory("1000", "ASSET", ruleSet)).toBe("CURRENT_ASSETS");
    expect(resolveCategory("1500", "ASSET", ruleSet)).toBe("NON_CURRENT_ASSETS");
    expect(resolveCategory("1599", "ASSET", ruleSet)).toBe("NON_CURRENT_ASSETS");
  });

  it("returns undefined for unmatched account type", () => {
    const emptyRuleSet: ClassificationRuleSet = {
      standard: "IFRS",
      version: 1,
      effectiveFrom: new Date("2020-01-01"),
      rules: [],
    };
    expect(resolveCategory("9999", "ASSET", emptyRuleSet)).toBeUndefined();
  });
});

describe("defaultIfrsRules()", () => {
  it("returns 5 rules covering all account types", () => {
    const ruleSet = defaultIfrsRules();
    expect(ruleSet.rules).toHaveLength(5);
    expect(ruleSet.standard).toBe("IFRS");
    expect(ruleSet.version).toBe(1);
  });
});
