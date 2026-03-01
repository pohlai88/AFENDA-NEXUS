import type { MetricId } from './metric-id';

/**
 * Drilldown target - where to navigate when clicking a metric/chart
 */
export type DrilldownTarget =
  | { kind: 'report'; reportId: 'cashflow' | 'ar-aging' | 'ap-aging' | 'trial-balance' | 'balance-sheet' | 'income-statement' }
  | { kind: 'list'; entity: 'invoice' | 'payment' | 'journal' | 'asset' | 'supplier' | 'customer'; preset?: string }
  | { kind: 'dashboard'; dashboardId: string };

/**
 * Metric Definition - auditable specification for each metric
 */
export interface MetricDefinition {
  id: MetricId;
  label: string;
  description: string;         // Tooltip text (≤250 chars)
  unit: 'currency' | 'ratio' | 'percent' | 'days' | 'count';
  precision: number;            // Decimal places
  formula: string;              // Human-readable formula for audit trail
  owner: 'treasury' | 'ap' | 'ar' | 'gl' | 'assets' | 'cost-accounting' | 'tax' | 'pl';
  refreshCadence: 'realtime' | '5min' | '1hour' | 'daily';
  drilldown?: DrilldownTarget;  // Where to navigate on click
  thresholds?: {                // For gauges and alerts
    danger?: { operator: '<' | '>' | '<=' | '>='; value: number };
    warning?: { operator: '<' | '>' | '<=' | '>='; value: number };
    success?: { operator: '<' | '>' | '<=' | '>='; value: number };
  };
}

/**
 * Metric Registry - canonical definitions for all financial metrics
 * Single source of truth for metric calculations
 */
export const METRIC_REGISTRY: Record<MetricId, MetricDefinition> = {
  // === Cash & Treasury ===
  'fin.cash.position': {
    id: 'fin.cash.position',
    label: 'Cash Position',
    description: 'Total available cash across all bank accounts. Sum of all bank account balances (checking, savings, money market).',
    unit: 'currency',
    precision: 0,
    formula: 'SUM(bank_accounts.available_balance)',
    owner: 'treasury',
    refreshCadence: '5min',
    drilldown: { kind: 'list', entity: 'asset', preset: 'bank-accounts' },
  },
  
  'fin.cash.forecast-eom': {
    id: 'fin.cash.forecast-eom',
    label: 'Forecast End-of-Month',
    description: 'Projected cash balance at month end based on forecasted inflows and outflows.',
    unit: 'currency',
    precision: 0,
    formula: 'opening_balance + forecasted_inflows - forecasted_outflows',
    owner: 'treasury',
    refreshCadence: 'daily',
    drilldown: { kind: 'report', reportId: 'cashflow' },
  },
  
  'fin.treasury.loan-balance': {
    id: 'fin.treasury.loan-balance',
    label: 'Total Loan Balance',
    description: 'Outstanding balance on all intercompany and external loans.',
    unit: 'currency',
    precision: 0,
    formula: 'SUM(intercompany_loans.principal_balance)',
    owner: 'treasury',
    refreshCadence: 'daily',
  },
  
  // === Accounts Receivable ===
  'fin.ar.total': {
    id: 'fin.ar.total',
    label: 'Total Receivables',
    description: 'Total amount owed by customers. Sum of all unpaid AR invoices.',
    unit: 'currency',
    precision: 0,
    formula: 'SUM(ar_invoices.balance_due WHERE status != PAID)',
    owner: 'ar',
    refreshCadence: '1hour',
    drilldown: { kind: 'report', reportId: 'ar-aging' },
  },
  
  'fin.ar.dso': {
    id: 'fin.ar.dso',
    label: 'Days Sales Outstanding',
    description: 'Average days to collect receivables. Formula: (Ending AR / Credit Sales) × Days in Period. Lower is better.',
    unit: 'days',
    precision: 1,
    formula: '(Ending AR / Period Revenue) × Days',
    owner: 'ar',
    refreshCadence: 'daily',
    drilldown: { kind: 'report', reportId: 'ar-aging' },
    thresholds: {
      danger: { operator: '>', value: 60 },
      warning: { operator: '>', value: 45 },
      success: { operator: '<=', value: 30 },
    },
  },
  
  'fin.ar.current': {
    id: 'fin.ar.current',
    label: 'Current AR',
    description: 'Receivables not yet overdue (0-30 days).',
    unit: 'currency',
    precision: 0,
    formula: 'SUM(ar_invoices.balance_due WHERE aging_days <= 30)',
    owner: 'ar',
    refreshCadence: '1hour',
  },
  
  'fin.ar.overdue': {
    id: 'fin.ar.overdue',
    label: 'Overdue AR',
    description: 'Receivables past due date (>30 days).',
    unit: 'currency',
    precision: 0,
    formula: 'SUM(ar_invoices.balance_due WHERE aging_days > 30)',
    owner: 'ar',
    refreshCadence: '1hour',
    drilldown: { kind: 'list', entity: 'invoice', preset: 'overdue' },
  },
  
  'fin.ar.collection-rate': {
    id: 'fin.ar.collection-rate',
    label: 'Collection Rate',
    description: 'Percentage of receivables collected within period.',
    unit: 'percent',
    precision: 1,
    formula: '(Amount Collected / Opening AR) × 100',
    owner: 'ar',
    refreshCadence: 'daily',
  },
  
  // === Accounts Payable ===
  'fin.ap.total': {
    id: 'fin.ap.total',
    label: 'Total Payables',
    description: 'Total amount owed to suppliers. Sum of all unpaid AP invoices.',
    unit: 'currency',
    precision: 0,
    formula: 'SUM(ap_invoices.balance_due WHERE status != PAID)',
    owner: 'ap',
    refreshCadence: '1hour',
    drilldown: { kind: 'report', reportId: 'ap-aging' },
  },
  
  'fin.ap.current': {
    id: 'fin.ap.current',
    label: 'Current AP',
    description: 'Payables not yet due (0-30 days).',
    unit: 'currency',
    precision: 0,
    formula: 'SUM(ap_invoices.balance_due WHERE aging_days <= 30)',
    owner: 'ap',
    refreshCadence: '1hour',
  },
  
  'fin.ap.overdue': {
    id: 'fin.ap.overdue',
    label: 'Overdue AP',
    description: 'Payables past due date (>30 days).',
    unit: 'currency',
    precision: 0,
    formula: 'SUM(ap_invoices.balance_due WHERE aging_days > 30)',
    owner: 'ap',
    refreshCadence: '1hour',
    drilldown: { kind: 'list', entity: 'invoice', preset: 'ap-overdue' },
  },
  
  'fin.ap.dpo': {
    id: 'fin.ap.dpo',
    label: 'Days Payable Outstanding',
    description: 'Average days to pay suppliers. Formula: (Ending AP / COGS) × Days in Period.',
    unit: 'days',
    precision: 1,
    formula: '(Ending AP / Period COGS) × Days',
    owner: 'ap',
    refreshCadence: 'daily',
  },
  
  // === Financial Ratios ===
  'fin.ratio.current': {
    id: 'fin.ratio.current',
    label: 'Current Ratio',
    description: 'Liquidity ratio. Formula: Current Assets / Current Liabilities. Healthy range: 1.5-3.0. Below 1.0 indicates liquidity risk.',
    unit: 'ratio',
    precision: 2,
    formula: 'Current Assets / Current Liabilities',
    owner: 'gl',
    refreshCadence: 'daily',
    drilldown: { kind: 'report', reportId: 'balance-sheet' },
    thresholds: {
      danger: { operator: '<', value: 1.0 },
      warning: { operator: '<', value: 1.5 },
      success: { operator: '>=', value: 1.5 },
    },
  },
  
  'fin.ratio.quick': {
    id: 'fin.ratio.quick',
    label: 'Quick Ratio',
    description: 'Liquidity ratio excluding inventory. Formula: (Current Assets - Inventory) / Current Liabilities. Healthy range: 1.0-2.0.',
    unit: 'ratio',
    precision: 2,
    formula: '(Current Assets - Inventory) / Current Liabilities',
    owner: 'gl',
    refreshCadence: 'daily',
    drilldown: { kind: 'report', reportId: 'balance-sheet' },
    thresholds: {
      danger: { operator: '<', value: 0.5 },
      warning: { operator: '<', value: 1.0 },
      success: { operator: '>=', value: 1.0 },
    },
  },
  
  'fin.ratio.debt-equity': {
    id: 'fin.ratio.debt-equity',
    label: 'Debt-to-Equity',
    description: 'Leverage ratio. Formula: Total Liabilities / Shareholders Equity. Lower is better. Above 2.0 indicates high leverage risk.',
    unit: 'ratio',
    precision: 2,
    formula: 'Total Liabilities / Shareholders Equity',
    owner: 'gl',
    refreshCadence: 'daily',
    drilldown: { kind: 'report', reportId: 'balance-sheet' },
    thresholds: {
      danger: { operator: '>', value: 2.0 },
      warning: { operator: '>', value: 1.5 },
      success: { operator: '<=', value: 1.0 },
    },
  },
  
  'fin.ratio.roa': {
    id: 'fin.ratio.roa',
    label: 'Return on Assets',
    description: 'Profitability ratio. Formula: Net Income / Total Assets × 100. Measures efficiency of asset utilization.',
    unit: 'percent',
    precision: 2,
    formula: '(Net Income / Total Assets) × 100',
    owner: 'gl',
    refreshCadence: 'daily',
  },
  
  'fin.ratio.roe': {
    id: 'fin.ratio.roe',
    label: 'Return on Equity',
    description: 'Profitability ratio. Formula: Net Income / Shareholders Equity × 100. Measures return to shareholders.',
    unit: 'percent',
    precision: 2,
    formula: '(Net Income / Shareholders Equity) × 100',
    owner: 'gl',
    refreshCadence: 'daily',
  },
  
  // === Working Capital ===
  'fin.wc.current-assets': {
    id: 'fin.wc.current-assets',
    label: 'Current Assets',
    description: 'Assets expected to be converted to cash within one year (cash, AR, inventory, prepaid).',
    unit: 'currency',
    precision: 0,
    formula: 'SUM(gl_balances.balance WHERE account.type = ASSET AND account.is_current = true)',
    owner: 'gl',
    refreshCadence: 'daily',
  },
  
  'fin.wc.current-liabilities': {
    id: 'fin.wc.current-liabilities',
    label: 'Current Liabilities',
    description: 'Liabilities due within one year (AP, accrued expenses, short-term debt).',
    unit: 'currency',
    precision: 0,
    formula: 'SUM(gl_balances.balance WHERE account.type = LIABILITY AND account.is_current = true)',
    owner: 'gl',
    refreshCadence: 'daily',
  },
  
  'fin.wc.net': {
    id: 'fin.wc.net',
    label: 'Net Working Capital',
    description: 'Current Assets minus Current Liabilities. Positive value indicates liquidity cushion.',
    unit: 'currency',
    precision: 0,
    formula: 'Current Assets - Current Liabilities',
    owner: 'gl',
    refreshCadence: 'daily',
    drilldown: { kind: 'report', reportId: 'balance-sheet' },
  },
  
  'fin.wc.ratio': {
    id: 'fin.wc.ratio',
    label: 'Working Capital Ratio',
    description: 'Same as Current Ratio. Current Assets / Current Liabilities.',
    unit: 'ratio',
    precision: 2,
    formula: 'Current Assets / Current Liabilities',
    owner: 'gl',
    refreshCadence: 'daily',
  },
  
  // === Budget & Variance ===
  'fin.budget.actual': {
    id: 'fin.budget.actual',
    label: 'Actual Spend',
    description: 'Actual expenses incurred in period.',
    unit: 'currency',
    precision: 0,
    formula: 'SUM(gl_lines.amount WHERE account.type = EXPENSE)',
    owner: 'cost-accounting',
    refreshCadence: 'daily',
  },
  
  'fin.budget.planned': {
    id: 'fin.budget.planned',
    label: 'Budgeted Amount',
    description: 'Planned budget allocation for period.',
    unit: 'currency',
    precision: 0,
    formula: 'SUM(budget_lines.amount)',
    owner: 'cost-accounting',
    refreshCadence: 'daily',
  },
  
  'fin.budget.variance': {
    id: 'fin.budget.variance',
    label: 'Budget Variance',
    description: 'Difference between actual and budget (Actual - Budget). Positive = over budget (unfavorable for expenses).',
    unit: 'currency',
    precision: 0,
    formula: 'Actual - Budget',
    owner: 'cost-accounting',
    refreshCadence: 'daily',
  },
  
  'fin.budget.variance-pct': {
    id: 'fin.budget.variance-pct',
    label: 'Variance %',
    description: 'Variance as percentage of budget. Formula: ((Actual - Budget) / Budget) × 100',
    unit: 'percent',
    precision: 1,
    formula: '((Actual - Budget) / Budget) × 100',
    owner: 'cost-accounting',
    refreshCadence: 'daily',
  },
  
  // === Assets ===
  'fin.assets.total-cost': {
    id: 'fin.assets.total-cost',
    label: 'Total Asset Cost',
    description: 'Original cost of all fixed assets.',
    unit: 'currency',
    precision: 0,
    formula: 'SUM(fixed_assets.original_cost)',
    owner: 'assets',
    refreshCadence: 'daily',
  },
  
  'fin.assets.accumulated-dep': {
    id: 'fin.assets.accumulated-dep',
    label: 'Accumulated Depreciation',
    description: 'Total depreciation recorded to date.',
    unit: 'currency',
    precision: 0,
    formula: 'SUM(fixed_assets.accumulated_depreciation)',
    owner: 'assets',
    refreshCadence: 'daily',
  },
  
  'fin.assets.net-book-value': {
    id: 'fin.assets.net-book-value',
    label: 'Net Book Value',
    description: 'Asset value after depreciation. Formula: Original Cost - Accumulated Depreciation.',
    unit: 'currency',
    precision: 0,
    formula: 'Original Cost - Accumulated Depreciation',
    owner: 'assets',
    refreshCadence: 'daily',
  },
  
  'fin.assets.depreciation-monthly': {
    id: 'fin.assets.depreciation-monthly',
    label: 'Monthly Depreciation',
    description: 'Total depreciation expense for current month.',
    unit: 'currency',
    precision: 0,
    formula: 'SUM(depreciation_schedules.monthly_amount WHERE period = current_month)',
    owner: 'assets',
    refreshCadence: 'daily',
  },
  
  // === Tax ===
  'fin.tax.output-tax': {
    id: 'fin.tax.output-tax',
    label: 'Output Tax',
    description: 'Tax collected on sales.',
    unit: 'currency',
    precision: 0,
    formula: 'SUM(tax_lines.amount WHERE direction = OUTPUT)',
    owner: 'tax',
    refreshCadence: 'daily',
  },
  
  'fin.tax.input-tax': {
    id: 'fin.tax.input-tax',
    label: 'Input Tax',
    description: 'Tax paid on purchases (reclaimable).',
    unit: 'currency',
    precision: 0,
    formula: 'SUM(tax_lines.amount WHERE direction = INPUT)',
    owner: 'tax',
    refreshCadence: 'daily',
  },
  
  'fin.tax.net-payable': {
    id: 'fin.tax.net-payable',
    label: 'Net Tax Payable',
    description: 'Tax owed to authorities. Formula: Output Tax - Input Tax.',
    unit: 'currency',
    precision: 0,
    formula: 'Output Tax - Input Tax',
    owner: 'tax',
    refreshCadence: 'daily',
  },
  
  'fin.tax.wht-collected': {
    id: 'fin.tax.wht-collected',
    label: 'WHT Collected',
    description: 'Withholding tax collected from vendors.',
    unit: 'currency',
    precision: 0,
    formula: 'SUM(ap_invoices.wht_amount)',
    owner: 'tax',
    refreshCadence: 'daily',
  },
  
  // === P&L ===
  'fin.pl.revenue': {
    id: 'fin.pl.revenue',
    label: 'Revenue',
    description: 'Total revenue for period.',
    unit: 'currency',
    precision: 0,
    formula: 'SUM(gl_lines.amount WHERE account.type = REVENUE)',
    owner: 'pl',
    refreshCadence: 'daily',
    drilldown: { kind: 'report', reportId: 'income-statement' },
  },
  
  'fin.pl.expenses': {
    id: 'fin.pl.expenses',
    label: 'Expenses',
    description: 'Total expenses for period.',
    unit: 'currency',
    precision: 0,
    formula: 'SUM(gl_lines.amount WHERE account.type = EXPENSE)',
    owner: 'pl',
    refreshCadence: 'daily',
    drilldown: { kind: 'report', reportId: 'income-statement' },
  },
  
  'fin.pl.net-income': {
    id: 'fin.pl.net-income',
    label: 'Net Income',
    description: 'Bottom line profit. Formula: Revenue - Expenses.',
    unit: 'currency',
    precision: 0,
    formula: 'Revenue - Expenses',
    owner: 'pl',
    refreshCadence: 'daily',
    drilldown: { kind: 'report', reportId: 'income-statement' },
  },
  
  'fin.pl.ebitda': {
    id: 'fin.pl.ebitda',
    label: 'EBITDA',
    description: 'Earnings Before Interest, Tax, Depreciation & Amortization.',
    unit: 'currency',
    precision: 0,
    formula: 'Net Income + Interest + Tax + Depreciation + Amortization',
    owner: 'pl',
    refreshCadence: 'daily',
  },
  
  'fin.pl.gross-margin-pct': {
    id: 'fin.pl.gross-margin-pct',
    label: 'Gross Margin %',
    description: 'Profitability percentage. Formula: ((Revenue - COGS) / Revenue) × 100',
    unit: 'percent',
    precision: 1,
    formula: '((Revenue - COGS) / Revenue) × 100',
    owner: 'pl',
    refreshCadence: 'daily',
  },
  
  // Cash is duplicated - use the one from treasury section
  'fin.cash.available': {
    id: 'fin.cash.available',
    label: 'Available Cash',
    description: 'Available cash (excludes restricted funds).',
    unit: 'currency',
    precision: 0,
    formula: 'SUM(bank_accounts.available_balance WHERE NOT restricted)',
    owner: 'treasury',
    refreshCadence: '5min',
  },
  
  'fin.treasury.covenants-at-risk': {
    id: 'fin.treasury.covenants-at-risk',
    label: 'Covenants at Risk',
    description: 'Number of loan covenants approaching breach threshold.',
    unit: 'count',
    precision: 0,
    formula: 'COUNT(covenants WHERE status = AT_RISK)',
    owner: 'treasury',
    refreshCadence: 'daily',
  },
};
