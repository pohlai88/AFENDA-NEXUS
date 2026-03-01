/**
 * Metric IDs - Canonical list of all financial metrics
 * Format: domain.subdomain.metric-name
 */
export type MetricId =
  // Cash & Treasury
  | 'fin.cash.position'
  | 'fin.cash.forecast-eom'
  | 'fin.cash.available'
  | 'fin.treasury.loan-balance'
  | 'fin.treasury.covenants-at-risk'
  
  // Accounts Receivable
  | 'fin.ar.total'
  | 'fin.ar.current'
  | 'fin.ar.overdue'
  | 'fin.ar.dso'
  | 'fin.ar.collection-rate'
  
  // Accounts Payable
  | 'fin.ap.total'
  | 'fin.ap.current'
  | 'fin.ap.overdue'
  | 'fin.ap.dpo'
  
  // Financial Ratios
  | 'fin.ratio.current'
  | 'fin.ratio.quick'
  | 'fin.ratio.debt-equity'
  | 'fin.ratio.roa'
  | 'fin.ratio.roe'
  
  // Working Capital
  | 'fin.wc.current-assets'
  | 'fin.wc.current-liabilities'
  | 'fin.wc.net'
  | 'fin.wc.ratio'
  
  // Budget & Variance
  | 'fin.budget.actual'
  | 'fin.budget.planned'
  | 'fin.budget.variance'
  | 'fin.budget.variance-pct'
  
  // Assets
  | 'fin.assets.total-cost'
  | 'fin.assets.accumulated-dep'
  | 'fin.assets.net-book-value'
  | 'fin.assets.depreciation-monthly'
  
  // Tax
  | 'fin.tax.output-tax'
  | 'fin.tax.input-tax'
  | 'fin.tax.net-payable'
  | 'fin.tax.wht-collected'
  
  // P&L
  | 'fin.pl.revenue'
  | 'fin.pl.expenses'
  | 'fin.pl.net-income'
  | 'fin.pl.ebitda'
  | 'fin.pl.gross-margin-pct';
