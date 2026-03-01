import { financeNavigationGroups } from '@/lib/constants';
import { buildFinanceFeatureMetrics } from '@/lib/finance/build-feature-metrics';
import type { DomainDashboardConfig } from './types';

// ─── Finance Overview KPI Derivation ───────────────────────────────────────────
//
// Generic formula: one headline KPI per finance sub-domain, max 8 cards.
// Pulls from sub-domain availability — no hardcoded list.
//

const FINANCE_SUB_DOMAIN_IDS = [
  'finance.ap',
  'finance.ar',
  'finance.gl',
  'finance.banking',
  'finance.assets',
  'finance.travel',
  'finance.treasury',
  'finance.controlling',
  'finance.tax',
  'finance.ic',
  'finance.ifrs',
  'finance.consolidation',
  'finance.settings',
  'finance.reports',
] as const;

/**
 * Derive default KPI IDs for finance overview from sub-domain configs.
 * One headline metric per sub-domain, capped at 8.
 */
function deriveFinanceOverviewKpiIds(
  configs: Record<string, DomainDashboardConfig>,
): string[] {
  const ids: string[] = [];
  for (const domainId of FINANCE_SUB_DOMAIN_IDS) {
    const cfg = configs[domainId];
    if (!cfg?.defaultKpiIds?.length) continue;
    const firstKpiId = cfg.defaultKpiIds[0];
    if (firstKpiId) ids.push(firstKpiId);
    if (ids.length >= 8) break;
  }
  return ids;
}

/**
 * All KPI IDs available for finance overview (union of sub-domain KPIs).
 */
function getFinanceOverviewAvailableKpiIds(
  configs: Record<string, DomainDashboardConfig>,
): string[] {
  const seen = new Set<string>();
  const ids: string[] = [];
  for (const domainId of FINANCE_SUB_DOMAIN_IDS) {
    const cfg = configs[domainId];
    if (!cfg?.defaultKpiIds) continue;
    for (const id of cfg.defaultKpiIds) {
      if (!seen.has(id)) {
        seen.add(id);
        ids.push(id);
      }
    }
  }
  return ids;
}

// ─── Domain Dashboard Configs ───────────────────────────────────────────────
// Static configs for each finance sub-domain dashboard.
// These define what KPIs and features a domain offers (defaults).
// User-level customization is handled via DashboardPrefs at runtime.

/** Accounts Payable domain dashboard. */
export const FINANCE_AP_CONFIG: DomainDashboardConfig = {
  domainId: 'finance.ap',
  title: 'Accounts Payable',
  description: 'AP Invoices, Payment Runs, Suppliers',
  defaultKpiIds: ['fin.ap.total', 'fin.ap.aging', 'fin.ap.overdue', 'fin.ap.pending', 'fin.ap.discount'],
  chartSlotIds: ['chart.revenueExpense'],
  diagramSlotIds: ['diagram.apAging', 'diagram.arAging'],
  navGroups: financeNavigationGroups.filter(
    (g) => g.title.includes('Accounts Payable'),
  ),
};

/** Accounts Receivable domain dashboard. */
export const FINANCE_AR_CONFIG: DomainDashboardConfig = {
  domainId: 'finance.ar',
  title: 'Accounts Receivable',
  description: 'Customer Invoices, Collections, Credit Control',
  defaultKpiIds: ['fin.ar.total', 'fin.ar.aging', 'fin.ar.overdue', 'fin.ar.dso'],
  chartSlotIds: ['chart.revenueExpense'],
  diagramSlotIds: ['diagram.arAging'],
  navGroups: financeNavigationGroups.filter(
    (g) => g.title.includes('Accounts Receivable'),
  ),
};

/** General Ledger domain dashboard. */
export const FINANCE_GL_CONFIG: DomainDashboardConfig = {
  domainId: 'finance.gl',
  title: 'General Ledger',
  description: 'Chart of Accounts, Journals, Fiscal Periods',
  defaultKpiIds: ['fin.gl.journals', 'fin.gl.unposted', 'fin.gl.trialBalance'],
  navGroups: financeNavigationGroups.filter(
    (g) => g.title.includes('General Ledger'),
  ),
};

/** Banking & Liquidity domain dashboard. */
export const FINANCE_BANKING_CONFIG: DomainDashboardConfig = {
  domainId: 'finance.banking',
  title: 'Banking & Liquidity',
  description: 'Bank Statements, Reconciliation, Matching Rules',
  defaultKpiIds: ['fin.bank.balance', 'fin.bank.unreconciled'],
  navGroups: financeNavigationGroups.filter(
    (g) => g.title.includes('Banking'),
  ),
};

/** Asset Accounting domain dashboard. */
export const FINANCE_ASSETS_CONFIG: DomainDashboardConfig = {
  domainId: 'finance.assets',
  title: 'Asset Accounting',
  description: 'Fixed Assets, Depreciation, Intangibles',
  defaultKpiIds: ['fin.aa.totalAssets', 'fin.aa.depreciation', 'fin.aa.disposals'],
  navGroups: financeNavigationGroups.filter(
    (g) => g.title.includes('Asset Accounting'),
  ),
};

/** Travel & Expenses domain dashboard. */
export const FINANCE_TRAVEL_CONFIG: DomainDashboardConfig = {
  domainId: 'finance.travel',
  title: 'Travel & Expenses',
  description: 'Expense Claims, Policies, Reimbursement',
  defaultKpiIds: ['fin.tv.openClaims', 'fin.tv.pendingApproval', 'fin.tv.totalExpenses'],
  navGroups: financeNavigationGroups.filter(
    (g) => g.title.includes('Travel & Expenses'),
  ),
};

/** Treasury domain dashboard. */
export const FINANCE_TREASURY_CONFIG: DomainDashboardConfig = {
  domainId: 'finance.treasury',
  title: 'Treasury',
  description: 'Cash Forecasts, FX Rates, Loans',
  defaultKpiIds: ['fin.tr.cashForecast', 'fin.tr.activeLoans', 'fin.tr.covenantBreaches'],
  navGroups: financeNavigationGroups.filter(
    (g) => g.title.includes('Treasury'),
  ),
};

/** Controlling domain dashboard. */
export const FINANCE_CONTROLLING_CONFIG: DomainDashboardConfig = {
  domainId: 'finance.controlling',
  title: 'Controlling',
  description: 'Cost Centers, Projects, Allocations',
  defaultKpiIds: ['fin.co.costCenters', 'fin.co.projects', 'fin.co.allocations', 'fin.co.variance'],
  navGroups: financeNavigationGroups.filter(
    (g) => g.title.includes('Controlling'),
  ),
};

/** Tax & Compliance domain dashboard. */
export const FINANCE_TAX_CONFIG: DomainDashboardConfig = {
  domainId: 'finance.tax',
  title: 'Tax & Compliance',
  description: 'Tax Codes, Returns, WHT Certificates',
  defaultKpiIds: ['fin.tx.activeCodes', 'fin.tx.pendingReturns', 'fin.tx.whtCerts'],
  navGroups: financeNavigationGroups.filter(
    (g) => g.title.includes('Tax & Compliance'),
  ),
};

/** Intercompany domain dashboard. */
export const FINANCE_IC_CONFIG: DomainDashboardConfig = {
  domainId: 'finance.ic',
  title: 'Intercompany',
  description: 'IC Transactions, Transfer Pricing',
  defaultKpiIds: ['fin.ic.openTx', 'fin.ic.aging', 'fin.ic.tpPolicies'],
  navGroups: financeNavigationGroups.filter(
    (g) => g.title.includes('Intercompany'),
  ),
};

/** IFRS & Standards domain dashboard. */
export const FINANCE_IFRS_CONFIG: DomainDashboardConfig = {
  domainId: 'finance.ifrs',
  title: 'IFRS & Standards',
  description: 'Leases, Provisions, Instruments, Hedging',
  defaultKpiIds: ['fin.ifrs.activeLeases', 'fin.ifrs.provisions', 'fin.ifrs.instruments', 'fin.ifrs.hedges'],
  navGroups: financeNavigationGroups.filter(
    (g) => g.title.includes('IFRS'),
  ),
};

/** Consolidation domain dashboard. */
export const FINANCE_CONSOLIDATION_CONFIG: DomainDashboardConfig = {
  domainId: 'finance.consolidation',
  title: 'Consolidation',
  description: 'Group Entities, Eliminations, Goodwill',
  defaultKpiIds: ['fin.lc.entities', 'fin.lc.eliminations', 'fin.lc.goodwill'],
  navGroups: financeNavigationGroups.filter(
    (g) => g.title.includes('Consolidation'),
  ),
};

/** Finance Settings domain dashboard. */
export const FINANCE_SETTINGS_CONFIG: DomainDashboardConfig = {
  domainId: 'finance.settings',
  title: 'Finance Settings',
  description: 'Payment Terms, Match Tolerances, Settings',
  defaultKpiIds: ['fin.cfg.paymentTerms', 'fin.cfg.matchRules'],
  navGroups: financeNavigationGroups.filter(
    (g) => g.title.includes('Finance Settings'),
  ),
};

/** Financial Reports domain dashboard. */
export const FINANCE_REPORTS_CONFIG: DomainDashboardConfig = {
  domainId: 'finance.reports',
  title: 'Financial Reports',
  description: 'Balance Sheet, Income Statement, Cash Flow',
  defaultKpiIds: ['fin.rp.balanceSheet', 'fin.rp.incomeStmt', 'fin.rp.cashFlow'],
  navGroups: financeNavigationGroups.filter(
    (g) => g.title.includes('Financial Reports'),
  ),
};

// ─── Config Registry ────────────────────────────────────────────────────────

const DOMAIN_DASHBOARD_CONFIGS: Record<string, DomainDashboardConfig> = {
  'finance.ap': FINANCE_AP_CONFIG,
  'finance.ar': FINANCE_AR_CONFIG,
  'finance.gl': FINANCE_GL_CONFIG,
  'finance.banking': FINANCE_BANKING_CONFIG,
  'finance.assets': FINANCE_ASSETS_CONFIG,
  'finance.travel': FINANCE_TRAVEL_CONFIG,
  'finance.treasury': FINANCE_TREASURY_CONFIG,
  'finance.controlling': FINANCE_CONTROLLING_CONFIG,
  'finance.tax': FINANCE_TAX_CONFIG,
  'finance.ic': FINANCE_IC_CONFIG,
  'finance.ifrs': FINANCE_IFRS_CONFIG,
  'finance.consolidation': FINANCE_CONSOLIDATION_CONFIG,
  'finance.settings': FINANCE_SETTINGS_CONFIG,
  'finance.reports': FINANCE_REPORTS_CONFIG,
};

/**
 * Finance Overview — module-level landing page dashboard.
 * KPIs derived from sub-domain availability (one per domain, max 8).
 */
export const FINANCE_OVERVIEW_CONFIG: DomainDashboardConfig = {
  domainId: 'finance.overview',
  title: 'Finance Dashboard',
  description:
    'Real-time financial overview, KPIs, and key performance indicators for your organization',
  defaultKpiIds: deriveFinanceOverviewKpiIds(DOMAIN_DASHBOARD_CONFIGS),
  defaultKpiIdsByRole: {
    owner: ['fin.cash', 'fin.ap', 'fin.ar', 'fin.pnl', 'fin.bank.balance', 'fin.gl.journals'],
    admin: ['fin.cash', 'fin.ap', 'fin.ar', 'fin.pnl', 'fin.bank.balance', 'fin.gl.journals'],
  },
  availableKpiIds: getFinanceOverviewAvailableKpiIds(DOMAIN_DASHBOARD_CONFIGS),
  maxWidgets: 8,
  chartSlotIds: [
    'chart.cashflow',
    'chart.revenueExpense',
    'chart.liquidity-waterfall',
    'chart.financial-ratios',
    'chart.dso-trend',
    'chart.budget-variance',
    'chart.asset-portfolio',
  ],
  diagramSlotIds: ['diagram.arAging', 'diagram.apAging'],
  navGroups: financeNavigationGroups,
  buildFeatureMetrics: buildFinanceFeatureMetrics,
  savedViewPresets: [
    {
      id: 'overview',
      label: 'Overview',
      description: 'All key metrics across finance',
      widgetIds: deriveFinanceOverviewKpiIds(DOMAIN_DASHBOARD_CONFIGS),
      chartId: 'chart.liquidity-waterfall',
      diagramId: 'diagram.arAging',
    },
    {
      id: 'cash-focus',
      label: 'Cash focus',
      description: 'Liquidity and cash flow metrics',
      widgetIds: ['fin.cash', 'fin.bank.balance', 'fin.tr.cashForecast', 'fin.tr.activeLoans', 'fin.ap.total', 'fin.ar.total'],
      chartId: 'chart.liquidity-waterfall',
      diagramId: 'diagram.arAging',
    },
    {
      id: 'executive',
      label: 'Executive',
      description: 'High-level P&L and balance',
      widgetIds: ['fin.cash', 'fin.ap', 'fin.ar', 'fin.pnl', 'fin.bank.balance', 'fin.gl.journals'],
      chartId: 'chart.financial-ratios',
      diagramId: 'diagram.arAging',
    },
    {
      id: 'performance',
      label: 'Performance',
      description: 'Budget variance and KPIs',
      widgetIds: ['fin.cash', 'fin.ar.dso', 'fin.pnl', 'fin.co.variance'],
      chartId: 'chart.budget-variance',
      diagramId: 'diagram.apAging',
    },
  ],
};

DOMAIN_DASHBOARD_CONFIGS['finance.overview'] = FINANCE_OVERVIEW_CONFIG;

/**
 * Look up a domain dashboard config by ID.
 * Returns undefined if the domain has no dashboard config.
 */
export function getDomainDashboardConfig(
  domainId: string,
): DomainDashboardConfig | undefined {
  return DOMAIN_DASHBOARD_CONFIGS[domainId];
}
