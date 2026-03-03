import { routes } from '@/lib/constants';

// ─── KPI Templates ──────────────────────────────────────────────────────────

export type KPITemplate =
  | 'value-trend'
  | 'value-sparkline'
  | 'ratio'
  | 'aging'
  | 'count-status'
  | 'bullet'
  | 'dial'
  | 'speedometer'
  | 'pending'
  | 'stub';

/** Semantic group for dashboard grouping (Cash, Receivables, Payables, Operations). */
export type KPIGroup = 'cash' | 'receivables' | 'payables' | 'operations';

/** Module that owns this KPI (for domain config derivation). */
export type KPIModule =
  | 'finance'
  | 'ap'
  | 'ar'
  | 'gl'
  | 'banking'
  | 'assets'
  | 'travel'
  | 'treasury'
  | 'controlling'
  | 'tax'
  | 'ic'
  | 'ifrs'
  | 'consolidation'
  | 'settings'
  | 'reports'
  | 'admin'
  | 'home';

/** Category for organization (business_overview, cashflow, compliance, etc.). */
export type KPICategory =
  | 'business_overview'
  | 'cashflow'
  | 'compliance'
  | 'aging'
  | 'approval'
  | 'operations';

/** Tag for filtering and attention wiring. */
export type KPITag = 'attention' | 'cash-flow' | 'compliance' | 'aging' | 'approval';

// ─── KPI Catalog Entry ──────────────────────────────────────────────────────
// Template lives here (UI decision), NOT in resolver output.

/** Quick action shown on KPI card (e.g. "Record Bill", "New Invoice"). */
export interface KpiQuickAction {
  label: string;
  href: string;
}

/** Drill-through target (Zoho-style multiple linked reports). */
export interface KpiDrillTarget {
  label: string;
  href: string;
}

/** Threshold for conditional display (Zoho bullet/dial). */
export interface KPIThreshold {
  value: number;
  color: 'success' | 'warning' | 'destructive';
  label?: string;
}

export interface KPICatalogEntry {
  id: string;
  title: string;
  /** Plain-language alternative (e.g. "Money owed" for "Total Payables"). */
  plainTitle?: string;
  /** Tooltip description (≤250 chars). Zoho-inspired. */
  description?: string;
  template: KPITemplate;
  format: 'money' | 'count' | 'percent' | 'text';
  href?: string;
  /** Multiple drill-through targets (Zoho: up to 20 per widget). */
  drillTargets?: KpiDrillTarget[];
  /** Target value for progress display (bullet/dial). */
  targetValue?: number;
  /** Min/max for dial/speedometer (e.g. 0–100). */
  minValue?: number;
  maxValue?: number;
  /** Qualitative thresholds for conditional display. */
  thresholds?: KPIThreshold[];
  /** Threshold-based alert config (e.g. notify when value exceeds). */
  alertConfig?: {
    threshold: number;
    operator: 'gt' | 'gte' | 'lt' | 'lte';
    notifyChannels?: string[];
  };
  /** Semantic group for dashboard section labels. */
  group?: KPIGroup;
  /** Module that owns this KPI. */
  module?: KPIModule;
  /** Category for organization. */
  category?: KPICategory;
  /** Quick action(s). Prefer quickActions for multiple. */
  quickAction?: KpiQuickAction;
  /** Multiple quick actions (Zoho actionable tiles). */
  quickActions?: KpiQuickAction[];
  /** Display priority (lower = higher). For configure dialog ordering. */
  displayPriority?: number;
  /** Can be shown as hero (2×1) when first in layout. */
  heroEligible?: boolean;
  /** Tags for filtering, attention wiring. */
  tags?: KPITag[];
  /** Search keywords for discoverability (Zia-style). */
  searchKeywords?: string[];
  /** Empty state when no data (Stripe-style guided onboarding). */
  emptyState?: {
    /** Resolves copy from EmptyState registry instead of inline strings. */
    registryKey?: import('@/components/erp/empty-state.types').EmptyStateKey;
    title: string;
    description: string;
    ctaLabel: string;
    ctaHref: string;
  };
}

// ─── Module KPI Catalogs ────────────────────────────────────────────────────

const FINANCE_CATALOG: KPICatalogEntry[] = [
  {
    id: 'fin.cash',
    title: 'Cash Position',
    description: 'Total cash and bank balances across all accounts',
    template: 'value-trend',
    format: 'money',
    href: routes.finance.banking,
    group: 'cash',
    module: 'finance',
    category: 'cashflow',
    quickActions: [{ label: 'Reconcile', href: routes.finance.bankReconciliation }],
    drillTargets: [
      { label: 'Banking', href: routes.finance.banking },
      { label: 'Reconcile', href: routes.finance.bankReconciliation },
      { label: 'Cash Flow', href: routes.finance.cashFlow },
    ],
    displayPriority: 10,
    heroEligible: true,
    tags: ['cash-flow'],
    searchKeywords: ['cash', 'liquidity', 'bank', 'balance'],
    emptyState: {
      registryKey: 'kpi.cashPosition',
      title: 'No cash data',
      description: 'Bank balances will appear once accounts are connected.',
      ctaLabel: 'Connect Bank',
      ctaHref: routes.finance.banking,
    },
  },
  {
    id: 'fin.ap',
    title: 'Accounts Payable',
    description: 'Total outstanding vendor invoices and bills',
    template: 'value-trend',
    format: 'money',
    href: routes.finance.payables,
    group: 'payables',
    module: 'ap',
    category: 'business_overview',
    quickActions: [{ label: 'Record Bill', href: routes.finance.payableNew }],
    drillTargets: [
      { label: 'Payables', href: routes.finance.payables },
      { label: 'AP Aging', href: routes.finance.apAging },
      { label: 'Payment Runs', href: routes.finance.paymentRuns },
    ],
    displayPriority: 20,
    heroEligible: true,
    tags: ['attention', 'aging'],
    searchKeywords: ['payables', 'bills', 'vendors', 'money owed'],
    emptyState: {
      registryKey: 'kpi.accountsPayable',
      title: 'No payable invoices found',
      description: 'Outstanding bills will appear once vendor invoices are recorded.',
      ctaLabel: 'Record Bill',
      ctaHref: routes.finance.payableNew,
    },
  },
  {
    id: 'fin.ar',
    title: 'Accounts Receivable',
    description: 'Total outstanding customer invoices',
    template: 'value-trend',
    format: 'money',
    href: routes.finance.receivables,
    group: 'receivables',
    module: 'ar',
    category: 'business_overview',
    quickActions: [{ label: 'New Invoice', href: routes.finance.receivableNew }],
    drillTargets: [
      { label: 'Receivables', href: routes.finance.receivables },
      { label: 'AR Aging', href: routes.finance.arAging },
    ],
    displayPriority: 30,
    heroEligible: true,
    tags: ['cash-flow', 'aging'],
    searchKeywords: ['receivables', 'invoices', 'customers', 'money to receive'],
    emptyState: {
      registryKey: 'kpi.accountsReceivable',
      title: 'No receivable invoices found',
      description: 'Outstanding invoices will appear once customer invoices are created.',
      ctaLabel: 'New Invoice',
      ctaHref: routes.finance.receivableNew,
    },
  },
  {
    id: 'fin.pnl',
    title: 'Net Income (MTD)',
    description: 'Net profit or loss for the current month',
    template: 'value-trend',
    format: 'money',
    href: routes.finance.incomeStatement,
    group: 'operations',
    module: 'finance',
    category: 'business_overview',
    displayPriority: 40,
    searchKeywords: ['profit', 'income', 'pnl', 'earnings'],
    emptyState: {
      registryKey: 'kpi.netIncome',
      title: 'No income data',
      description: 'Net income will appear once transactions are posted.',
      ctaLabel: 'View Journals',
      ctaHref: routes.finance.journals,
    },
  },
];

const FINANCE_AP_CATALOG: KPICatalogEntry[] = [
  {
    id: 'fin.ap.total',
    title: 'Total Payables',
    description: 'Total outstanding vendor invoices and bills',
    template: 'bullet',
    format: 'money',
    href: routes.finance.payables,
    group: 'payables',
    module: 'ap',
    category: 'business_overview',
    quickActions: [
      { label: 'Record Bill', href: routes.finance.payableNew },
      { label: 'Import', href: routes.finance.batchImport },
    ],
    drillTargets: [
      { label: 'Payables', href: routes.finance.payables },
      { label: 'AP Aging', href: routes.finance.apAging },
      { label: 'Payment Runs', href: routes.finance.paymentRuns },
    ],
    targetValue: 300000,
    thresholds: [
      { value: 90, color: 'success', label: 'On track' },
      { value: 100, color: 'warning', label: 'At target' },
      { value: 110, color: 'destructive', label: 'Over target' },
    ],
    alertConfig: {
      threshold: 350000,
      operator: 'gte',
      notifyChannels: ['email'],
    },
    displayPriority: 10,
    heroEligible: true,
    tags: ['attention', 'aging'],
    searchKeywords: ['payables', 'bills', 'vendors'],
    emptyState: {
      registryKey: 'finance.payables',
      title: 'No bills yet',
      description: 'Record your first vendor bill to start tracking payables.',
      ctaLabel: 'Record Bill',
      ctaHref: routes.finance.payableNew,
    },
  },
  {
    id: 'fin.ap.aging',
    title: 'AP Aging',
    description: 'Payables breakdown by aging bucket (Current, 1-30, 31-60, 61-90, 90+)',
    template: 'aging',
    format: 'money',
    href: routes.finance.apAging,
    module: 'ap',
    category: 'aging',
    tags: ['aging'],
    emptyState: {
      registryKey: 'kpi.apAging',
      title: 'No aging data',
      description: 'AP aging will appear once vendor invoices are recorded.',
      ctaLabel: 'View AP Aging',
      ctaHref: routes.finance.apAging,
    },
  },
  {
    id: 'fin.ap.overdue',
    title: 'Overdue Invoices',
    description: 'Count of vendor invoices past due date',
    template: 'count-status',
    format: 'count',
    href: routes.finance.payables,
    module: 'ap',
    tags: ['attention', 'aging'],
    emptyState: {
      registryKey: 'kpi.apOverdue',
      title: 'No overdue invoices',
      description: 'Overdue bills will appear here when past due date.',
      ctaLabel: 'View Payables',
      ctaHref: routes.finance.payables,
    },
  },
  {
    id: 'fin.ap.pending',
    title: 'Pending Approval',
    description: 'Bills awaiting approval workflow',
    template: 'count-status',
    format: 'count',
    href: routes.finance.approvals,
    module: 'ap',
    tags: ['approval'],
    emptyState: {
      registryKey: 'kpi.apPending',
      title: 'No pending approvals',
      description: 'Bills awaiting approval will appear here.',
      ctaLabel: 'View Approvals',
      ctaHref: routes.finance.approvals,
    },
  },
  {
    id: 'fin.ap.discount',
    title: 'Discount Savings (30d)',
    description: 'Early payment discounts captured in the last 30 days',
    template: 'value-trend',
    format: 'money',
    href: routes.finance.paymentRuns,
    module: 'ap',
    category: 'cashflow',
    emptyState: {
      registryKey: 'kpi.apDiscount',
      title: 'No discount data',
      description: 'Early payment discounts will be tracked once captured.',
      ctaLabel: 'View Payment Runs',
      ctaHref: routes.finance.paymentRuns,
    },
  },
];

const FINANCE_AR_CATALOG: KPICatalogEntry[] = [
  {
    id: 'fin.ar.total',
    title: 'Total Receivables',
    description: 'Total outstanding customer invoices',
    template: 'value-trend',
    format: 'money',
    href: routes.finance.receivables,
    group: 'receivables',
    module: 'ar',
    category: 'business_overview',
    quickActions: [{ label: 'New Invoice', href: routes.finance.receivableNew }],
    displayPriority: 10,
    heroEligible: true,
    tags: ['cash-flow', 'aging'],
    searchKeywords: ['receivables', 'invoices', 'customers'],
    emptyState: {
      registryKey: 'kpi.totalReceivables',
      title: 'No receivables',
      description: 'Customer invoices will appear once created.',
      ctaLabel: 'New Invoice',
      ctaHref: routes.finance.receivableNew,
    },
  },
  {
    id: 'fin.ar.aging',
    title: 'AR Aging',
    description: 'Receivables breakdown by aging bucket',
    template: 'aging',
    format: 'money',
    href: routes.finance.arAging,
    module: 'ar',
    category: 'aging',
    tags: ['aging'],
    emptyState: {
      registryKey: 'kpi.arAging',
      title: 'No aging data',
      description: 'AR aging will appear once customer invoices are created.',
      ctaLabel: 'View AR Aging',
      ctaHref: routes.finance.arAging,
    },
  },
  {
    id: 'fin.ar.overdue',
    title: 'Overdue Invoices',
    description: 'Count of customer invoices past due date',
    template: 'count-status',
    format: 'count',
    href: routes.finance.receivables,
    module: 'ar',
    tags: ['attention', 'aging'],
    emptyState: {
      registryKey: 'kpi.arOverdue',
      title: 'No overdue invoices',
      description: 'Overdue invoices will appear here when past due date.',
      ctaLabel: 'View Receivables',
      ctaHref: routes.finance.receivables,
    },
  },
  {
    id: 'fin.ar.dso',
    title: 'Days Sales Outstanding',
    description: 'Average days to collect payment from customers',
    template: 'value-trend',
    format: 'count',
    module: 'ar',
    category: 'cashflow',
    searchKeywords: ['dso', 'collection', 'days'],
    emptyState: {
      registryKey: 'kpi.dso',
      title: 'No DSO data',
      description: 'Days Sales Outstanding will calculate once invoices are paid.',
      ctaLabel: 'View Receivables',
      ctaHref: routes.finance.receivables,
    },
  },
];

const FINANCE_GL_CATALOG: KPICatalogEntry[] = [
  {
    id: 'fin.gl.journals',
    title: 'Journals (MTD)',
    description: 'Journal entries posted this month',
    template: 'count-status',
    format: 'count',
    href: routes.finance.journals,
    module: 'gl',
    emptyState: {
      registryKey: 'kpi.journalsMtd',
      title: 'No journals yet',
      description: 'Journal entries will appear here once posted.',
      ctaLabel: 'Create Journal',
      ctaHref: routes.finance.journalNew,
    },
  },
  {
    id: 'fin.gl.unposted',
    title: 'Unposted Journals',
    description: 'Unposted journal entries awaiting posting',
    template: 'count-status',
    format: 'count',
    href: routes.finance.journals,
    module: 'gl',
    tags: ['attention'],
    emptyState: {
      registryKey: 'kpi.unpostedJournals',
      title: 'No unposted journals',
      description: 'All journals are posted. Create a new journal entry.',
      ctaLabel: 'Create Journal',
      ctaHref: routes.finance.journalNew,
    },
  },
  {
    id: 'fin.gl.trialBalance',
    title: 'Trial Balance',
    description: 'Debits and credits balance summary',
    template: 'value-trend',
    format: 'money',
    href: routes.finance.trialBalance,
    module: 'gl',
    emptyState: {
      registryKey: 'kpi.trialBalance',
      title: 'No trial balance',
      description: 'Run a trial balance report to see debit/credit totals.',
      ctaLabel: 'View Trial Balance',
      ctaHref: routes.finance.trialBalance,
    },
  },
];

const FINANCE_BANKING_CATALOG: KPICatalogEntry[] = [
  {
    id: 'fin.bank.balance',
    title: 'Bank Balance',
    description: 'Current balance across reconciled bank accounts',
    template: 'dial',
    format: 'money',
    href: routes.finance.banking,
    group: 'cash',
    module: 'banking',
    category: 'cashflow',
    minValue: 0,
    maxValue: 2000000,
    thresholds: [
      { value: 66, color: 'success', label: 'Healthy' },
      { value: 33, color: 'warning', label: 'Monitor' },
      { value: 0, color: 'destructive', label: 'Low' },
    ],
    quickActions: [{ label: 'Reconcile', href: routes.finance.bankReconciliation }],
    displayPriority: 10,
    heroEligible: true,
    tags: ['cash-flow'],
    searchKeywords: ['bank', 'balance', 'cash'],
    emptyState: {
      registryKey: 'finance.banking.statements',
      title: 'Connect your bank',
      description: 'Link your bank account to see balances and reconcile transactions.',
      ctaLabel: 'Import statement',
      ctaHref: routes.finance.bankStatementImport,
    },
  },
  {
    id: 'fin.bank.unreconciled',
    title: 'Unreconciled Items',
    description: 'Bank transactions not yet matched',
    template: 'count-status',
    format: 'count',
    href: routes.finance.banking,
    group: 'cash',
    module: 'banking',
    tags: ['attention', 'compliance'],
    emptyState: {
      registryKey: 'kpi.unreconciledItems',
      title: 'All reconciled',
      description: 'No unreconciled items. Import a bank statement to check.',
      ctaLabel: 'Import Statement',
      ctaHref: routes.finance.bankStatementImport,
    },
  },
];

const FINANCE_ASSETS_CATALOG: KPICatalogEntry[] = [
  {
    id: 'fin.aa.totalAssets',
    title: 'Total Fixed Assets',
    description: 'Net book value of fixed assets',
    template: 'value-trend',
    format: 'money',
    href: routes.finance.fixedAssets,
    group: 'operations',
    module: 'assets',
    emptyState: {
      registryKey: 'kpi.totalFixedAssets',
      title: 'No fixed assets',
      description: 'Register your first asset to start tracking fixed assets.',
      ctaLabel: 'Add Asset',
      ctaHref: routes.finance.fixedAssetNew,
    },
  },
  {
    id: 'fin.aa.depreciation',
    title: 'Depreciation (MTD)',
    description: 'Depreciation expense for the month',
    template: 'value-trend',
    format: 'money',
    href: routes.finance.depreciationRuns,
    group: 'operations',
    module: 'assets',
    emptyState: {
      registryKey: 'kpi.depreciationMtd',
      title: 'No depreciation',
      description: 'Run depreciation after registering depreciable assets.',
      ctaLabel: 'Run Depreciation',
      ctaHref: routes.finance.depreciationRuns,
    },
  },
  {
    id: 'fin.aa.disposals',
    title: 'Pending Disposals',
    description: 'Assets awaiting disposal processing',
    template: 'count-status',
    format: 'count',
    href: routes.finance.assetDisposals,
    group: 'operations',
    module: 'assets',
    emptyState: {
      registryKey: 'kpi.pendingDisposals',
      title: 'No pending disposals',
      description: 'No assets are scheduled for disposal.',
      ctaLabel: 'View Assets',
      ctaHref: routes.finance.fixedAssets,
    },
  },
];

const FINANCE_TRAVEL_CATALOG: KPICatalogEntry[] = [
  {
    id: 'fin.tv.openClaims',
    title: 'Open Claims',
    description: 'Expense claims awaiting submission or processing',
    template: 'count-status',
    format: 'count',
    href: routes.finance.expenses,
    group: 'operations',
    module: 'travel',
    emptyState: {
      registryKey: 'kpi.openClaims',
      title: 'No open claims',
      description: 'Create an expense claim to track reimbursements.',
      ctaLabel: 'New Expense',
      ctaHref: routes.finance.expenseNew,
    },
  },
  {
    id: 'fin.tv.pendingApproval',
    title: 'Pending Approval',
    description: 'Expense claims in approval workflow',
    template: 'count-status',
    format: 'count',
    href: routes.finance.expenses,
    group: 'operations',
    module: 'travel',
    tags: ['approval'],
    emptyState: {
      registryKey: 'kpi.expensesPending',
      title: 'No pending approvals',
      description: 'All expense claims have been processed.',
      ctaLabel: 'View Expenses',
      ctaHref: routes.finance.expenses,
    },
  },
  {
    id: 'fin.tv.totalExpenses',
    title: 'Expenses (MTD)',
    description: 'Total expenses submitted this month',
    template: 'value-trend',
    format: 'money',
    href: routes.finance.expenses,
    group: 'operations',
    module: 'travel',
    emptyState: {
      registryKey: 'kpi.expensesMtd',
      title: 'No expenses this month',
      description: 'No expense claims submitted this month.',
      ctaLabel: 'New Expense',
      ctaHref: routes.finance.expenseNew,
    },
  },
];

const FINANCE_TREASURY_CATALOG: KPICatalogEntry[] = [
  {
    id: 'fin.tr.cashForecast',
    title: 'Cash Forecast (30d)',
    description: 'Projected cash position over next 30 days',
    template: 'value-trend',
    format: 'money',
    href: routes.finance.cashForecasts,
    group: 'cash',
    module: 'treasury',
    category: 'cashflow',
    emptyState: {
      registryKey: 'kpi.cashForecast',
      title: 'No forecast data',
      description: 'Create a cash forecast to project future cash position.',
      ctaLabel: 'New Forecast',
      ctaHref: routes.finance.cashForecastNew,
    },
  },
  {
    id: 'fin.tr.activeLoans',
    title: 'Active Loans',
    description: 'Outstanding loan and credit facilities',
    template: 'count-status',
    format: 'count',
    href: routes.finance.icLoans,
    group: 'cash',
    module: 'treasury',
    emptyState: {
      registryKey: 'kpi.activeLoans',
      title: 'No active loans',
      description: 'No intercompany loans or credit facilities.',
      ctaLabel: 'View Loans',
      ctaHref: routes.finance.icLoans,
    },
  },
  {
    id: 'fin.tr.covenantBreaches',
    title: 'Covenant Breaches',
    description: 'Loan covenants currently out of compliance',
    template: 'count-status',
    format: 'count',
    href: routes.finance.covenants,
    group: 'cash',
    module: 'treasury',
    tags: ['attention', 'compliance'],
    emptyState: {
      registryKey: 'kpi.covenantBreaches',
      title: 'No breaches',
      description: 'All covenants are within compliance.',
      ctaLabel: 'View Covenants',
      ctaHref: routes.finance.covenants,
    },
  },
];

const FINANCE_CONTROLLING_CATALOG: KPICatalogEntry[] = [
  {
    id: 'fin.co.costCenters',
    title: 'Active Cost Centers',
    description: 'Cost centers with activity',
    template: 'count-status',
    format: 'count',
    href: routes.finance.costCenters,
    group: 'operations',
    module: 'controlling',
    emptyState: {
      registryKey: 'kpi.activeCostCenters',
      title: 'No cost centers',
      description: 'Create cost centers to track departmental spending.',
      ctaLabel: 'Add Cost Center',
      ctaHref: routes.finance.costCenterNew,
    },
  },
  {
    id: 'fin.co.projects',
    title: 'Active Projects',
    description: 'Projects with open WIP or billing',
    template: 'count-status',
    format: 'count',
    href: routes.finance.projects,
    group: 'operations',
    module: 'controlling',
    emptyState: {
      registryKey: 'kpi.activeProjects',
      title: 'No active projects',
      description: 'Create a project to track WIP and billing.',
      ctaLabel: 'New Project',
      ctaHref: routes.finance.projectNew,
    },
  },
  {
    id: 'fin.co.allocations',
    title: 'Pending Allocations',
    description: 'Allocation runs awaiting processing',
    template: 'count-status',
    format: 'count',
    href: routes.finance.allocationRuns,
    group: 'operations',
    module: 'controlling',
    emptyState: {
      registryKey: 'kpi.pendingAllocations',
      title: 'No pending allocations',
      description: 'All cost allocations have been processed.',
      ctaLabel: 'View Allocations',
      ctaHref: routes.finance.allocationRuns,
    },
  },
  {
    id: 'fin.co.variance',
    title: 'Budget Variance',
    description: 'Variance between actual and budget',
    template: 'value-trend',
    format: 'percent',
    href: routes.finance.costAllocation,
    group: 'operations',
    module: 'controlling',
    emptyState: {
      registryKey: 'kpi.budgetVariance',
      title: 'No variance data',
      description: 'Create a budget to track variance against actuals.',
      ctaLabel: 'View Budgets',
      ctaHref: routes.finance.costAllocation,
    },
  },
];

const FINANCE_TAX_CATALOG: KPICatalogEntry[] = [
  {
    id: 'fin.tx.activeCodes',
    title: 'Active Tax Codes',
    description: 'Tax codes configured for use',
    template: 'count-status',
    format: 'count',
    href: routes.finance.taxCodes,
    module: 'tax',
    category: 'compliance',
  },
  {
    id: 'fin.tx.pendingReturns',
    title: 'Pending Returns',
    description: 'Tax returns due for filing',
    template: 'count-status',
    format: 'count',
    href: routes.finance.taxReturns,
    module: 'tax',
    tags: ['attention', 'compliance'],
  },
  {
    id: 'fin.tx.whtCerts',
    title: 'WHT Certificates',
    description: 'Withholding tax certificates',
    template: 'count-status',
    format: 'count',
    href: routes.finance.whtCertificates,
    module: 'tax',
    category: 'compliance',
  },
];

const FINANCE_IC_CATALOG: KPICatalogEntry[] = [
  {
    id: 'fin.ic.openTx',
    title: 'Open IC Transactions',
    description: 'Intercompany transactions awaiting settlement',
    template: 'count-status',
    format: 'count',
    href: routes.finance.icTransactions,
    module: 'ic',
  },
  {
    id: 'fin.ic.aging',
    title: 'IC Aging',
    description: 'Intercompany balances by aging',
    template: 'aging',
    format: 'money',
    href: routes.finance.icAging,
    module: 'ic',
    category: 'aging',
  },
  {
    id: 'fin.ic.tpPolicies',
    title: 'TP Policies',
    description: 'Transfer pricing policies configured',
    template: 'count-status',
    format: 'count',
    href: routes.finance.transferPricing,
    module: 'ic',
  },
];

const FINANCE_IFRS_CATALOG: KPICatalogEntry[] = [
  {
    id: 'fin.ifrs.activeLeases',
    title: 'Active Leases',
    description: 'Lease contracts under IFRS 16',
    template: 'count-status',
    format: 'count',
    href: routes.finance.leases,
    module: 'ifrs',
  },
  {
    id: 'fin.ifrs.provisions',
    title: 'Open Provisions',
    description: 'Provisions on balance sheet',
    template: 'count-status',
    format: 'count',
    href: routes.finance.provisions,
    module: 'ifrs',
  },
  {
    id: 'fin.ifrs.instruments',
    title: 'Instruments',
    description: 'Financial instruments',
    template: 'count-status',
    format: 'count',
    href: routes.finance.instruments,
    module: 'ifrs',
  },
  {
    id: 'fin.ifrs.hedges',
    title: 'Active Hedges',
    description: 'Hedge relationships',
    template: 'count-status',
    format: 'count',
    href: routes.finance.hedges,
    module: 'ifrs',
  },
];

const FINANCE_CONSOLIDATION_CATALOG: KPICatalogEntry[] = [
  {
    id: 'fin.lc.entities',
    title: 'Group Entities',
    description: 'Entities in consolidation group',
    template: 'count-status',
    format: 'count',
    href: routes.finance.groupEntities,
    module: 'consolidation',
  },
  {
    id: 'fin.lc.eliminations',
    title: 'Pending Eliminations',
    description: 'Elimination entries awaiting posting',
    template: 'count-status',
    format: 'count',
    href: routes.finance.eliminations,
    module: 'consolidation',
  },
  {
    id: 'fin.lc.goodwill',
    title: 'Goodwill Balance',
    description: 'Goodwill from acquisitions',
    template: 'value-trend',
    format: 'money',
    href: routes.finance.goodwill,
    module: 'consolidation',
  },
];

const FINANCE_SETTINGS_CATALOG: KPICatalogEntry[] = [
  {
    id: 'fin.cfg.paymentTerms',
    title: 'Payment Terms',
    description: 'Payment term templates configured',
    template: 'count-status',
    format: 'count',
    href: routes.finance.paymentTerms,
    module: 'settings',
  },
  {
    id: 'fin.cfg.matchRules',
    title: 'Match Tolerances',
    description: 'Invoice matching tolerance rules',
    template: 'count-status',
    format: 'count',
    href: routes.finance.matchTolerance,
    module: 'settings',
  },
];

const FINANCE_REPORTS_CATALOG: KPICatalogEntry[] = [
  {
    id: 'fin.rp.balanceSheet',
    title: 'Balance Sheet',
    description: 'Statement of financial position',
    template: 'pending',
    format: 'text',
    href: routes.finance.balanceSheet,
    module: 'reports',
  },
  {
    id: 'fin.rp.incomeStmt',
    title: 'Income Statement',
    description: 'Profit and loss statement',
    template: 'pending',
    format: 'text',
    href: routes.finance.incomeStatement,
    module: 'reports',
  },
  {
    id: 'fin.rp.cashFlow',
    title: 'Cash Flow',
    template: 'pending',
    format: 'text',
    description: 'Statement of cash flows',
    href: routes.finance.cashFlow,
    module: 'reports',
  },
];

const HOME_CATALOG: KPICatalogEntry[] = [
  {
    id: 'home.activity',
    title: 'Recent Activity',
    description: 'Recent activity across modules',
    template: 'count-status',
    format: 'count',
    module: 'home',
  },
];

const ADMIN_CATALOG: KPICatalogEntry[] = [
  {
    id: 'admin.tenants',
    title: 'Active Tenants',
    description: 'Tenant organizations in the system',
    template: 'count-status',
    format: 'count',
    href: '/admin/tenants',
    module: 'admin',
  },
  {
    id: 'admin.users',
    title: 'Total Users',
    description: 'Total user accounts',
    template: 'count-status',
    format: 'count',
    href: '/admin/users',
    module: 'admin',
  },
];

const PENDING_CATALOG: KPICatalogEntry[] = [
  {
    id: 'stub.comingSoon',
    title: 'Coming Soon',
    description: 'Placeholder for future KPI',
    template: 'pending',
    format: 'text',
    module: 'finance',
  },
];

// ─── Catalog Lookup ─────────────────────────────────────────────────────────

const ALL_ENTRIES = [
  ...FINANCE_CATALOG,
  ...FINANCE_AP_CATALOG,
  ...FINANCE_AR_CATALOG,
  ...FINANCE_GL_CATALOG,
  ...FINANCE_BANKING_CATALOG,
  ...FINANCE_ASSETS_CATALOG,
  ...FINANCE_TRAVEL_CATALOG,
  ...FINANCE_TREASURY_CATALOG,
  ...FINANCE_CONTROLLING_CATALOG,
  ...FINANCE_TAX_CATALOG,
  ...FINANCE_IC_CATALOG,
  ...FINANCE_IFRS_CATALOG,
  ...FINANCE_CONSOLIDATION_CATALOG,
  ...FINANCE_SETTINGS_CATALOG,
  ...FINANCE_REPORTS_CATALOG,
  ...HOME_CATALOG,
  ...ADMIN_CATALOG,
  ...PENDING_CATALOG,
];

const CATALOG_MAP = new Map(ALL_ENTRIES.map((e) => [e.id, e]));

const FALLBACK_ENTRY: KPICatalogEntry = {
  id: 'unknown',
  title: 'Unknown',
  template: 'pending',
  format: 'text',
  module: 'finance',
};

/**
 * Look up catalog entries for a list of KPI IDs.
 * Returns entries in the same order as the input IDs.
 */
export function getKPICatalogEntries(kpiIds: string[]): KPICatalogEntry[] {
  return kpiIds.map((id) => CATALOG_MAP.get(id) ?? { ...FALLBACK_ENTRY, id });
}

/**
 * Look up a single catalog entry by ID.
 */
export function getCatalogEntry(id: string): KPICatalogEntry | undefined {
  return CATALOG_MAP.get(id);
}

/**
 * Get all catalog entries, optionally filtered by domain/module.
 */
export function getAllCatalogEntries(domainId?: string): KPICatalogEntry[] {
  const entries = [...CATALOG_MAP.values()];
  if (!domainId) return entries;
  const moduleMap: Record<string, string> = {
    'finance.overview': 'finance',
    'finance.ap': 'ap',
    'finance.ar': 'ar',
    'finance.gl': 'gl',
    'finance.banking': 'banking',
    'finance.assets': 'assets',
    'finance.travel': 'travel',
    'finance.treasury': 'treasury',
    'finance.controlling': 'controlling',
    'finance.tax': 'tax',
    'finance.intercompany': 'intercompany',
    'finance.ifrs': 'ifrs',
    'finance.consolidation': 'consolidation',
    'finance.settings': 'settings',
    'finance.reports': 'reports',
  };
  const targetModule = moduleMap[domainId];
  if (!targetModule) return entries;
  return entries.filter((e) => e.module === targetModule);
}

/**
 * Get catalog entries by semantic group.
 */
export function getCatalogByGroup(group: KPIGroup): KPICatalogEntry[] {
  return [...CATALOG_MAP.values()].filter((e) => e.group === group);
}

/**
 * Get catalog entries by tag.
 */
export function getCatalogByTag(tag: KPITag): KPICatalogEntry[] {
  return [...CATALOG_MAP.values()].filter((e) => e.tags?.includes(tag));
}

/**
 * Get entries eligible for hero display (2×1 when first in layout).
 */
export function getHeroEligibleEntries(): KPICatalogEntry[] {
  return [...CATALOG_MAP.values()].filter((e) => e.heroEligible);
}

/**
 * Resolve quick actions from catalog entry (supports quickAction and quickActions).
 */
export function getQuickActions(entry: KPICatalogEntry): KpiQuickAction[] {
  if (entry.quickActions?.length) return entry.quickActions;
  if (entry.quickAction) return [entry.quickAction];
  return [];
}
