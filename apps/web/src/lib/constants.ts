import type { JournalStatus, ApInvoiceStatus, ArInvoiceStatus } from '@afenda/contracts';

// ─── Route Paths ────────────────────────────────────────────────────────────

export const routes = {
  home: '/',
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  onboarding: '/onboarding',
  verifyEmail: '/verify-email',
  acceptInvite: '/accept-invite',
  dashboard: '/',
  finance: {
    // Dashboard & Overview
    root: '/finance' as const,
    dashboard: '/finance',
    approvals: '/finance/approvals',

    // Sub-domain dashboard pages
    glDashboard: '/finance/general-ledger',
    apDashboard: '/finance/accounts-payable',
    arDashboard: '/finance/accounts-receivable',
    assetsDashboard: '/finance/asset-accounting',
    travelDashboard: '/finance/travel-expenses',
    bankingDashboard: '/finance/banking-liquidity',
    treasuryDashboard: '/finance/treasury',
    controllingDashboard: '/finance/controlling',
    taxDashboard: '/finance/tax-compliance',
    intercompanyDashboard: '/finance/intercompany',
    ifrsDashboard: '/finance/ifrs-standards',
    consolidationDashboard: '/finance/consolidation',
    paymentsDashboard: '/finance/payments',
    settingsDashboard: '/finance/finance-settings',
    reportsDashboard: '/finance/financial-reports',

    // Payments
    payments: '/finance/payments',
    paymentDetail: (id: string) => `/finance/payments/${id}`,

    // Budgets
    budgetEntries: '/finance/budgets',
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
    payables: '/finance/accounts-payable/payables',
    payableDetail: (id: string) => `/finance/accounts-payable/payables/${id}`,
    payableNew: '/finance/accounts-payable/payables/new',
    payablePay: (id: string) => `/finance/accounts-payable/payables/${id}/pay`,

    // AP Payment Runs
    paymentRuns: '/finance/accounts-payable/payables/payment-runs',
    paymentRunDetail: (id: string) => `/finance/accounts-payable/payables/payment-runs/${id}`,
    paymentRunNew: '/finance/accounts-payable/payables/payment-runs/new',
    paymentRunItems: (id: string) => `/finance/accounts-payable/payables/payment-runs/${id}/items`,
    paymentRunRemittance: (id: string) =>
      `/finance/accounts-payable/payables/payment-runs/${id}/remittance`,
    paymentRunRejection: (id: string) =>
      `/finance/accounts-payable/payables/payment-runs/${id}/rejection`,

    // AP Suppliers
    suppliers: '/finance/accounts-payable/payables/suppliers',
    supplierDetail: (id: string) => `/finance/accounts-payable/payables/suppliers/${id}`,
    supplierNew: '/finance/accounts-payable/payables/suppliers/new',

    // AP Holds
    holds: '/finance/accounts-payable/payables/holds',
    duplicates: '/finance/accounts-payable/payables/duplicates',

    // AP Triage
    triage: '/finance/accounts-payable/payables/triage',

    // AP Match Tolerances
    matchTolerances: '/finance/accounts-payable/payables/match-tolerances',

    // AP Prepayments
    prepayments: '/finance/accounts-payable/payables/prepayments',
    prepaymentDetail: (id: string) => `/finance/accounts-payable/payables/prepayments/${id}`,

    // AP Capture Extras
    creditMemoNew: '/finance/accounts-payable/payables/credit-memos/new',
    debitMemoNew: '/finance/accounts-payable/payables/debit-memos/new',
    batchImport: '/finance/accounts-payable/payables/import',
    supplierRecon: '/finance/accounts-payable/payables/reconciliation',
    closeChecklist: '/finance/accounts-payable/payables/close-checklist',

    // Accounts Receivable
    receivables: '/finance/receivables',
    receivableDetail: (id: string) => `/finance/receivables/${id}`,
    receivableNew: '/finance/receivables/new',
    receivableAllocate: (id: string) => `/finance/receivables/${id}/allocate`,
    receivableAllocations: '/finance/receivables/allocations',

    // AR Dunning
    dunning: '/finance/receivables/dunning',
    dunningNew: '/finance/receivables/dunning/new',
    dunningDetail: (id: string) => `/finance/receivables/dunning/${id}`,

    // Intercompany
    icTransactions: '/finance/intercompany',
    icTransactionDetail: (id: string) => `/finance/intercompany/${id}`,
    icTransactionNew: '/finance/intercompany/new',

    // FX & Rates
    fxRates: '/finance/fx-rates',
    fxRateNew: '/finance/fx-rates/new',

    // Banking & Reconciliation
    banking: '/finance/banking',
    bankStatements: '/finance/banking/statements',
    bankStatementsList: '/finance/banking/statements',
    bankStatementImport: '/finance/banking/import',
    bankReconciliation: '/finance/banking/reconciliation',
    bankReconciliationDetail: (id: string) => `/finance/banking/reconcile/${id}`,
    bankRules: '/finance/banking/rules',

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
    whtReport: '/finance/reports/wht',

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
    groupEntities: '/finance/consolidation#entities',
    groupEntityDetail: (id: string) => `/finance/consolidation/entities/${id}`,
    ownership: '/finance/consolidation#ownership',
    goodwill: '/finance/consolidation#goodwill',
    eliminations: '/finance/consolidation#eliminations',

    // Transfer Pricing
    transferPricing: '/finance/transfer-pricing',
    transferPricingDetail: (id: string) => `/finance/transfer-pricing/${id}`,
    transferPricingNew: '/finance/transfer-pricing/new',
    transferPricingPolicies: '/finance/transfer-pricing/policies',
    transferPricingBenchmarks: '/finance/transfer-pricing/benchmarks',

    // Revenue Recognition (IFRS 15)
    revenueRecognition: '/finance/revenue-recognition',
    revenueContractNew: '/finance/revenue-recognition/new',
    revenueContractDetail: (id: string) => `/finance/revenue-recognition/${id}`,

    // Finance Settings
    financeSettings: '/finance/settings',
    paymentTerms: '/finance/settings/payment-terms',
    paymentTermsDetail: (id: string) => `/finance/settings/payment-terms/${id}`,
    matchTolerance: '/finance/settings/matching',
    matchToleranceNew: '/finance/settings/matching/new',

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
  /** Sales orders (used by credit hold release) */
  salesOrders: '/sales/orders',
  settings: '/settings',
  settingsOrganization: '/settings/organization',
  settingsOrgConfig: '/settings/organization/config',
  settingsMembers: '/settings/members',
  settingsMembersInvite: '/settings/members/invite',
  settingsPreferences: '/settings/preferences',
  settingsAuditLog: '/settings/audit-log',

  // Platform Admin
  admin: {
    config: '/admin/config',
    tenants: '/admin/tenants',
    tenantDetail: (id: string) => `/admin/tenants/${id}`,
    users: '/admin/users',
    actions: '/admin/actions',
    audit: '/admin/audit',
  },

  // HRM Module
  hrm: {
    dashboard: '/hrm',
    employees: '/hrm/employees',
    attendance: '/hrm/attendance',
    leave: '/hrm/leave',
    payroll: '/hrm/payroll',
    recruitment: '/hrm/recruitment',
    performance: '/hrm/performance',
    training: '/hrm/training',
    orgChart: '/hrm/org-chart',
  },

  // CRM Module
  crm: {
    dashboard: '/crm',
    contacts: '/crm/contacts',
    leads: '/crm/leads',
    opportunities: '/crm/opportunities',
    accounts: '/crm/accounts',
    campaigns: '/crm/campaigns',
    pipeline: '/crm/pipeline',
    activities: '/crm/activities',
  },

  // Boardroom Module
  boardroom: {
    dashboard: '/boardroom',
    announcements: '/boardroom/announcements',
    meetings: '/boardroom/meetings',
    polls: '/boardroom/polls',
    documents: '/boardroom/documents',
    calendar: '/boardroom/calendar',
    teamChat: '/boardroom/chat',
  },

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
    cases: '/portal/cases',
    caseNew: '/portal/cases/new',
    caseDetail: (id: string) => `/portal/cases/${id}`,
    onboarding: '/portal/onboarding',
    reconciliation: '/portal/reconciliation',
    wht: '/portal/wht',
    whtDetail: (id: string) => `/portal/wht/${id}`,
    compliance: '/portal/compliance',
    complianceAlerts: '/portal/compliance/alerts',
    complianceTimeline: '/portal/compliance/timeline',
    activity: '/portal/activity',
    company: '/portal/company',
    directory: '/portal/directory',
    notificationSettings: '/portal/settings/notifications',
    apiSettings: '/portal/settings/api',
    messages: '/portal/messages',
    messageThread: (threadId: string) => `/portal/messages/${threadId}`,
    escalations: '/portal/escalations',
    escalationDetail: (escalationId: string) => `/portal/escalations/${escalationId}`,
    announcements: '/portal/announcements',
    verification: '/portal/verification',
    appointments: '/portal/appointments',
    appointmentNew: '/portal/appointments/new',
    appointmentDetail: (id: string) => `/portal/appointments/${id}`,
    earlyPayments: '/portal/payments/early-payment',
    earlyPaymentDetail: (id: string) => `/portal/payments/early-payment/${id}`,
    creditDebitNoteNew: '/portal/invoices/credit-debit-note/new',
    resolution: (invoiceId: string) => `/portal/invoices/${invoiceId}/resolution`,
    customer: '/portal/customer',
    investor: '/portal/investor',
    franchisee: '/portal/franchisee',
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
  /** Stable feature ID for module map matching (e.g., 'gl', 'ap', 'ar') */
  featureId?: string;
  title: string;
  icon: string;
  /** Link to the sub-domain dashboard page (e.g. '/finance/general-ledger') */
  href?: string;
  items: NavItem[];
  collapsible?: boolean;
  /** Dashboard shortcut card metadata (optional override) */
  shortcut?: {
    title?: string;
    description?: string;
    icon?: string;
    maxItems?: number;
  };
}

/**
 * Finance navigation groups — SAP/Oracle-style SOD (Separation of Duties).
 *
 * Each group maps to a distinct functional team / responsibility centre:
 *   FI-GL  → General Ledger (Controller / GL Accountant)
 *   FI-AP  → Accounts Payable (AP Clerk / AP Manager)
 *   FI-AR  → Accounts Receivable (AR Clerk / Credit Controller)
 *   FI-AA  → Asset Accounting (Asset Accountant)
 *   FI-TV  → Travel & Expenses (Submitters / Approvers)
 *   TR     → Treasury (Treasurer / Cash Manager)
 *   CO     → Controlling / Cost Accounting (Cost Accountant)
 *   FI-LC  → Consolidation (Group Accountant)
 *   FI-TX  → Tax & Compliance (Tax Manager)
 *   FI-BL  → Banking & Liquidity (Bank Accountant)
 *   EC-CS  → IFRS Compliance (Technical Accountant)
 *   IC     → Intercompany (IC Accountant)
 *   FI-RP  → Financial Reports (All readers)
 */
export const financeNavigationGroups: NavGroup[] = [
  // ── Overview (cross-functional) ───────────────────────────────────────
  {
    featureId: 'overview',
    title: 'Overview',
    icon: 'LayoutDashboard',
    href: routes.finance.dashboard,
    items: [
      { title: 'Dashboard', href: routes.finance.dashboard, icon: 'LayoutDashboard' },
      { title: 'Approvals', href: routes.finance.approvals, icon: 'CheckCircle' },
    ],
  },

  // ── FI-GL: General Ledger ─────────────────────────────────────────────
  {
    featureId: 'gl',
    title: 'General Ledger (FI-GL)',
    icon: 'BookOpen',
    href: routes.finance.glDashboard,
    collapsible: true,
    shortcut: { description: 'Chart of Accounts, journals, periods' },
    items: [
      { title: 'Chart of Accounts', href: routes.finance.accounts, icon: 'List' },
      { title: 'Journal Entries', href: routes.finance.journals, icon: 'FileText' },
      { title: 'Recurring Journals', href: routes.finance.recurring, icon: 'RefreshCw' },
      { title: 'Ledgers', href: routes.finance.ledgers, icon: 'BookOpen' },
      { title: 'Fiscal Periods', href: routes.finance.periods, icon: 'Calendar' },
      { title: 'Trial Balance', href: routes.finance.trialBalance, icon: 'Scale' },
      { title: 'Budget Entries', href: routes.finance.budgetEntries, icon: 'Target' },
    ],
  },

  // ── FI-AP: Accounts Payable ───────────────────────────────────────────
  {
    featureId: 'ap',
    title: 'Accounts Payable (FI-AP)',
    icon: 'Receipt',
    href: routes.finance.apDashboard,
    collapsible: true,
    shortcut: { description: 'Invoice processing, payment runs, suppliers' },
    items: [
      { title: 'AP Invoices', href: routes.finance.payables, icon: 'Receipt' },
      { title: 'Credit Memos', href: routes.finance.creditMemoNew, icon: 'FileText' },
      { title: 'Debit Memos', href: routes.finance.debitMemoNew, icon: 'FileText' },
      { title: 'Payment Runs', href: routes.finance.paymentRuns, icon: 'Banknote' },
      { title: 'Prepayments', href: routes.finance.prepayments, icon: 'CreditCard' },
      { title: 'Supplier Master', href: routes.finance.suppliers, icon: 'Users' },
      { title: 'Invoice Holds', href: routes.finance.holds, icon: 'PauseCircle' },
      { title: 'Duplicate Review', href: routes.finance.duplicates, icon: 'Copy' },
      { title: 'Triage Queue', href: routes.finance.triage, icon: 'AlertCircle' },
      { title: 'Match Tolerances', href: routes.finance.matchTolerances, icon: 'Settings2' },
      { title: 'AP Aging', href: routes.finance.apAging, icon: 'Clock' },
    ],
  },

  // ── FI-AR: Accounts Receivable ────────────────────────────────────────
  {
    featureId: 'ar',
    title: 'Accounts Receivable (FI-AR)',
    icon: 'HandCoins',
    href: routes.finance.arDashboard,
    collapsible: true,
    shortcut: { description: 'Customer invoices, collections, credit control' },
    items: [
      { title: 'AR Invoices', href: routes.finance.receivables, icon: 'HandCoins' },
      { title: 'Credit Limits', href: routes.finance.creditLimits, icon: 'Shield' },
      { title: 'Dunning', href: routes.finance.dunning, icon: 'Bell' },
      { title: 'Payment Allocation', href: routes.finance.receivableAllocations, icon: 'GitMerge' },
      { title: 'AR Aging', href: routes.finance.arAging, icon: 'Clock' },
    ],
  },

  // ── FI-AA: Asset Accounting ───────────────────────────────────────────
  {
    featureId: 'assets',
    title: 'Asset Accounting (FI-AA)',
    icon: 'Building',
    href: routes.finance.assetsDashboard,
    collapsible: true,
    shortcut: { description: 'Fixed assets, depreciation, disposals' },
    items: [
      { title: 'Asset Master', href: routes.finance.fixedAssets, icon: 'Building' },
      { title: 'Depreciation Runs', href: routes.finance.depreciationRuns, icon: 'TrendingDown' },
      { title: 'Intangible Assets', href: routes.finance.intangibles, icon: 'Sparkles' },
      { title: 'Asset Disposals', href: routes.finance.assetDisposals, icon: 'Trash2' },
      { title: 'Asset Register', href: routes.finance.assetRegister, icon: 'Package' },
    ],
  },

  // ── FI-TV: Travel & Expenses ──────────────────────────────────────────
  {
    featureId: 'travel',
    title: 'Travel & Expenses (FI-TV)',
    icon: 'Wallet',
    href: routes.finance.travelDashboard,
    collapsible: true,
    shortcut: { description: 'Expense claims, policies, reimbursement' },
    items: [
      { title: 'My Claims', href: routes.finance.expensesMine, icon: 'User' },
      { title: 'All Claims', href: routes.finance.expenses, icon: 'Users' },
      { title: 'Expense Policies', href: routes.finance.expensePolicies, icon: 'Shield' },
    ],
  },

  // ── FI-BL: Banking & Liquidity ────────────────────────────────────────
  {
    featureId: 'banking',
    title: 'Banking & Liquidity (FI-BL)',
    icon: 'Landmark',
    href: routes.finance.bankingDashboard,
    collapsible: true,
    shortcut: { description: 'Bank statements, reconciliation, rules' },
    items: [
      { title: 'Bank Statements', href: routes.finance.bankStatements, icon: 'FileSpreadsheet' },
      { title: 'Reconciliation', href: routes.finance.bankReconciliation, icon: 'GitMerge' },
      { title: 'Matching Rules', href: routes.finance.bankRules, icon: 'Settings2' },
    ],
  },

  // ── TR: Treasury ──────────────────────────────────────────────────────
  {
    featureId: 'treasury',
    title: 'Treasury (TR)',
    icon: 'Vault',
    href: routes.finance.treasuryDashboard,
    collapsible: true,
    shortcut: { description: 'Cash forecasts, covenants, FX, loans' },
    items: [
      { title: 'Cash Forecasts', href: routes.finance.cashForecasts, icon: 'TrendingUp' },
      { title: 'Loans & Facilities', href: routes.finance.icLoans, icon: 'ArrowLeftRight' },
      { title: 'Covenants', href: routes.finance.covenants, icon: 'FileWarning' },
      { title: 'FX Rates', href: routes.finance.fxRates, icon: 'ArrowRightLeft' },
    ],
  },

  // ── CO: Controlling / Cost Accounting ─────────────────────────────────
  {
    featureId: 'controlling',
    title: 'Controlling (CO)',
    icon: 'PieChart',
    href: routes.finance.controllingDashboard,
    collapsible: true,
    shortcut: { description: 'Cost centers, projects, allocations' },
    items: [
      { title: 'Cost Centers', href: routes.finance.costCenters, icon: 'PieChart' },
      { title: 'Projects', href: routes.finance.projects, icon: 'FolderKanban' },
      { title: 'Allocation Runs', href: routes.finance.allocationRuns, icon: 'Workflow' },
      { title: 'Cost Allocation Report', href: routes.finance.costAllocation, icon: 'BarChart3' },
    ],
  },

  // ── FI-TX: Tax & Compliance ───────────────────────────────────────────
  {
    featureId: 'tax',
    title: 'Tax & Compliance (FI-TX)',
    icon: 'FileCheck',
    href: routes.finance.taxDashboard,
    collapsible: true,
    shortcut: { description: 'Tax codes, returns, WHT certificates' },
    items: [
      { title: 'Tax Codes', href: routes.finance.taxCodes, icon: 'Hash' },
      { title: 'Tax Returns', href: routes.finance.taxReturns, icon: 'FileSignature' },
      { title: 'WHT Certificates', href: routes.finance.whtCertificates, icon: 'Award' },
      { title: 'Tax Summary', href: routes.finance.taxSummary, icon: 'FileCheck' },
    ],
  },

  // ── IC: Intercompany ──────────────────────────────────────────────────
  {
    featureId: 'intercompany',
    title: 'Intercompany (IC)',
    icon: 'Network',
    href: routes.finance.intercompanyDashboard,
    collapsible: true,
    shortcut: { description: 'IC transactions, transfer pricing' },
    items: [
      { title: 'IC Transactions', href: routes.finance.icTransactions, icon: 'ArrowLeftRight' },
      { title: 'Transfer Pricing', href: routes.finance.transferPricing, icon: 'Calculator' },
      { title: 'IC Aging', href: routes.finance.icAging, icon: 'Clock' },
    ],
  },

  // ── EC-CS: IFRS Compliance ────────────────────────────────────────────
  {
    featureId: 'ifrs',
    title: 'IFRS & Standards (EC-CS)',
    icon: 'ShieldCheck',
    href: routes.finance.ifrsDashboard,
    collapsible: true,
    shortcut: { description: 'Lease, provision, hedge, instrument accounting' },
    items: [
      { title: 'Leases (IFRS 16)', href: routes.finance.leases, icon: 'Key' },
      { title: 'Provisions (IAS 37)', href: routes.finance.provisions, icon: 'AlertCircle' },
      { title: 'Instruments (IFRS 9)', href: routes.finance.instruments, icon: 'Banknote' },
      { title: 'Hedges (IFRS 9)', href: routes.finance.hedges, icon: 'Umbrella' },
      { title: 'Deferred Tax (IAS 12)', href: routes.finance.deferredTax, icon: 'Clock' },
      {
        title: 'Revenue Recognition (IFRS 15)',
        href: routes.finance.revenueRecognition,
        icon: 'BarChart3',
      },
    ],
  },

  // ── FI-LC: Consolidation ──────────────────────────────────────────────
  {
    featureId: 'consolidation',
    title: 'Consolidation (FI-LC)',
    icon: 'GitBranch',
    href: routes.finance.consolidationDashboard,
    collapsible: true,
    shortcut: { description: 'Group entities, eliminations, goodwill' },
    items: [
      { title: 'Group Entities', href: routes.finance.groupEntities, icon: 'Building2' },
      { title: 'Ownership Structure', href: routes.finance.ownership, icon: 'Users' },
      { title: 'Eliminations', href: routes.finance.eliminations, icon: 'MinusCircle' },
      { title: 'Goodwill', href: routes.finance.goodwill, icon: 'Star' },
      {
        title: 'Consolidation Report',
        href: routes.finance.consolidationReport,
        icon: 'GitBranch',
      },
    ],
  },

  // ── FI-PM: Payments ───────────────────────────────────────────────────
  {
    featureId: 'payments',
    title: 'Payments (FI-PM)',
    icon: 'Banknote',
    href: routes.finance.paymentsDashboard,
    collapsible: true,
    shortcut: { description: 'Centralized payment management hub' },
    items: [{ title: 'Payments Hub', href: routes.finance.payments, icon: 'Banknote' }],
  },

  // ── FI-CFG: Finance Settings ────────────────────────────────────────────
  {
    featureId: 'settings',
    title: 'Finance Settings (FI-CFG)',
    icon: 'Settings',
    href: routes.finance.settingsDashboard,
    collapsible: true,
    shortcut: { description: 'Payment terms, match tolerances, policies' },
    items: [
      { title: 'Settings Hub', href: routes.finance.financeSettings, icon: 'Settings' },
      { title: 'Payment Terms', href: routes.finance.paymentTerms, icon: 'Timer' },
      { title: 'Match Tolerances', href: routes.finance.matchTolerance, icon: 'SlidersHorizontal' },
    ],
  },

  // ── FI-RP: Financial Reports ──────────────────────────────────────────
  {
    featureId: 'reports',
    title: 'Financial Reports (FI-RP)',
    icon: 'BarChart3',
    href: routes.finance.reportsDashboard,
    collapsible: true,
    shortcut: { description: 'Statutory & management reports' },
    items: [
      { title: 'Balance Sheet', href: routes.finance.balanceSheet, icon: 'Scale' },
      { title: 'Income Statement', href: routes.finance.incomeStatement, icon: 'TrendingUp' },
      { title: 'Cash Flow Statement', href: routes.finance.cashFlow, icon: 'Banknote' },
      { title: 'Equity Statement', href: routes.finance.equityStatement, icon: 'PieChart' },
      { title: 'Budget Variance', href: routes.finance.budgetVariance, icon: 'Target' },
    ],
  },
];

// ─── Portal Navigation Config ────────────────────────────────────────────────

export const portalNavigationItems: NavItem[] = [
  { title: 'Dashboard', href: routes.portal.dashboard, icon: 'LayoutDashboard' },
  { title: 'Invoices', href: routes.portal.invoices, icon: 'Receipt' },
  { title: 'Payments', href: routes.portal.payments, icon: 'Banknote' },
  { title: 'Documents', href: routes.portal.documents, icon: 'FolderOpen' },
  { title: 'Cases', href: routes.portal.cases, icon: 'Inbox' },
  { title: 'Bank Accounts', href: routes.portal.bankAccounts, icon: 'Landmark' },
  { title: 'Profile', href: routes.portal.profile, icon: 'UserCog' },
  { title: 'WHT Certificates', href: routes.portal.wht, icon: 'FileText' },
  { title: 'Reconciliation', href: routes.portal.reconciliation, icon: 'GitMerge' },
  { title: 'Compliance', href: routes.portal.compliance, icon: 'ShieldCheck' },
  { title: 'Activity', href: routes.portal.activity, icon: 'ClipboardList' },
  { title: 'Company Locations', href: routes.portal.company, icon: 'Building' },
  { title: 'Directory', href: routes.portal.directory, icon: 'Users' },
  { title: 'Settings', href: routes.portal.notificationSettings, icon: 'Settings' },
  { title: 'API & Webhooks', href: routes.portal.apiSettings, icon: 'Webhook' },
  { title: 'Messages', href: routes.portal.messages, icon: 'MessageSquare' },
  { title: 'Escalations', href: routes.portal.escalations, icon: 'Siren' },
  { title: 'Announcements', href: routes.portal.announcements, icon: 'Megaphone' },
  { title: 'Verification', href: routes.portal.verification, icon: 'ShieldCheck' },
  { title: 'Appointments', href: routes.portal.appointments, icon: 'CalendarClock' },
];

// ─── HRM Navigation Config ──────────────────────────────────────────────────

export const hrmNavigationGroups: NavGroup[] = [
  {
    title: 'Overview',
    icon: 'LayoutDashboard',
    items: [{ title: 'Dashboard', href: routes.hrm.dashboard, icon: 'LayoutDashboard' }],
  },
  {
    title: 'People',
    icon: 'Users',
    collapsible: true,
    shortcut: { description: 'Manage your workforce' },
    items: [
      { title: 'Employees', href: routes.hrm.employees, icon: 'User' },
      { title: 'Org Chart', href: routes.hrm.orgChart, icon: 'Network' },
      { title: 'Attendance', href: routes.hrm.attendance, icon: 'Calendar' },
      { title: 'Leave', href: routes.hrm.leave, icon: 'Clock' },
    ],
  },
  {
    title: 'Compensation',
    icon: 'Banknote',
    collapsible: true,
    shortcut: { description: 'Payroll & benefits' },
    items: [{ title: 'Payroll', href: routes.hrm.payroll, icon: 'Banknote' }],
  },
  {
    title: 'Talent',
    icon: 'Star',
    collapsible: true,
    shortcut: { description: 'Recruitment & development' },
    items: [
      { title: 'Recruitment', href: routes.hrm.recruitment, icon: 'Target' },
      { title: 'Performance', href: routes.hrm.performance, icon: 'TrendingUp' },
      { title: 'Training', href: routes.hrm.training, icon: 'BookOpen' },
    ],
  },
];

// ─── CRM Navigation Config ──────────────────────────────────────────────────

export const crmNavigationGroups: NavGroup[] = [
  {
    title: 'Overview',
    icon: 'LayoutDashboard',
    items: [{ title: 'Dashboard', href: routes.crm.dashboard, icon: 'LayoutDashboard' }],
  },
  {
    title: 'Sales Pipeline',
    icon: 'TrendingUp',
    collapsible: true,
    shortcut: { description: 'Track deals & opportunities' },
    items: [
      { title: 'Leads', href: routes.crm.leads, icon: 'Target' },
      { title: 'Opportunities', href: routes.crm.opportunities, icon: 'TrendingUp' },
      { title: 'Pipeline', href: routes.crm.pipeline, icon: 'Workflow' },
    ],
  },
  {
    title: 'Relationships',
    icon: 'Users',
    collapsible: true,
    shortcut: { description: 'Contacts & accounts' },
    items: [
      { title: 'Contacts', href: routes.crm.contacts, icon: 'User' },
      { title: 'Accounts', href: routes.crm.accounts, icon: 'Building2' },
      { title: 'Activities', href: routes.crm.activities, icon: 'Clock' },
    ],
  },
  {
    title: 'Marketing',
    icon: 'Sparkles',
    collapsible: true,
    shortcut: { description: 'Campaigns & outreach' },
    items: [{ title: 'Campaigns', href: routes.crm.campaigns, icon: 'Sparkles' }],
  },
];

// ─── Boardroom Navigation Config ────────────────────────────────────────────

export const boardroomNavigationGroups: NavGroup[] = [
  {
    title: 'Overview',
    icon: 'LayoutDashboard',
    items: [{ title: 'Dashboard', href: routes.boardroom.dashboard, icon: 'LayoutDashboard' }],
  },
  {
    title: 'Communication',
    icon: 'MessageSquare',
    collapsible: true,
    shortcut: { description: 'Team communication' },
    items: [
      { title: 'Announcements', href: routes.boardroom.announcements, icon: 'FileText' },
      { title: 'Team Chat', href: routes.boardroom.teamChat, icon: 'MessageSquare' },
      { title: 'Polls', href: routes.boardroom.polls, icon: 'BarChart3' },
    ],
  },
  {
    title: 'Collaboration',
    icon: 'FolderKanban',
    collapsible: true,
    shortcut: { description: 'Meetings & documents' },
    items: [
      { title: 'Meetings', href: routes.boardroom.meetings, icon: 'Calendar' },
      { title: 'Documents', href: routes.boardroom.documents, icon: 'FolderKanban' },
      { title: 'Calendar', href: routes.boardroom.calendar, icon: 'Calendar' },
    ],
  },
];

// ─── Settings Navigation Config ─────────────────────────────────────────────

export const settingsNavigationGroups: NavGroup[] = [
  {
    title: 'Organization',
    icon: 'Building2',
    items: [
      { title: 'Organization', href: routes.settingsOrganization, icon: 'Building2' },
      { title: 'Members', href: routes.settingsMembers, icon: 'Users' },
    ],
  },
  {
    title: 'Preferences',
    icon: 'Settings',
    items: [
      { title: 'Preferences', href: routes.settingsPreferences, icon: 'Settings' },
      { title: 'Audit Log', href: routes.settingsAuditLog, icon: 'ScrollText' },
    ],
  },
];

// ─── Admin Navigation Config ────────────────────────────────────────────────

export const adminNavigationGroups: NavGroup[] = [
  {
    title: 'Platform',
    icon: 'ShieldCheck',
    items: [
      { title: 'System Config', href: routes.admin.config, icon: 'Settings' },
      { title: 'Tenants', href: routes.admin.tenants, icon: 'Building2' },
      { title: 'Users', href: routes.admin.users, icon: 'Users' },
      { title: 'Actions', href: routes.admin.actions, icon: 'Workflow' },
      { title: 'Audit', href: routes.admin.audit, icon: 'ScrollText' },
    ],
  },
];

// Legacy flat navigation config for backwards compatibility
/**
 * @deprecated Use `computeVisibleModulesWithNav()` from `@/lib/modules/module-definitions.server`
 * or the `modules` prop passed through `AppShell` instead. This export is only retained
 * for the constants test suite and will be removed in a future cleanup.
 */
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
      { title: 'Invoices (AP)', href: routes.finance.payables, icon: 'Receipt' },
      { title: 'Payment Runs', href: routes.finance.paymentRuns, icon: 'Banknote' },
      { title: 'Suppliers', href: routes.finance.suppliers, icon: 'Users' },
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
    children: [
      { title: 'Organization', href: routes.settingsOrganization, icon: 'Building2' },
      { title: 'Members', href: routes.settingsMembers, icon: 'Users' },
      { title: 'Preferences', href: routes.settingsPreferences, icon: 'SlidersHorizontal' },
      { title: 'Audit Log', href: routes.settingsAuditLog, icon: 'ScrollText' },
    ],
  },
];
