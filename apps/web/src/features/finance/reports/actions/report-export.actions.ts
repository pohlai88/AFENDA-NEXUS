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
  ApAgingResult,
  ArAgingResult,
  AssetRegisterResult,
  ConsolidationReportResult,
  CostAllocationResult,
  EquityStatementResult,
  TaxSummaryResult,
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

// ─── AP Aging ───────────────────────────────────────────────────────────────

export function buildApAgingExport(data: ApAgingResult): ExportPayload {
  return {
    title: 'Accounts Payable Aging',
    subtitle: `As of ${data.asOfDate}`,
    generatedAt: new Date().toISOString(),
    currency: data.currency,
    sections: [
      {
        title: 'AP Aging',
        columns: [
          { key: 'supplierName', header: 'Supplier', align: 'left' },
          { key: 'invoiceCount', header: 'Invoices', align: 'right' },
          { key: 'current', header: 'Current', align: 'right' },
          { key: 'days30', header: '1-30 Days', align: 'right' },
          { key: 'days60', header: '31-60 Days', align: 'right' },
          { key: 'days90', header: '61-90 Days', align: 'right' },
          { key: 'over90', header: '90+ Days', align: 'right' },
          { key: 'total', header: 'Total', align: 'right' },
        ],
        rows: data.rows.map((r) => ({
          supplierName: r.supplierName,
          invoiceCount: r.invoiceCount,
          current: r.current,
          days30: r.days30,
          days60: r.days60,
          days90: r.days90,
          over90: r.over90,
          total: r.total,
        })),
        footer: {
          supplierName: 'Total',
          invoiceCount: '',
          current: data.totals.current,
          days30: data.totals.days30,
          days60: data.totals.days60,
          days90: data.totals.days90,
          over90: data.totals.over90,
          total: data.totals.total,
        },
      },
    ],
  };
}

// ─── AR Aging ───────────────────────────────────────────────────────────────

export function buildArAgingExport(data: ArAgingResult): ExportPayload {
  return {
    title: 'Accounts Receivable Aging',
    subtitle: `As of ${data.asOfDate}`,
    generatedAt: new Date().toISOString(),
    currency: data.currency,
    sections: [
      {
        title: 'AR Aging',
        columns: [
          { key: 'customerName', header: 'Customer', align: 'left' },
          { key: 'invoiceCount', header: 'Invoices', align: 'right' },
          { key: 'creditLimit', header: 'Credit Limit', align: 'right' },
          { key: 'current', header: 'Current', align: 'right' },
          { key: 'days30', header: '1-30 Days', align: 'right' },
          { key: 'days60', header: '31-60 Days', align: 'right' },
          { key: 'days90', header: '61-90 Days', align: 'right' },
          { key: 'over90', header: '90+ Days', align: 'right' },
          { key: 'total', header: 'Total', align: 'right' },
        ],
        rows: data.rows.map((r) => ({
          customerName: r.customerName,
          invoiceCount: r.invoiceCount,
          creditLimit: r.creditLimit,
          current: r.current,
          days30: r.days30,
          days60: r.days60,
          days90: r.days90,
          over90: r.over90,
          total: r.total,
        })),
        footer: {
          customerName: 'Total',
          invoiceCount: '',
          creditLimit: '',
          current: data.totals.current,
          days30: data.totals.days30,
          days60: data.totals.days60,
          days90: data.totals.days90,
          over90: data.totals.over90,
          total: data.totals.total,
        },
      },
    ],
  };
}

// ─── Asset Register ─────────────────────────────────────────────────────────

export function buildAssetRegisterExport(data: AssetRegisterResult): ExportPayload {
  return {
    title: 'Fixed Asset Register',
    subtitle: `As of ${data.asOfDate}`,
    generatedAt: new Date().toISOString(),
    currency: data.currency,
    sections: [
      {
        title: 'Asset Register',
        columns: [
          { key: 'assetCode', header: 'Asset Code', align: 'left' },
          { key: 'description', header: 'Description', align: 'left' },
          { key: 'category', header: 'Category', align: 'left' },
          { key: 'acquisitionDate', header: 'Acquired', align: 'left' },
          { key: 'costAmount', header: 'Cost', align: 'right' },
          { key: 'accumulatedDepreciation', header: 'Accum. Depr.', align: 'right' },
          { key: 'netBookValue', header: 'NBV', align: 'right' },
          { key: 'status', header: 'Status', align: 'left' },
        ],
        rows: data.rows.map((r) => ({
          assetCode: r.assetCode,
          description: r.description,
          category: r.category,
          acquisitionDate: r.acquisitionDate,
          costAmount: r.costAmount,
          accumulatedDepreciation: r.accumulatedDepreciation,
          netBookValue: r.netBookValue,
          status: r.status,
        })),
        footer: {
          assetCode: '',
          description: 'Total',
          category: '',
          acquisitionDate: '',
          costAmount: data.totalCost,
          accumulatedDepreciation: data.totalDepreciation,
          netBookValue: data.totalNBV,
          status: '',
        },
      },
    ],
  };
}

// ─── Consolidation ──────────────────────────────────────────────────────────

export function buildConsolidationReportExport(data: ConsolidationReportResult): ExportPayload {
  return {
    title: 'Consolidation Report',
    subtitle: `As of ${data.asOfDate}`,
    generatedAt: new Date().toISOString(),
    currency: data.currency,
    sections: [
      {
        title: 'Entity Consolidation',
        columns: [
          { key: 'entityCode', header: 'Entity Code', align: 'left' },
          { key: 'entityName', header: 'Entity Name', align: 'left' },
          { key: 'currency', header: 'Currency', align: 'left' },
          { key: 'ownershipPercent', header: 'Ownership %', align: 'right' },
          { key: 'method', header: 'Method', align: 'left' },
          { key: 'assets', header: 'Assets', align: 'right' },
          { key: 'liabilities', header: 'Liabilities', align: 'right' },
          { key: 'equity', header: 'Equity', align: 'right' },
        ],
        rows: data.rows.map((r) => ({
          entityCode: r.entityCode,
          entityName: r.entityName,
          currency: r.currency,
          ownershipPercent: `${r.ownershipPercent}%`,
          method: r.method,
          assets: r.assets,
          liabilities: r.liabilities,
          equity: r.equity,
        })),
        footer: {
          entityCode: '',
          entityName: 'Consolidated Total',
          currency: '',
          ownershipPercent: '',
          method: '',
          assets: data.totalAssets,
          liabilities: data.totalLiabilities,
          equity: data.totalEquity,
        },
      },
    ],
  };
}

// ─── Cost Allocation ────────────────────────────────────────────────────────

export function buildCostAllocationExport(data: CostAllocationResult): ExportPayload {
  return {
    title: 'Cost Allocation Report',
    subtitle: data.periodRange,
    generatedAt: new Date().toISOString(),
    currency: data.currency,
    sections: [
      {
        title: 'Cost Allocation by Cost Center',
        columns: [
          { key: 'costCenterCode', header: 'Code', align: 'left' },
          { key: 'costCenterName', header: 'Cost Center', align: 'left' },
          { key: 'directCosts', header: 'Direct Costs', align: 'right' },
          { key: 'allocatedCosts', header: 'Allocated Costs', align: 'right' },
          { key: 'totalCosts', header: 'Total', align: 'right' },
          { key: 'allocationPercent', header: 'Allocation %', align: 'right' },
        ],
        rows: data.rows.map((r) => ({
          costCenterCode: r.costCenterCode,
          costCenterName: r.costCenterName,
          directCosts: r.directCosts,
          allocatedCosts: r.allocatedCosts,
          totalCosts: r.totalCosts,
          allocationPercent: `${r.allocationPercent.toFixed(1)}%`,
        })),
        footer: {
          costCenterCode: '',
          costCenterName: 'Grand Total',
          directCosts: data.totalDirectCosts,
          allocatedCosts: data.totalAllocatedCosts,
          totalCosts: data.grandTotal,
          allocationPercent: '',
        },
      },
    ],
  };
}

// ─── Equity Statement ───────────────────────────────────────────────────────

export function buildEquityStatementExport(data: EquityStatementResult): ExportPayload {
  return {
    title: 'Statement of Changes in Equity',
    subtitle: data.periodRange,
    generatedAt: new Date().toISOString(),
    currency: data.currency,
    sections: [
      {
        title: 'Changes in Equity',
        columns: [
          { key: 'description', header: 'Description', align: 'left' },
          { key: 'shareCapital', header: 'Share Capital', align: 'right' },
          { key: 'retainedEarnings', header: 'Retained Earnings', align: 'right' },
          { key: 'otherReserves', header: 'Other Reserves', align: 'right' },
          { key: 'nci', header: 'NCI', align: 'right' },
          { key: 'total', header: 'Total', align: 'right' },
        ],
        rows: [
          {
            description: 'Opening Balance',
            shareCapital: data.openingBalance.shareCapital,
            retainedEarnings: data.openingBalance.retainedEarnings,
            otherReserves: data.openingBalance.otherReserves,
            nci: data.openingBalance.nci,
            total: data.openingBalance.total,
          },
          ...data.rows.map((r) => ({
            description: r.description,
            shareCapital: r.shareCapital,
            retainedEarnings: r.retainedEarnings,
            otherReserves: r.otherReserves,
            nci: r.nci,
            total: r.total,
          })),
        ],
        footer: {
          description: 'Closing Balance',
          shareCapital: data.closingBalance.shareCapital,
          retainedEarnings: data.closingBalance.retainedEarnings,
          otherReserves: data.closingBalance.otherReserves,
          nci: data.closingBalance.nci,
          total: data.closingBalance.total,
        },
      },
    ],
  };
}

// ─── Tax Summary ────────────────────────────────────────────────────────────

export function buildTaxSummaryExport(data: TaxSummaryResult): ExportPayload {
  return {
    title: 'Tax Summary',
    subtitle: data.periodRange,
    generatedAt: new Date().toISOString(),
    currency: data.currency,
    sections: [
      {
        title: 'Tax Summary',
        columns: [
          { key: 'taxCode', header: 'Tax Code', align: 'left' },
          { key: 'taxName', header: 'Tax Name', align: 'left' },
          { key: 'taxableBase', header: 'Taxable Base', align: 'right' },
          { key: 'taxAmount', header: 'Tax Amount', align: 'right' },
          { key: 'adjustments', header: 'Adjustments', align: 'right' },
          { key: 'netTax', header: 'Net Tax', align: 'right' },
        ],
        rows: data.rows.map((r) => ({
          taxCode: r.taxCode,
          taxName: r.taxName,
          taxableBase: r.taxableBase,
          taxAmount: r.taxAmount,
          adjustments: r.adjustments,
          netTax: r.netTax,
        })),
        footer: {
          taxCode: '',
          taxName: 'Total',
          taxableBase: data.totalTaxableBase,
          taxAmount: data.totalTaxAmount,
          adjustments: data.totalAdjustments,
          netTax: data.totalNetTax,
        },
      },
    ],
  };
}
