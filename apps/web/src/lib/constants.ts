import type { JournalStatus, ApInvoiceStatus, ArInvoiceStatus } from '@afenda/contracts';

// ─── Route Paths ────────────────────────────────────────────────────────────

export const routes = {
  home: '/',
  login: '/login',
  dashboard: '/',
  finance: {
    // Dashboard & Overview
    dashboard: '/finance',
    approvals: '/finance/approvals',

    // Payments
    payments: '/finance/payments',
    paymentDetail: (id: string) => `/finance/payments/${id}`,

    // Budgets
    budgetTransferDetail: (id: string) => `/finance/budgets/transfers/${id}`,

    // General Ledger
    journals: '/finance/journals',
    journalDetail: (id: string) => `/finance/journals/${id}`,
    journalNew: '/finance/journals/new',
    accounts: '/finance/accounts',
    accountDetail: (id: string) => `/finance/accounts/${id}`,
    accountNew: '/finance/accounts/new',
    periods: '/finance/periods',
    ledgers: '/finance/ledgers',
    ledgerDetail: (id: string) => `/finance/ledgers/${id}`,
    ledgerNew: '/finance/ledgers/new',
    trialBalance: '/finance/trial-balance',
    recurring: '/finance/recurring',
    recurringNew: '/finance/recurring/new',
    recurringDetail: (id: string) => `/finance/recurring/${id}`,

    // Accounts Payable
    payables: '/finance/payables',
    payableDetail: (id: string) => `/finance/payables/${id}`,
    payableNew: '/finance/payables/new',
    payablePay: (id: string) => `/finance/payables/${id}/pay`,

    // Accounts Receivable
    receivables: '/finance/receivables',
    receivableDetail: (id: string) => `/finance/receivables/${id}`,
    receivableNew: '/finance/receivables/new',
    receivableAllocate: (id: string) => `/finance/receivables/${id}/allocate`,

    // Intercompany
    icTransactions: '/finance/intercompany',
    icTransactionDetail: (id: string) => `/finance/intercompany/${id}`,
    icTransactionNew: '/finance/intercompany/new',

    // FX & Rates
    fxRates: '/finance/fx-rates',
    fxRateNew: '/finance/fx-rates/new',

    // Banking & Reconciliation
    banking: '/finance/banking',
    bankStatements: '/finance/banking',
    bankStatementsList: '/finance/banking/statements',
    bankStatementImport: '/finance/banking/import',
    bankReconciliation: '/finance/banking',
    bankReconciliationDetail: (id: string) => `/finance/banking/reconcile/${id}`,
    bankRules: '/finance/banking',

    // Tax & Compliance
    tax: '/finance/tax',
    taxCodes: '/finance/tax/codes',
    taxCodeDetail: (id: string) => `/finance/tax/codes/${id}`,
    taxCodeNew: '/finance/tax/codes/new',
    taxRates: '/finance/tax/rates',
    taxReturns: '/finance/tax/returns',
    taxReturnDetail: (id: string) => `/finance/tax/returns/${id}`,
    whtCertificates: '/finance/tax/wht-certificates',
    whtList: '/finance/tax/wht',
    whtDetail: (id: string) => `/finance/tax/wht/${id}`,

    // Fixed Assets
    fixedAssets: '/finance/fixed-assets',
    fixedAssetDetail: (id: string) => `/finance/fixed-assets/${id}`,
    fixedAssetNew: '/finance/fixed-assets/new',
    depreciation: '/finance/fixed-assets/depreciation',
    depreciationRuns: '/finance/fixed-assets/depreciation-runs',
    depreciationRunNew: '/finance/fixed-assets/depreciation-runs/new',
    assetDisposals: '/finance/fixed-assets/disposals',
    assetDisposalDetail: (id: string) => `/finance/fixed-assets/disposals/${id}`,

    // Intangible Assets
    intangibles: '/finance/intangibles',
    intangibleDetail: (id: string) => `/finance/intangibles/${id}`,
    intangibleNew: '/finance/intangibles/new',

    // Expense Claims
    expenses: '/finance/expenses',
    expensesMine: '/finance/expenses/mine',
    expenseDetail: (id: string) => `/finance/expenses/${id}`,
    expenseNew: '/finance/expenses/new',
    expensePolicies: '/finance/expenses/policies',

    // Project Accounting
    projects: '/finance/projects',
    projectDetail: (id: string) => `/finance/projects/${id}`,
    projectNew: '/finance/projects/new',
    projectBilling: (id: string) => `/finance/projects/${id}/billing`,
    projectEdit: (id: string) => `/finance/projects/${id}/edit`,
    projectWip: '/finance/projects/wip',

    // Cost Accounting
    costCenters: '/finance/cost-centers',
    costCenterDetail: (id: string) => `/finance/cost-centers/${id}`,
    costCenterNew: '/finance/cost-centers/new',
    costDrivers: '/finance/cost-centers/drivers',
    costDriverNew: '/finance/cost-centers/drivers/new',
    allocationRuns: '/finance/cost-centers/allocation-runs',
    allocations: '/finance/cost-centers/allocations',
    allocationDetail: (id: string) => `/finance/cost-centers/allocations/${id}`,
    allocationNew: '/finance/cost-centers/allocations/new',

    // Treasury
    treasury: '/finance/treasury',
    cashForecasts: '/finance/treasury/forecasts',
    cashForecastDetail: (id: string) => `/finance/treasury/forecasts/${id}`,
    cashForecastNew: '/finance/treasury/forecasts/new',
    covenants: '/finance/treasury/covenants',
    covenantDetail: (id: string) => `/finance/treasury/covenants/${id}`,
    covenantNew: '/finance/treasury/covenants/new',
    icLoans: '/finance/treasury/ic-loans',
    icLoanDetail: (id: string) => `/finance/treasury/ic-loans/${id}`,
    treasuryLoans: '/finance/treasury/loans',
    treasuryLoanDetail: (id: string) => `/finance/treasury/loans/${id}`,
    treasuryLoanNew: '/finance/treasury/loans/new',

    // Credit Management
    creditLimits: '/finance/credit',
    creditLimitDetail: (id: string) => `/finance/credit/${id}`,
    creditNew: '/finance/credit/new',
    creditHoldDetail: (id: string) => `/finance/credit/holds/${id}`,
    creditReviews: '/finance/credit/reviews',

    // Lease Accounting (IFRS 16)
    leases: '/finance/leases',
    leaseDetail: (id: string) => `/finance/leases/${id}`,
    leaseNew: '/finance/leases/new',
    leaseModification: (id: string) => `/finance/leases/${id}/modify`,
    leaseModifications: '/finance/leases/modifications',
    leaseRunPeriod: '/finance/leases/run-period',

    // Provisions (IAS 37)
    provisions: '/finance/provisions',
    provisionDetail: (id: string) => `/finance/provisions/${id}`,
    provisionNew: '/finance/provisions/new',

    // Financial Instruments (IFRS 9)
    instruments: '/finance/instruments',
    instrumentDetail: (id: string) => `/finance/instruments/${id}`,
    instrumentNew: '/finance/instruments/new',

    // Hedge Accounting (IFRS 9)
    hedges: '/finance/hedging',
    hedgeDetail: (id: string) => `/finance/hedging/${id}`,
    hedgeNew: '/finance/hedging/new',
    hedgeEffectiveness: (id: string) => `/finance/hedging/${id}/effectiveness`,

    // Deferred Tax (IAS 12)
    deferredTax: '/finance/deferred-tax',
    deferredTaxDetail: (id: string) => `/finance/deferred-tax/${id}`,
    deferredTaxSummary: '/finance/deferred-tax/summary',
    deferredTaxNew: '/finance/deferred-tax/new',
    deferredTaxRecalculate: '/finance/deferred-tax/recalculate',

    // Consolidation
    consolidation: '/finance/consolidation',
    consolidationRun: '/finance/consolidation/run',
    consolidationEntityNew: '/finance/consolidation/entities/new',
    groupEntities: '/finance/consolidation',
    groupEntityDetail: (id: string) => `/finance/consolidation/entities/${id}`,
    ownership: '/finance/consolidation',
    goodwill: '/finance/consolidation',
    eliminations: '/finance/consolidation',

    // Transfer Pricing
    transferPricing: '/finance/transfer-pricing',
    transferPricingDetail: (id: string) => `/finance/transfer-pricing/${id}`,
    transferPricingNew: '/finance/transfer-pricing/new',
    transferPricingPolicies: '/finance/transfer-pricing/policies',
    transferPricingBenchmarks: '/finance/transfer-pricing/benchmarks',

    // Reports
    reports: '/finance/reports',
    balanceSheet: '/finance/reports/balance-sheet',
    incomeStatement: '/finance/reports/income-statement',
    cashFlow: '/finance/reports/cash-flow',
    budgetVariance: '/finance/reports/budget-variance',
    icAging: '/finance/reports/ic-aging',
    equityStatement: '/finance/reports/equity-statement',
    apAging: '/finance/reports/ap-aging',
    arAging: '/finance/reports/ar-aging',
    taxSummary: '/finance/reports/tax-summary',
    assetRegister: '/finance/reports/asset-register',
    costAllocation: '/finance/reports/cost-allocation',
    consolidationReport: '/finance/reports/consolidation',
  },
  settings: '/settings',

  // Supplier Portal
  portal: {
    dashboard: '/portal',
    invoices: '/portal/invoices',
    invoiceDetail: (id: string) => `/portal/invoices/${id}`,
    invoiceSubmit: '/portal/invoices/submit',
    payments: '/portal/payments',
    paymentDetail: (runId: string) => `/portal/payments/${runId}`,
    remittance: (runId: string) => `/portal/payments/${runId}/remittance`,
    profile: '/portal/profile',
    bankAccounts: '/portal/bank-accounts',
    documents: '/portal/documents',
    disputes: '/portal/disputes',
    disputeNew: '/portal/disputes/new',
    disputeDetail: (id: string) => `/portal/disputes/${id}`,
    reconciliation: '/portal/reconciliation',
    wht: '/portal/wht',
    whtDetail: (id: string) => `/portal/wht/${id}`,
    compliance: '/portal/compliance',
    notificationSettings: '/portal/settings/notifications',
  },
} as const;

// ─── Status Colors (maps to shadcn Badge variants) ─────────────────────────

type DocumentStatus = JournalStatus | ApInvoiceStatus | ArInvoiceStatus | string;

export const statusConfig: Record<
  string,
  { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }
> = {
  DRAFT: { variant: 'secondary', label: 'Draft' },
  POSTED: { variant: 'default', label: 'Posted' },
  REVERSED: { variant: 'outline', label: 'Reversed' },
  VOIDED: { variant: 'destructive', label: 'Voided' },
  PENDING_APPROVAL: { variant: 'outline', label: 'Pending Approval' },
  APPROVED: { variant: 'default', label: 'Approved' },
  PAID: { variant: 'default', label: 'Paid' },
  PARTIALLY_PAID: { variant: 'outline', label: 'Partially Paid' },
  CANCELLED: { variant: 'destructive', label: 'Cancelled' },
  WRITTEN_OFF: { variant: 'destructive', label: 'Written Off' },
  OPEN: { variant: 'default', label: 'Open' },
  CLOSED: { variant: 'secondary', label: 'Closed' },
  LOCKED: { variant: 'outline', label: 'Locked' },
  PENDING: { variant: 'outline', label: 'Pending' },
  PAIRED: { variant: 'default', label: 'Paired' },
  RECONCILED: { variant: 'default', label: 'Reconciled' },
  ACTIVE: { variant: 'default', label: 'Active' },
  INACTIVE: { variant: 'secondary', label: 'Inactive' },
  EXPIRED: { variant: 'destructive', label: 'Expired' },
  SUBMITTED: { variant: 'outline', label: 'Submitted' },
  REJECTED: { variant: 'destructive', label: 'Rejected' },
  IN_PROGRESS: { variant: 'outline', label: 'In Progress' },
  COMPLETED: { variant: 'default', label: 'Completed' },
  ON_HOLD: { variant: 'secondary', label: 'On Hold' },
  FULLY_DEPRECIATED: { variant: 'secondary', label: 'Fully Depreciated' },
  DISPOSED: { variant: 'outline', label: 'Disposed' },
  INCOMPLETE: { variant: 'destructive', label: 'Incomplete' },
  IN_REVIEW: { variant: 'outline', label: 'In Review' },
  RESOLVED: { variant: 'default', label: 'Resolved' },
  VALID: { variant: 'default', label: 'Valid' },
  EXPIRING_SOON: { variant: 'outline', label: 'Expiring Soon' },
  MISSING: { variant: 'destructive', label: 'Missing' },
  MATCHED: { variant: 'default', label: 'Matched' },
  UNMATCHED: { variant: 'destructive', label: 'Unmatched' },
};

export function getStatusConfig(status: DocumentStatus) {
  return statusConfig[status] ?? { variant: 'secondary' as const, label: status };
}

// ─── Currency Config ────────────────────────────────────────────────────────

export const currencyConfig: Record<string, { symbol: string; decimals: number }> = {
  USD: { symbol: '$', decimals: 2 },
  EUR: { symbol: '€', decimals: 2 },
  GBP: { symbol: '£', decimals: 2 },
  MYR: { symbol: 'RM', decimals: 2 },
  JPY: { symbol: '¥', decimals: 0 },
  SGD: { symbol: 'S$', decimals: 2 },
  CNY: { symbol: '¥', decimals: 2 },
  AUD: { symbol: 'A$', decimals: 2 },
  HKD: { symbol: 'HK$', decimals: 2 },
  INR: { symbol: '₹', decimals: 2 },
};

// ─── Navigation Config (Grouped by Function) ────────────────────────────────

export interface NavItem {
  title: string;
  href: string;
  icon: string;
  badge?: number;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
  children?: NavItem[];
}

export interface NavGroup {
  title: string;
  icon: string;
  items: NavItem[];
  collapsible?: boolean;
}

export const financeNavigationGroups: NavGroup[] = [
  {
    title: 'Overview',
    icon: 'LayoutDashboard',
    items: [
      { title: 'Dashboard', href: routes.finance.dashboard, icon: 'LayoutDashboard' },
      { title: 'Approvals', href: routes.finance.approvals, icon: 'CheckCircle' },
    ],
  },
  {
    title: 'General Ledger',
    icon: 'BookOpen',
    collapsible: true,
    items: [
      { title: 'Journals', href: routes.finance.journals, icon: 'FileText' },
      { title: 'Accounts', href: routes.finance.accounts, icon: 'List' },
      { title: 'Trial Balance', href: routes.finance.trialBalance, icon: 'Scale' },
      { title: 'Ledgers', href: routes.finance.ledgers, icon: 'BookOpen' },
      { title: 'Periods', href: routes.finance.periods, icon: 'Calendar' },
      { title: 'Recurring', href: routes.finance.recurring, icon: 'RefreshCw' },
    ],
  },
  {
    title: 'Payables & Receivables',
    icon: 'CreditCard',
    collapsible: true,
    items: [
      { title: 'Payables', href: routes.finance.payables, icon: 'Receipt' },
      { title: 'Receivables', href: routes.finance.receivables, icon: 'HandCoins' },
      { title: 'Credit Limits', href: routes.finance.creditLimits, icon: 'Shield' },
    ],
  },
  {
    title: 'Banking',
    icon: 'Landmark',
    collapsible: true,
    items: [
      { title: 'Statements', href: routes.finance.bankStatements, icon: 'FileSpreadsheet' },
      { title: 'Reconciliation', href: routes.finance.bankReconciliation, icon: 'GitMerge' },
      { title: 'Rules', href: routes.finance.bankRules, icon: 'Settings2' },
    ],
  },
  {
    title: 'Tax & Compliance',
    icon: 'FileCheck',
    collapsible: true,
    items: [
      { title: 'Tax Codes', href: routes.finance.taxCodes, icon: 'Hash' },
      { title: 'Tax Returns', href: routes.finance.taxReturns, icon: 'FileSignature' },
      { title: 'WHT Certificates', href: routes.finance.whtCertificates, icon: 'Award' },
    ],
  },
  {
    title: 'Assets',
    icon: 'Package',
    collapsible: true,
    items: [
      { title: 'Fixed Assets', href: routes.finance.fixedAssets, icon: 'Building' },
      { title: 'Depreciation', href: routes.finance.depreciationRuns, icon: 'TrendingDown' },
      { title: 'Intangibles', href: routes.finance.intangibles, icon: 'Sparkles' },
      { title: 'Disposals', href: routes.finance.assetDisposals, icon: 'Trash2' },
    ],
  },
  {
    title: 'Expenses',
    icon: 'Wallet',
    collapsible: true,
    items: [
      { title: 'My Claims', href: routes.finance.expensesMine, icon: 'User' },
      { title: 'All Claims', href: routes.finance.expenses, icon: 'Users' },
      { title: 'Policies', href: routes.finance.expensePolicies, icon: 'Shield' },
    ],
  },
  {
    title: 'Projects',
    icon: 'FolderKanban',
    collapsible: true,
    items: [
      { title: 'Projects', href: routes.finance.projects, icon: 'FolderKanban' },
      { title: 'Cost Centers', href: routes.finance.costCenters, icon: 'PieChart' },
      { title: 'Allocation Runs', href: routes.finance.allocationRuns, icon: 'Workflow' },
    ],
  },
  {
    title: 'Treasury',
    icon: 'Vault',
    collapsible: true,
    items: [
      { title: 'Cash Forecasts', href: routes.finance.cashForecasts, icon: 'TrendingUp' },
      { title: 'Covenants', href: routes.finance.covenants, icon: 'FileWarning' },
      { title: 'IC Loans', href: routes.finance.icLoans, icon: 'ArrowLeftRight' },
      { title: 'FX Rates', href: routes.finance.fxRates, icon: 'ArrowRightLeft' },
    ],
  },
  {
    title: 'Intercompany',
    icon: 'Network',
    collapsible: true,
    items: [
      { title: 'Transactions', href: routes.finance.icTransactions, icon: 'ArrowLeftRight' },
      { title: 'Transfer Pricing', href: routes.finance.transferPricing, icon: 'Calculator' },
    ],
  },
  {
    title: 'IFRS Compliance',
    icon: 'ShieldCheck',
    collapsible: true,
    items: [
      { title: 'Leases (IFRS 16)', href: routes.finance.leases, icon: 'Key' },
      { title: 'Provisions (IAS 37)', href: routes.finance.provisions, icon: 'AlertCircle' },
      { title: 'Instruments (IFRS 9)', href: routes.finance.instruments, icon: 'Banknote' },
      { title: 'Hedges (IFRS 9)', href: routes.finance.hedges, icon: 'Umbrella' },
      { title: 'Deferred Tax (IAS 12)', href: routes.finance.deferredTax, icon: 'Clock' },
    ],
  },
  {
    title: 'Consolidation',
    icon: 'GitBranch',
    collapsible: true,
    items: [
      { title: 'Group Entities', href: routes.finance.groupEntities, icon: 'Building2' },
      { title: 'Ownership', href: routes.finance.ownership, icon: 'Users' },
      { title: 'Eliminations', href: routes.finance.eliminations, icon: 'MinusCircle' },
      { title: 'Goodwill', href: routes.finance.goodwill, icon: 'Star' },
    ],
  },
  {
    title: 'Reports',
    icon: 'BarChart3',
    collapsible: true,
    items: [
      { title: 'Balance Sheet', href: routes.finance.balanceSheet, icon: 'Scale' },
      { title: 'Income Statement', href: routes.finance.incomeStatement, icon: 'TrendingUp' },
      { title: 'Cash Flow', href: routes.finance.cashFlow, icon: 'Banknote' },
      { title: 'Equity Statement', href: routes.finance.equityStatement, icon: 'PieChart' },
      { title: 'AP Aging', href: routes.finance.apAging, icon: 'Receipt' },
      { title: 'AR Aging', href: routes.finance.arAging, icon: 'HandCoins' },
      { title: 'IC Aging', href: routes.finance.icAging, icon: 'ArrowLeftRight' },
      { title: 'Budget Variance', href: routes.finance.budgetVariance, icon: 'Target' },
      { title: 'Asset Register', href: routes.finance.assetRegister, icon: 'Package' },
      { title: 'Tax Summary', href: routes.finance.taxSummary, icon: 'FileCheck' },
      { title: 'Cost Allocation', href: routes.finance.costAllocation, icon: 'PieChart' },
      { title: 'Consolidation', href: routes.finance.consolidationReport, icon: 'GitBranch' },
    ],
  },
];

// ─── Portal Navigation Config ────────────────────────────────────────────────

export const portalNavigationItems: NavItem[] = [
  { title: 'Dashboard', href: routes.portal.dashboard, icon: 'LayoutDashboard' },
  { title: 'Invoices', href: routes.portal.invoices, icon: 'Receipt' },
  { title: 'Payments', href: routes.portal.payments, icon: 'Banknote' },
  { title: 'Documents', href: routes.portal.documents, icon: 'FolderOpen' },
  { title: 'Disputes', href: routes.portal.disputes, icon: 'MessageSquareWarning' },
  { title: 'Reconciliation', href: routes.portal.reconciliation, icon: 'GitMerge' },
  { title: 'Compliance', href: routes.portal.compliance, icon: 'ShieldCheck' },
  { title: 'Settings', href: routes.portal.notificationSettings, icon: 'Settings' },
];

// Legacy flat navigation config for backwards compatibility
export const navigationConfig: NavItem[] = [
  {
    title: 'Dashboard',
    href: routes.dashboard,
    icon: 'LayoutDashboard',
  },
  {
    title: 'Finance',
    href: routes.finance.dashboard,
    icon: 'BookOpen',
    children: [
      { title: 'Journals', href: routes.finance.journals, icon: 'FileText' },
      { title: 'Payables', href: routes.finance.payables, icon: 'Receipt' },
      { title: 'Receivables', href: routes.finance.receivables, icon: 'HandCoins' },
      { title: 'Trial Balance', href: routes.finance.trialBalance, icon: 'Scale' },
      { title: 'Accounts', href: routes.finance.accounts, icon: 'List' },
      { title: 'Periods', href: routes.finance.periods, icon: 'Calendar' },
      { title: 'Ledgers', href: routes.finance.ledgers, icon: 'BookOpen' },
      { title: 'Intercompany', href: routes.finance.icTransactions, icon: 'ArrowLeftRight' },
      { title: 'Recurring', href: routes.finance.recurring, icon: 'RefreshCw' },
      { title: 'FX Rates', href: routes.finance.fxRates, icon: 'ArrowRightLeft' },
      { title: 'Reports', href: routes.finance.reports, icon: 'BarChart3' },
    ],
  },
  {
    title: 'Settings',
    href: routes.settings,
    icon: 'Settings',
  },
];
