/**
 * @see GL-01 — Hierarchical CoA with account groups
 * @see FC-06 — Balance sheet (IAS 1 §54 line items)
 * @see FC-07 — Income statement: by nature or by function
 * @see FC-08 — Cash flow statement: indirect method (IAS 7)
 *
 * Pure calculator — no I/O, no side effects.
 * Classifies trial balance rows into financial report sections
 * using account.type instead of brittle charAt(0) prefix matching.
 */
import type { Money } from "@afenda/core";
import { money } from "@afenda/core";
import type { AccountType } from "../../../shared/types.js";
import type { ReportRow, ReportSection } from "../entities/financial-reports.js";
import type { CalculatorResult } from "../../../shared/types.js";

export interface ClassifiableRow {
  readonly accountCode: string;
  readonly accountName: string;
  readonly accountType: AccountType;
  readonly netBalance: bigint;
}

export interface BalanceSheetSections {
  readonly assets: ReportSection;
  readonly liabilities: ReportSection;
  readonly equity: ReportSection;
  readonly isBalanced: boolean;
}

export interface IncomeStatementSections {
  readonly revenue: ReportSection;
  readonly expenses: ReportSection;
  readonly netIncome: Money;
}

export interface CashFlowSections {
  readonly operatingActivities: Money;
  readonly investingActivities: Money;
  readonly financingActivities: Money;
  readonly netCashFlow: Money;
}

function buildSection(
  label: string,
  rows: ReportRow[],
  currency: string,
): ReportSection {
  const total = rows.reduce((sum, r) => sum + r.balance.amount, 0n);
  return { label, rows, total: money(total, currency) };
}

function toReportRow(row: ClassifiableRow, currency: string): ReportRow {
  const abs = row.netBalance < 0n ? -row.netBalance : row.netBalance;
  return {
    accountCode: row.accountCode,
    accountName: row.accountName,
    balance: money(abs, currency),
  };
}

/**
 * Classifies rows into balance sheet sections using account.type.
 * Replaces the old `charAt(0)` prefix matching.
 */
export function classifyBalanceSheet(
  rows: readonly ClassifiableRow[],
  currency: string,
): CalculatorResult<BalanceSheetSections> {
  const assetRows: ReportRow[] = [];
  const liabilityRows: ReportRow[] = [];
  const equityRows: ReportRow[] = [];

  for (const row of rows) {
    const reportRow = toReportRow(row, currency);
    switch (row.accountType) {
      case "ASSET":
        assetRows.push(reportRow);
        break;
      case "LIABILITY":
        liabilityRows.push(reportRow);
        break;
      case "EQUITY":
        equityRows.push(reportRow);
        break;
      default:
        break;
    }
  }

  const assets = buildSection("Assets", assetRows, currency);
  const liabilities = buildSection("Liabilities", liabilityRows, currency);
  const equity = buildSection("Equity", equityRows, currency);
  const isBalanced = assets.total.amount === liabilities.total.amount + equity.total.amount;

  return {
    result: { assets, liabilities, equity, isBalanced },
    inputs: { rowCount: rows.length, currency },
    explanation: `Balance sheet: A=${assets.total.amount} L=${liabilities.total.amount} E=${equity.total.amount} balanced=${isBalanced}`,
  };
}

/**
 * Classifies rows into income statement sections using account.type.
 * Replaces the old `charAt(0)` prefix matching.
 */
export function classifyIncomeStatement(
  rows: readonly ClassifiableRow[],
  currency: string,
): CalculatorResult<IncomeStatementSections> {
  const revenueRows: ReportRow[] = [];
  const expenseRows: ReportRow[] = [];

  for (const row of rows) {
    const reportRow = toReportRow(row, currency);
    switch (row.accountType) {
      case "REVENUE":
        revenueRows.push(reportRow);
        break;
      case "EXPENSE":
        expenseRows.push(reportRow);
        break;
      default:
        break;
    }
  }

  const revenue = buildSection("Revenue", revenueRows, currency);
  const expenses = buildSection("Expenses", expenseRows, currency);
  const netIncome = money(revenue.total.amount - expenses.total.amount, currency);

  return {
    result: { revenue, expenses, netIncome },
    inputs: { rowCount: rows.length, currency },
    explanation: `Income statement: Rev=${revenue.total.amount} Exp=${expenses.total.amount} Net=${netIncome.amount}`,
  };
}

/**
 * Classifies rows into cash flow sections using account.type.
 * Replaces the old `charAt(0)` prefix matching.
 *
 * Classification:
 *   REVENUE + EXPENSE → Operating activities
 *   ASSET (excl. cash accounts) → Investing activities (sign inverted)
 *   LIABILITY + EQUITY → Financing activities
 *
 * @param cashAccountCodes - account codes to exclude (they ARE the cash flow)
 */
export function classifyCashFlow(
  rows: readonly ClassifiableRow[],
  currency: string,
  cashAccountCodes: readonly string[] = ["1000"],
): CalculatorResult<CashFlowSections> {
  const cashSet = new Set(cashAccountCodes);
  let operating = 0n;
  let investing = 0n;
  let financing = 0n;

  for (const row of rows) {
    if (cashSet.has(row.accountCode)) continue;

    switch (row.accountType) {
      case "REVENUE":
      case "EXPENSE":
        operating += row.netBalance;
        break;
      case "ASSET":
        investing -= row.netBalance;
        break;
      case "LIABILITY":
      case "EQUITY":
        financing += row.netBalance;
        break;
    }
  }

  const netCashFlow = operating + investing + financing;

  return {
    result: {
      operatingActivities: money(operating, currency),
      investingActivities: money(investing, currency),
      financingActivities: money(financing, currency),
      netCashFlow: money(netCashFlow, currency),
    },
    inputs: { rowCount: rows.length, currency, cashAccountCodes },
    explanation: `Cash flow: Op=${operating} Inv=${investing} Fin=${financing} Net=${netCashFlow}`,
  };
}
