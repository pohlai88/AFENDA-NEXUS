/**
 * Report Export Builders — transform typed report data into ExportPayload.
 *
 * Each builder accepts the report's typed result and returns an
 * `ExportPayload`. The client-side `ExportMenu` then serializes
 * via `toCSV`/`toJSON` and triggers the download.
 *
 * These are **pure functions** (not server actions) so they can be
 * called from both RSC pages and client components.
 *
 * @module report-export-builders
 */

import type { ExportPayload, ExportSection } from '@/lib/report-export';
import type {
  TrialBalanceResult,
  BalanceSheetResult,
  IncomeStatementResult,
  CashFlowResult,
  ReportSection,
} from '@/features/finance/reports/queries/report.queries';
import type { BudgetVarianceResult } from '@/features/finance/budgets/queries/budget.queries';
import type { IcAgingResult } from '@/features/finance/intercompany/queries/ic.queries';

// ─── Shared Helpers ─────────────────────────────────────────────────────────

function reportSection(section: ReportSection): ExportSection {
  return {
    title: section.label,
    columns: [
      { key: 'accountCode', header: 'Account Code', align: 'left' },
      { key: 'accountName', header: 'Account Name', align: 'left' },
      { key: 'balance', header: 'Balance', align: 'right' },
    ],
    rows: section.rows.map((r) => ({
      accountCode: r.accountCode,
      accountName: r.accountName,
      balance: r.balance,
    })),
    footer: { accountCode: '', accountName: `Total ${section.label}`, balance: section.total },
  };
}

// ─── Trial Balance ──────────────────────────────────────────────────────────

export function buildTrialBalanceExport(data: TrialBalanceResult): ExportPayload {
  return {
    title: 'Trial Balance',
    subtitle: `As of ${data.asOfDate}`,
    generatedAt: new Date().toISOString(),
    sections: [
      {
        title: 'Trial Balance',
        columns: [
          { key: 'accountCode', header: 'Account Code', align: 'left' },
          { key: 'accountName', header: 'Account Name', align: 'left' },
          { key: 'debit', header: 'Debit', align: 'right' },
          { key: 'credit', header: 'Credit', align: 'right' },
          { key: 'balance', header: 'Balance', align: 'right' },
        ],
        rows: data.rows.map((r) => ({
          accountCode: r.accountCode,
          accountName: r.accountName,
          debit: r.debit,
          credit: r.credit,
          balance: r.balance,
        })),
        footer: {
          accountCode: '',
          accountName: 'Totals',
          debit: data.totalDebit,
          credit: data.totalCredit,
          balance: '',
        },
      },
    ],
  };
}

// ─── Balance Sheet ──────────────────────────────────────────────────────────

export function buildBalanceSheetExport(data: BalanceSheetResult): ExportPayload {
  return {
    title: 'Balance Sheet',
    subtitle: `As of ${data.asOfDate}`,
    generatedAt: new Date().toISOString(),
    sections: [
      reportSection(data.assets),
      reportSection(data.liabilities),
      reportSection(data.equity),
    ],
  };
}

// ─── Income Statement ───────────────────────────────────────────────────────

export function buildIncomeStatementExport(data: IncomeStatementResult): ExportPayload {
  return {
    title: 'Income Statement',
    subtitle: data.periodRange,
    generatedAt: new Date().toISOString(),
    sections: [
      reportSection(data.revenue),
      reportSection(data.expenses),
      {
        title: 'Summary',
        columns: [
          { key: 'label', header: '', align: 'left' },
          { key: 'amount', header: 'Amount', align: 'right' },
        ],
        rows: [{ label: 'Net Income', amount: data.netIncome }],
      },
    ],
  };
}

// ─── Cash Flow ──────────────────────────────────────────────────────────────

export function buildCashFlowExport(data: CashFlowResult): ExportPayload {
  return {
    title: 'Cash Flow Statement',
    subtitle: data.periodRange,
    generatedAt: new Date().toISOString(),
    sections: [
      {
        title: 'Cash Flow Statement',
        columns: [
          { key: 'category', header: 'Category', align: 'left' },
          { key: 'amount', header: 'Amount', align: 'right' },
        ],
        rows: [
          { category: 'Operating Activities', amount: data.operatingActivities },
          { category: 'Investing Activities', amount: data.investingActivities },
          { category: 'Financing Activities', amount: data.financingActivities },
        ],
        footer: { category: 'Net Cash Flow', amount: data.netCashFlow },
      },
    ],
  };
}

// ─── Budget Variance ────────────────────────────────────────────────────────

export function buildBudgetVarianceExport(data: BudgetVarianceResult): ExportPayload {
  return {
    title: 'Budget Variance Report',
    generatedAt: new Date().toISOString(),
    sections: [
      {
        title: 'Budget Variance',
        columns: [
          { key: 'accountCode', header: 'Account Code', align: 'left' },
          { key: 'accountName', header: 'Account Name', align: 'left' },
          { key: 'budgetAmount', header: 'Budget', align: 'right' },
          { key: 'actualAmount', header: 'Actual', align: 'right' },
          { key: 'variance', header: 'Variance', align: 'right' },
          { key: 'variancePct', header: 'Variance %', align: 'right' },
        ],
        rows: data.rows.map((r) => ({
          accountCode: r.accountCode,
          accountName: r.accountName,
          budgetAmount: r.budgetAmount,
          actualAmount: r.actualAmount,
          variance: r.variance,
          variancePct: `${r.variancePct > 0 ? '+' : ''}${r.variancePct.toFixed(1)}%`,
        })),
        footer: {
          accountCode: '',
          accountName: 'Total',
          budgetAmount: data.totalBudget,
          actualAmount: data.totalActual,
          variance: data.totalVariance,
          variancePct: '',
        },
      },
    ],
  };
}

// ─── IC Aging ───────────────────────────────────────────────────────────────

export function buildIcAgingExport(data: IcAgingResult): ExportPayload {
  return {
    title: 'Intercompany Aging Report',
    subtitle: `As of ${data.asOfDate}`,
    generatedAt: new Date().toISOString(),
    currency: data.currency,
    sections: [
      {
        title: 'IC Aging',
        columns: [
          { key: 'companyName', header: 'Company', align: 'left' },
          { key: 'counterpartyName', header: 'Counterparty', align: 'left' },
          { key: 'current', header: 'Current', align: 'right' },
          { key: 'days30', header: '1-30 Days', align: 'right' },
          { key: 'days60', header: '31-60 Days', align: 'right' },
          { key: 'days90Plus', header: '90+ Days', align: 'right' },
          { key: 'total', header: 'Total', align: 'right' },
        ],
        rows: data.rows.map((r) => ({
          companyName: r.companyName,
          counterpartyName: r.counterpartyName,
          current: r.current,
          days30: r.days30,
          days60: r.days60,
          days90Plus: r.days90Plus,
          total: r.total,
        })),
        footer: {
          companyName: '',
          counterpartyName: 'Grand Total',
          current: '',
          days30: '',
          days60: '',
          days90Plus: '',
          total: data.grandTotal,
        },
      },
    ],
  };
}
