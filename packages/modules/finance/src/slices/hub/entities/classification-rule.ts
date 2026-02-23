import type { AccountType } from "../../gl/entities/account.js";

/**
 * @see GL-09 — Account classification (reporting)
 * @see AIS A-18 — Versioned classification rules (multi-standard)
 *
 * A classification rule maps an account type (or specific account code pattern)
 * to a financial statement category under a given reporting standard.
 * Rules are versioned so auditors can trace which mapping was active at report time.
 */

export type ReportingStandard = "IFRS" | "US_GAAP" | "LOCAL";

export type StatementCategory =
  | "CURRENT_ASSETS"
  | "NON_CURRENT_ASSETS"
  | "CURRENT_LIABILITIES"
  | "NON_CURRENT_LIABILITIES"
  | "EQUITY"
  | "OPERATING_REVENUE"
  | "NON_OPERATING_REVENUE"
  | "COST_OF_SALES"
  | "OPERATING_EXPENSES"
  | "NON_OPERATING_EXPENSES"
  | "OTHER_COMPREHENSIVE_INCOME";

export interface ClassificationRule {
  readonly id: string;
  readonly standard: ReportingStandard;
  readonly version: number;
  readonly accountType: AccountType;
  readonly accountCodePattern?: string;
  readonly statementCategory: StatementCategory;
  readonly effectiveFrom: Date;
  readonly effectiveTo?: Date;
  readonly createdBy: string;
  readonly createdAt: Date;
}

export interface ClassificationRuleSet {
  readonly standard: ReportingStandard;
  readonly version: number;
  readonly rules: readonly ClassificationRule[];
  readonly effectiveFrom: Date;
}

/**
 * Resolves the statement category for a given account using a rule set.
 * Rules are matched by: exact accountCodePattern first, then accountType fallback.
 */
export function resolveCategory(
  accountCode: string,
  accountType: AccountType,
  ruleSet: ClassificationRuleSet,
): StatementCategory | undefined {
  // Exact code pattern match first
  const codeMatch = ruleSet.rules.find(
    (r) => r.accountCodePattern && matchesPattern(accountCode, r.accountCodePattern),
  );
  if (codeMatch) return codeMatch.statementCategory;

  // Fallback to account type match
  const typeMatch = ruleSet.rules.find(
    (r) => !r.accountCodePattern && r.accountType === accountType,
  );
  return typeMatch?.statementCategory;
}

/**
 * Simple glob-style pattern matching for account codes.
 * Supports trailing wildcard: "1*" matches "1000", "1100", etc.
 */
function matchesPattern(code: string, pattern: string): boolean {
  if (pattern.endsWith("*")) {
    return code.startsWith(pattern.slice(0, -1));
  }
  return code === pattern;
}

/**
 * Default IFRS classification rules (v1).
 * Maps the 5 base account types to standard IFRS statement categories.
 */
export function defaultIfrsRules(): ClassificationRuleSet {
  const now = new Date();
  const base = {
    id: "",
    standard: "IFRS" as ReportingStandard,
    version: 1,
    effectiveFrom: new Date("2020-01-01"),
    createdBy: "system",
    createdAt: now,
  };
  return {
    standard: "IFRS",
    version: 1,
    effectiveFrom: new Date("2020-01-01"),
    rules: [
      { ...base, id: "ifrs-v1-asset", accountType: "ASSET", statementCategory: "CURRENT_ASSETS" },
      { ...base, id: "ifrs-v1-liability", accountType: "LIABILITY", statementCategory: "CURRENT_LIABILITIES" },
      { ...base, id: "ifrs-v1-equity", accountType: "EQUITY", statementCategory: "EQUITY" },
      { ...base, id: "ifrs-v1-revenue", accountType: "REVENUE", statementCategory: "OPERATING_REVENUE" },
      { ...base, id: "ifrs-v1-expense", accountType: "EXPENSE", statementCategory: "OPERATING_EXPENSES" },
    ],
  };
}
