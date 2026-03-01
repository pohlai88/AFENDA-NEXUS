import type { MetricId } from './metric-id';

/**
 * Data lineage - provenance tracking for audit trail
 * Shows which tables, filters, and joins contribute to each metric
 */
export interface MetricLineage {
  tables: string[];
  filters: string[];
  joins: string[];
}

/**
 * Get data lineage for a metric
 * Used for audit trail and data governance
 */
export function getMetricLineage(metricId: MetricId): MetricLineage {
  const lineageMap: Record<MetricId, MetricLineage> = {
    // Cash & Treasury
    'fin.cash.position': {
      tables: ['bank_accounts'],
      filters: ['status = ACTIVE'],
      joins: [],
    },
    'fin.cash.forecast-eom': {
      tables: ['cash_forecasts', 'bank_accounts'],
      filters: ['forecast_date <= end_of_month'],
      joins: ['cash_forecasts.bank_account_id = bank_accounts.id'],
    },
    'fin.cash.available': {
      tables: ['bank_accounts'],
      filters: ['status = ACTIVE', 'restricted = false'],
      joins: [],
    },
    'fin.treasury.loan-balance': {
      tables: ['intercompany_loans'],
      filters: ['status = ACTIVE'],
      joins: [],
    },
    'fin.treasury.covenants-at-risk': {
      tables: ['covenants', 'covenant_tests'],
      filters: ['status = AT_RISK'],
      joins: ['covenant_tests.covenant_id = covenants.id'],
    },
    
    // Accounts Receivable
    'fin.ar.total': {
      tables: ['ar_invoices'],
      filters: ['status IN (APPROVED, POSTED)', 'balance_due > 0'],
      joins: [],
    },
    'fin.ar.current': {
      tables: ['ar_invoices'],
      filters: ['status IN (APPROVED, POSTED)', 'aging_days <= 30'],
      joins: [],
    },
    'fin.ar.overdue': {
      tables: ['ar_invoices'],
      filters: ['status IN (APPROVED, POSTED)', 'aging_days > 30'],
      joins: [],
    },
    'fin.ar.dso': {
      tables: ['ar_invoices', 'gl_balances', 'accounts'],
      filters: ['accounts.type = REVENUE', 'period = current_period'],
      joins: ['gl_balances.account_id = accounts.id'],
    },
    'fin.ar.collection-rate': {
      tables: ['ar_invoices', 'ar_payment_allocations'],
      filters: ['payment_date BETWEEN period_start AND period_end'],
      joins: ['ar_payment_allocations.invoice_id = ar_invoices.id'],
    },
    
    // Accounts Payable
    'fin.ap.total': {
      tables: ['ap_invoices'],
      filters: ['status IN (APPROVED, POSTED)', 'balance_due > 0'],
      joins: [],
    },
    'fin.ap.current': {
      tables: ['ap_invoices'],
      filters: ['status IN (APPROVED, POSTED)', 'aging_days <= 30'],
      joins: [],
    },
    'fin.ap.overdue': {
      tables: ['ap_invoices'],
      filters: ['status IN (APPROVED, POSTED)', 'aging_days > 30'],
      joins: [],
    },
    'fin.ap.dpo': {
      tables: ['ap_invoices', 'gl_balances', 'accounts'],
      filters: ['accounts.type = EXPENSE', 'accounts.category = COGS'],
      joins: ['gl_balances.account_id = accounts.id'],
    },
    
    // Financial Ratios
    'fin.ratio.current': {
      tables: ['gl_balances', 'accounts'],
      filters: [
        '(accounts.type = ASSET AND accounts.is_current = true)',
        'OR (accounts.type = LIABILITY AND accounts.is_current = true)',
      ],
      joins: ['gl_balances.account_id = accounts.id'],
    },
    'fin.ratio.quick': {
      tables: ['gl_balances', 'accounts'],
      filters: [
        '(accounts.type = ASSET AND accounts.is_current = true AND accounts.name != Inventory)',
        'OR (accounts.type = LIABILITY AND accounts.is_current = true)',
      ],
      joins: ['gl_balances.account_id = accounts.id'],
    },
    'fin.ratio.debt-equity': {
      tables: ['gl_balances', 'accounts'],
      filters: [
        '(accounts.type = LIABILITY)',
        'OR (accounts.type = EQUITY)',
      ],
      joins: ['gl_balances.account_id = accounts.id'],
    },
    'fin.ratio.roa': {
      tables: ['gl_balances', 'accounts'],
      filters: ['accounts.type IN (ASSET, REVENUE, EXPENSE)'],
      joins: ['gl_balances.account_id = accounts.id'],
    },
    'fin.ratio.roe': {
      tables: ['gl_balances', 'accounts'],
      filters: ['accounts.type IN (EQUITY, REVENUE, EXPENSE)'],
      joins: ['gl_balances.account_id = accounts.id'],
    },
    
    // Working Capital
    'fin.wc.current-assets': {
      tables: ['gl_balances', 'accounts'],
      filters: ['accounts.type = ASSET', 'accounts.is_current = true'],
      joins: ['gl_balances.account_id = accounts.id'],
    },
    'fin.wc.current-liabilities': {
      tables: ['gl_balances', 'accounts'],
      filters: ['accounts.type = LIABILITY', 'accounts.is_current = true'],
      joins: ['gl_balances.account_id = accounts.id'],
    },
    'fin.wc.net': {
      tables: ['gl_balances', 'accounts'],
      filters: ['accounts.is_current = true'],
      joins: ['gl_balances.account_id = accounts.id'],
    },
    'fin.wc.ratio': {
      tables: ['gl_balances', 'accounts'],
      filters: ['accounts.is_current = true'],
      joins: ['gl_balances.account_id = accounts.id'],
    },
    
    // Budget & Variance
    'fin.budget.actual': {
      tables: ['gl_balances', 'accounts'],
      filters: ['accounts.type = EXPENSE', 'period = current_period'],
      joins: ['gl_balances.account_id = accounts.id'],
    },
    'fin.budget.planned': {
      tables: ['budget_lines', 'cost_centers'],
      filters: ['period = current_period'],
      joins: ['budget_lines.cost_center_id = cost_centers.id'],
    },
    'fin.budget.variance': {
      tables: ['gl_balances', 'budget_lines', 'accounts', 'cost_centers'],
      filters: ['period = current_period'],
      joins: [
        'gl_balances.account_id = accounts.id',
        'budget_lines.cost_center_id = cost_centers.id',
      ],
    },
    'fin.budget.variance-pct': {
      tables: ['gl_balances', 'budget_lines', 'accounts', 'cost_centers'],
      filters: ['period = current_period'],
      joins: [
        'gl_balances.account_id = accounts.id',
        'budget_lines.cost_center_id = cost_centers.id',
      ],
    },
    
    // Assets
    'fin.assets.total-cost': {
      tables: ['fixed_assets'],
      filters: ['status != DISPOSED'],
      joins: [],
    },
    'fin.assets.accumulated-dep': {
      tables: ['fixed_assets'],
      filters: ['status != DISPOSED'],
      joins: [],
    },
    'fin.assets.net-book-value': {
      tables: ['fixed_assets'],
      filters: ['status != DISPOSED'],
      joins: [],
    },
    'fin.assets.depreciation-monthly': {
      tables: ['depreciation_schedules', 'fixed_assets'],
      filters: ['period = current_month', 'fixed_assets.status = ACTIVE'],
      joins: ['depreciation_schedules.asset_id = fixed_assets.id'],
    },
    
    // Tax
    'fin.tax.output-tax': {
      tables: ['ar_invoices', 'ar_invoice_lines'],
      filters: ['tax_amount > 0', 'status = POSTED'],
      joins: ['ar_invoice_lines.invoice_id = ar_invoices.id'],
    },
    'fin.tax.input-tax': {
      tables: ['ap_invoices', 'ap_invoice_lines'],
      filters: ['tax_amount > 0', 'status = POSTED'],
      joins: ['ap_invoice_lines.invoice_id = ap_invoices.id'],
    },
    'fin.tax.net-payable': {
      tables: ['ar_invoices', 'ar_invoice_lines', 'ap_invoices', 'ap_invoice_lines'],
      filters: ['tax_amount > 0', 'status = POSTED'],
      joins: [
        'ar_invoice_lines.invoice_id = ar_invoices.id',
        'ap_invoice_lines.invoice_id = ap_invoices.id',
      ],
    },
    'fin.tax.wht-collected': {
      tables: ['ap_invoices'],
      filters: ['wht_amount > 0', 'status IN (POSTED, PAID)'],
      joins: [],
    },
    
    // P&L
    'fin.pl.revenue': {
      tables: ['gl_balances', 'accounts'],
      filters: ['accounts.type = REVENUE', 'period = current_period'],
      joins: ['gl_balances.account_id = accounts.id'],
    },
    'fin.pl.expenses': {
      tables: ['gl_balances', 'accounts'],
      filters: ['accounts.type = EXPENSE', 'period = current_period'],
      joins: ['gl_balances.account_id = accounts.id'],
    },
    'fin.pl.net-income': {
      tables: ['gl_balances', 'accounts'],
      filters: ['accounts.type IN (REVENUE, EXPENSE)', 'period = current_period'],
      joins: ['gl_balances.account_id = accounts.id'],
    },
    'fin.pl.ebitda': {
      tables: ['gl_balances', 'accounts', 'fixed_assets', 'depreciation_schedules'],
      filters: ['period = current_period'],
      joins: [
        'gl_balances.account_id = accounts.id',
        'depreciation_schedules.asset_id = fixed_assets.id',
      ],
    },
    'fin.pl.gross-margin-pct': {
      tables: ['gl_balances', 'accounts'],
      filters: [
        '(accounts.type = REVENUE OR (accounts.type = EXPENSE AND category = COGS))',
        'period = current_period',
      ],
      joins: ['gl_balances.account_id = accounts.id'],
    },
  };

  return lineageMap[metricId] || {
    tables: [],
    filters: [],
    joins: [],
  };
}
