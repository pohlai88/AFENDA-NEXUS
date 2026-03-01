import type { SearchAction } from './search.types';
import { routes } from '@/lib/constants';

// ─── Action Registry ─────────────────────────────────────────────────────────
//
// Central registry for quick actions rendered in the command palette and the
// sidebar Quick Actions picker.
//
// Actions are categorised using CRUD types so the picker can group them:
//   create  → "New …" forms (POST endpoints)
//   view    → List/detail pages (GET endpoints)
//   manage  → Operational pages (approve, reconcile, run, close)
//   report  → Read-only analytical views
//   utility → In-app actions (keyboard shortcuts, theme toggle, etc.)
//
// ─────────────────────────────────────────────────────────────────────────────

/** Mutable registry of quick actions. */
const actions = new Map<string, SearchAction>();

/**
 * Register a quick action. Overwrites any existing action with the same id.
 */
export function registerAction(action: SearchAction): void {
  actions.set(action.id, action);
}

/**
 * Unregister a quick action.
 */
export function unregisterAction(id: string): void {
  actions.delete(id);
}

/**
 * Get all registered actions. Optionally filtered by active module scope.
 */
export function getActions(activeModuleId?: string): SearchAction[] {
  const all = Array.from(actions.values());
  if (!activeModuleId) return all;
  return all.filter((a) => !a.scope || a.scope === activeModuleId);
}

/**
 * Fuzzy-search actions by title. Case-insensitive substring match.
 */
export function searchActions(query: string, activeModuleId?: string): SearchAction[] {
  const q = query.toLowerCase().trim();
  if (!q) return getActions(activeModuleId);

  return getActions(activeModuleId).filter((a) =>
    a.title.toLowerCase().includes(q),
  );
}

// ─── CRUD Action Catalog ─────────────────────────────────────────────────────
//
// Comprehensive catalog of pinnable actions derived from OpenAPI operations
// and route constants. Grouped by CRUD category so the Quick Actions picker
// can present them in meaningful sections.
//

const DEFAULT_ACTIONS: SearchAction[] = [
  // ── Create (POST) ──────────────────────────────────────────────────────
  {
    id: 'create-journal',
    title: 'New Journal Entry',
    icon: 'FilePlus2',
    category: 'create',
    shortcut: 'g n j',
    scope: 'finance',
    href: routes.finance.journalNew,
  },
  {
    id: 'create-ap-invoice',
    title: 'New AP Invoice',
    icon: 'FileText',
    category: 'create',
    scope: 'finance',
    href: routes.finance.payableNew,
  },
  {
    id: 'create-ar-invoice',
    title: 'New AR Invoice',
    icon: 'HandCoins',
    category: 'create',
    scope: 'finance',
    href: routes.finance.receivableNew,
  },
  {
    id: 'create-supplier',
    title: 'New Supplier',
    icon: 'UserPlus',
    category: 'create',
    scope: 'finance',
    href: routes.finance.supplierNew,
  },
  {
    id: 'create-expense',
    title: 'New Expense Claim',
    icon: 'Receipt',
    category: 'create',
    scope: 'finance',
    href: routes.finance.expenseNew,
  },
  {
    id: 'create-budget',
    title: 'New Budget Entry',
    icon: 'PiggyBank',
    category: 'create',
    scope: 'finance',
    href: `${routes.finance.budgetEntries  }/new`,
  },
  {
    id: 'create-account',
    title: 'New Account',
    icon: 'List',
    category: 'create',
    scope: 'finance',
    href: routes.finance.accountNew,
  },
  {
    id: 'create-ledger',
    title: 'New Ledger',
    icon: 'BookOpen',
    category: 'create',
    scope: 'finance',
    href: routes.finance.ledgerNew,
  },
  {
    id: 'create-recurring',
    title: 'New Recurring Template',
    icon: 'RefreshCw',
    category: 'create',
    scope: 'finance',
    href: routes.finance.recurringNew,
  },
  {
    id: 'create-payment-run',
    title: 'New Payment Run',
    icon: 'Banknote',
    category: 'create',
    scope: 'finance',
    href: routes.finance.paymentRunNew,
  },
  {
    id: 'create-credit-memo',
    title: 'New Credit Memo',
    icon: 'FileText',
    category: 'create',
    scope: 'finance',
    href: routes.finance.creditMemoNew,
  },
  {
    id: 'create-debit-memo',
    title: 'New Debit Memo',
    icon: 'FileText',
    category: 'create',
    scope: 'finance',
    href: routes.finance.debitMemoNew,
  },
  {
    id: 'create-dunning',
    title: 'New Dunning Letter',
    icon: 'Bell',
    category: 'create',
    scope: 'finance',
    href: routes.finance.dunningNew,
  },
  {
    id: 'create-fixed-asset',
    title: 'New Fixed Asset',
    icon: 'Building',
    category: 'create',
    scope: 'finance',
    href: routes.finance.fixedAssetNew,
  },
  {
    id: 'create-intangible',
    title: 'New Intangible Asset',
    icon: 'Sparkles',
    category: 'create',
    scope: 'finance',
    href: routes.finance.intangibleNew,
  },
  {
    id: 'create-project',
    title: 'New Project',
    icon: 'FolderPlus',
    category: 'create',
    scope: 'finance',
    href: routes.finance.projectNew,
  },
  {
    id: 'create-cost-center',
    title: 'New Cost Center',
    icon: 'Target',
    category: 'create',
    scope: 'finance',
    href: routes.finance.costCenterNew,
  },
  {
    id: 'create-lease',
    title: 'New Lease (IFRS 16)',
    icon: 'Key',
    category: 'create',
    scope: 'finance',
    href: routes.finance.leaseNew,
  },
  {
    id: 'create-provision',
    title: 'New Provision (IAS 37)',
    icon: 'ShieldAlert',
    category: 'create',
    scope: 'finance',
    href: routes.finance.provisionNew,
  },
  {
    id: 'create-instrument',
    title: 'New Financial Instrument',
    icon: 'TrendingUp',
    category: 'create',
    scope: 'finance',
    href: routes.finance.instrumentNew,
  },
  {
    id: 'create-hedge',
    title: 'New Hedge Relationship',
    icon: 'Shield',
    category: 'create',
    scope: 'finance',
    href: routes.finance.hedgeNew,
  },
  {
    id: 'create-deferred-tax',
    title: 'New Deferred Tax Item',
    icon: 'Calculator',
    category: 'create',
    scope: 'finance',
    href: routes.finance.deferredTaxNew,
  },
  {
    id: 'create-cash-forecast',
    title: 'New Cash Forecast',
    icon: 'TrendingUp',
    category: 'create',
    scope: 'finance',
    href: routes.finance.cashForecastNew,
  },
  {
    id: 'create-credit-limit',
    title: 'New Credit Limit',
    icon: 'Shield',
    category: 'create',
    scope: 'finance',
    href: routes.finance.creditNew,
  },
  {
    id: 'create-revenue-contract',
    title: 'New Revenue Contract (IFRS 15)',
    icon: 'FileSignature',
    category: 'create',
    scope: 'finance',
    href: routes.finance.revenueContractNew,
  },
  {
    id: 'create-transfer-pricing',
    title: 'New Transfer Pricing Policy',
    icon: 'ArrowLeftRight',
    category: 'create',
    scope: 'finance',
    href: routes.finance.transferPricingNew,
  },
  {
    id: 'create-fx-rate',
    title: 'New FX Rate',
    icon: 'ArrowRightLeft',
    category: 'create',
    scope: 'finance',
    href: routes.finance.fxRateNew,
  },
  {
    id: 'create-tax-code',
    title: 'New Tax Code',
    icon: 'Percent',
    category: 'create',
    scope: 'finance',
    href: routes.finance.taxCodeNew,
  },
  {
    id: 'create-ic-transaction',
    title: 'New Intercompany Transaction',
    icon: 'ArrowLeftRight',
    category: 'create',
    scope: 'finance',
    href: routes.finance.icTransactionNew,
  },

  // ── View / Open (GET) ─────────────────────────────────────────────────
  {
    id: 'view-journals',
    title: 'Journal Entries',
    icon: 'FileText',
    category: 'view',
    scope: 'finance',
    href: routes.finance.journals,
  },
  {
    id: 'view-accounts',
    title: 'Chart of Accounts',
    icon: 'List',
    category: 'view',
    shortcut: 'g a',
    scope: 'finance',
    href: routes.finance.accounts,
  },
  {
    id: 'view-ap-invoices',
    title: 'AP Invoices',
    icon: 'Receipt',
    category: 'view',
    scope: 'finance',
    href: routes.finance.payables,
  },
  {
    id: 'view-ar-invoices',
    title: 'AR Invoices',
    icon: 'HandCoins',
    category: 'view',
    scope: 'finance',
    href: routes.finance.receivables,
  },
  {
    id: 'view-suppliers',
    title: 'Supplier Master',
    icon: 'Users',
    category: 'view',
    scope: 'finance',
    href: routes.finance.suppliers,
  },
  {
    id: 'view-periods',
    title: 'Fiscal Periods',
    icon: 'Calendar',
    category: 'view',
    shortcut: 'g p',
    scope: 'finance',
    href: routes.finance.periods,
  },
  {
    id: 'view-ledgers',
    title: 'Ledgers',
    icon: 'BookOpen',
    category: 'view',
    shortcut: 'g l',
    scope: 'finance',
    href: routes.finance.ledgers,
  },
  {
    id: 'view-fixed-assets',
    title: 'Fixed Assets',
    icon: 'Building',
    category: 'view',
    scope: 'finance',
    href: routes.finance.fixedAssets,
  },
  {
    id: 'view-expenses',
    title: 'Expense Claims',
    icon: 'Receipt',
    category: 'view',
    shortcut: 'g x',
    scope: 'finance',
    href: routes.finance.expenses,
  },
  {
    id: 'view-projects',
    title: 'Projects',
    icon: 'Folder',
    category: 'view',
    scope: 'finance',
    href: routes.finance.projects,
  },
  {
    id: 'view-cost-centers',
    title: 'Cost Centers',
    icon: 'Target',
    category: 'view',
    scope: 'finance',
    href: routes.finance.costCenters,
  },
  {
    id: 'view-tax-codes',
    title: 'Tax Codes',
    icon: 'Percent',
    category: 'view',
    scope: 'finance',
    href: routes.finance.taxCodes,
  },
  {
    id: 'view-banking',
    title: 'Banking & Statements',
    icon: 'Landmark',
    category: 'view',
    shortcut: 'g b',
    scope: 'finance',
    href: routes.finance.banking,
  },
  {
    id: 'view-treasury',
    title: 'Treasury',
    icon: 'Vault',
    category: 'view',
    scope: 'finance',
    href: routes.finance.treasury,
  },
  {
    id: 'view-leases',
    title: 'Lease Accounting',
    icon: 'Key',
    category: 'view',
    scope: 'finance',
    href: routes.finance.leases,
  },
  {
    id: 'view-ic-transactions',
    title: 'Intercompany Transactions',
    icon: 'ArrowLeftRight',
    category: 'view',
    scope: 'finance',
    href: routes.finance.icTransactions,
  },

  // ── Manage (operational workflows) ────────────────────────────────────
  {
    id: 'manage-approvals',
    title: 'Pending Approvals',
    icon: 'CheckCircle',
    category: 'manage',
    scope: 'finance',
    href: routes.finance.approvals,
  },
  {
    id: 'manage-payment-runs',
    title: 'Payment Runs',
    icon: 'Banknote',
    category: 'manage',
    scope: 'finance',
    href: routes.finance.paymentRuns,
  },
  {
    id: 'manage-reconciliation',
    title: 'Bank Reconciliation',
    icon: 'GitMerge',
    category: 'manage',
    scope: 'finance',
    href: routes.finance.bankReconciliation,
  },
  {
    id: 'manage-depreciation',
    title: 'Depreciation Runs',
    icon: 'TrendingDown',
    category: 'manage',
    scope: 'finance',
    href: routes.finance.depreciationRuns,
  },
  {
    id: 'manage-allocation-runs',
    title: 'Cost Allocation Runs',
    icon: 'Split',
    category: 'manage',
    scope: 'finance',
    href: routes.finance.allocationRuns,
  },
  {
    id: 'manage-consolidation',
    title: 'Consolidation Run',
    icon: 'Layers',
    category: 'manage',
    scope: 'finance',
    href: routes.finance.consolidationRun,
  },
  {
    id: 'manage-recurring',
    title: 'Process Recurring Templates',
    icon: 'RefreshCw',
    category: 'manage',
    scope: 'finance',
    href: routes.finance.recurring,
  },
  {
    id: 'manage-ap-holds',
    title: 'Invoice Holds',
    icon: 'PauseCircle',
    category: 'manage',
    scope: 'finance',
    href: routes.finance.holds,
  },
  {
    id: 'manage-dunning',
    title: 'Dunning Management',
    icon: 'Bell',
    category: 'manage',
    scope: 'finance',
    href: routes.finance.dunning,
  },
  {
    id: 'manage-credit-reviews',
    title: 'Credit Reviews',
    icon: 'Shield',
    category: 'manage',
    scope: 'finance',
    href: routes.finance.creditReviews,
  },
  {
    id: 'manage-tax-returns',
    title: 'Tax Returns',
    icon: 'FileCheck',
    category: 'manage',
    scope: 'finance',
    href: routes.finance.taxReturns,
  },
  {
    id: 'manage-lease-period',
    title: 'Run Lease Period',
    icon: 'Key',
    category: 'manage',
    scope: 'finance',
    href: routes.finance.leaseRunPeriod,
  },
  {
    id: 'manage-ap-close',
    title: 'AP Period Close Checklist',
    icon: 'ClipboardCheck',
    category: 'manage',
    scope: 'finance',
    href: routes.finance.closeChecklist,
  },

  // ── Report (read-only analytics) ──────────────────────────────────────
  {
    id: 'report-trial-balance',
    title: 'Trial Balance',
    icon: 'Scale',
    category: 'report',
    scope: 'finance',
    href: routes.finance.trialBalance,
  },
  {
    id: 'report-balance-sheet',
    title: 'Balance Sheet',
    icon: 'BarChart3',
    category: 'report',
    scope: 'finance',
    href: routes.finance.balanceSheet,
  },
  {
    id: 'report-income-statement',
    title: 'Income Statement',
    icon: 'BarChart3',
    category: 'report',
    scope: 'finance',
    href: routes.finance.incomeStatement,
  },
  {
    id: 'report-cash-flow',
    title: 'Cash Flow Statement',
    icon: 'TrendingUp',
    category: 'report',
    scope: 'finance',
    href: routes.finance.cashFlow,
  },
  {
    id: 'report-budget-variance',
    title: 'Budget Variance',
    icon: 'Target',
    category: 'report',
    scope: 'finance',
    href: routes.finance.budgetVariance,
  },
  {
    id: 'report-ap-aging',
    title: 'AP Aging Report',
    icon: 'Clock',
    category: 'report',
    scope: 'finance',
    href: routes.finance.apAging,
  },
  {
    id: 'report-ar-aging',
    title: 'AR Aging Report',
    icon: 'Clock',
    category: 'report',
    scope: 'finance',
    href: routes.finance.arAging,
  },
  {
    id: 'report-equity',
    title: 'Statement of Equity',
    icon: 'BarChart3',
    category: 'report',
    scope: 'finance',
    href: routes.finance.equityStatement,
  },
  {
    id: 'report-tax-summary',
    title: 'Tax Summary',
    icon: 'FileCheck',
    category: 'report',
    scope: 'finance',
    href: routes.finance.taxSummary,
  },
  {
    id: 'report-asset-register',
    title: 'Asset Register',
    icon: 'Building',
    category: 'report',
    scope: 'finance',
    href: routes.finance.assetRegister,
  },
  {
    id: 'report-cost-allocation',
    title: 'Cost Allocation Report',
    icon: 'Split',
    category: 'report',
    scope: 'finance',
    href: routes.finance.costAllocation,
  },

  // ── Utility (in-app actions) ──────────────────────────────────────────
  {
    id: 'open-keyboard-shortcuts',
    title: 'Open Keyboard Shortcuts',
    icon: 'Keyboard',
    category: 'utility',
    shortcut: '?',
  },
  {
    id: 'open-calculator',
    title: 'Open Calculator',
    icon: 'Calculator',
    category: 'utility',
    shortcut: 'Ctrl+=',
  },
];

// Register defaults on module load
for (const action of DEFAULT_ACTIONS) {
  registerAction(action);
}
