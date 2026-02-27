import type { ClientModuleWithNav } from '@/lib/modules/types';

// ─── Breadcrumb Type ─────────────────────────────────────────────────────────

export interface Breadcrumb {
  label: string;
  href?: string;
}

// ─── Segment → Label Registry ───────────────────────────────────────────────
//
// Static mapping derived from the navigation groups in constants.ts.
// Keys are URL segments; values are human-readable labels.
// Dynamic `[id]` segments are skipped entirely by deriveBreadcrumbs().

const SEGMENT_LABELS: Record<string, string> = {
  // ── Top-level modules ──
  finance: 'Finance',
  hrm: 'Human Resources',
  crm: 'CRM',
  boardroom: 'Boardroom',
  settings: 'Settings',
  admin: 'Admin',
  portal: 'Supplier Portal',

  // ── Finance — General Ledger ──
  approvals: 'Approvals',
  journals: 'Journal Entries',
  accounts: 'Chart of Accounts',
  ledgers: 'Ledgers',
  periods: 'Periods',
  'trial-balance': 'Trial Balance',
  recurring: 'Recurring Entries',

  // ── Finance — Payables & Receivables ──
  payables: 'Accounts Payable',
  'payment-runs': 'Payment Runs',
  suppliers: 'Suppliers',
  holds: 'Holds',
  'credit-memos': 'Credit Memos',
  'debit-memos': 'Debit Memos',
  receivables: 'Accounts Receivable',
  payments: 'Payments',

  // ── Finance — Budgets ──
  budgets: 'Budgets',
  transfers: 'Transfers',

  // ── Finance — Intercompany & FX ──
  intercompany: 'Intercompany',
  'fx-rates': 'FX Rates',

  // ── Finance — Banking ──
  banking: 'Banking',
  statements: 'Statements',
  reconcile: 'Reconcile',

  // ── Finance — Tax ──
  tax: 'Tax & Compliance',
  codes: 'Tax Codes',
  rates: 'Tax Rates',
  returns: 'Tax Returns',
  'wht-certificates': 'WHT Certificates',
  wht: 'Withholding Tax',

  // ── Finance — Assets ──
  'fixed-assets': 'Fixed Assets',
  depreciation: 'Depreciation',
  'depreciation-runs': 'Depreciation Runs',
  disposals: 'Disposals',
  intangibles: 'Intangible Assets',

  // ── Finance — Expenses ──
  expenses: 'Expense Claims',
  mine: 'My Claims',
  policies: 'Policies',

  // ── Finance — Projects & Cost ──
  projects: 'Projects',
  billing: 'Billing',
  wip: 'Work in Progress',
  'cost-centers': 'Cost Centers',
  drivers: 'Cost Drivers',
  'allocation-runs': 'Allocation Runs',
  allocations: 'Allocations',

  // ── Finance — Treasury ──
  treasury: 'Treasury',
  forecasts: 'Cash Forecasts',
  covenants: 'Covenants',
  'ic-loans': 'IC Loans',
  loans: 'Loans',

  // ── Finance — Credit ──
  credit: 'Credit Limits',
  reviews: 'Reviews',

  // ── Finance — IFRS ──
  leases: 'Leases (IFRS 16)',
  provisions: 'Provisions (IAS 37)',
  instruments: 'Financial Instruments',
  hedging: 'Hedges (IFRS 9)',
  effectiveness: 'Effectiveness',
  'deferred-tax': 'Deferred Tax',

  // ── Finance — Consolidation ──
  consolidation: 'Consolidation',
  entities: 'Group Entities',
  'transfer-pricing': 'Transfer Pricing',
  benchmarks: 'Benchmarks',

  // ── Finance — Reports ──
  reports: 'Reports',
  'balance-sheet': 'Balance Sheet',
  'income-statement': 'Income Statement',
  'cash-flow': 'Cash Flow',
  'equity-statement': 'Equity Statement',
  'ap-aging': 'AP Aging',
  'ar-aging': 'AR Aging',
  'ic-aging': 'IC Aging',
  'budget-variance': 'Budget Variance',
  'asset-register': 'Asset Register',
  'tax-summary': 'Tax Summary',
  'cost-allocation': 'Cost Allocation',

  // ── Settings ──
  organization: 'Organization',
  config: 'Configuration',
  members: 'Members',
  invite: 'Invite',
  preferences: 'Preferences',
  'audit-log': 'Audit Log',

  // ── Admin ──
  tenants: 'Tenants',
  users: 'Users',
  actions: 'Actions',
  audit: 'Audit',

  // ── HRM ──
  employees: 'Employees',
  attendance: 'Attendance',
  leave: 'Leave',
  payroll: 'Payroll',
  recruitment: 'Recruitment',
  performance: 'Performance',
  training: 'Training',
  'org-chart': 'Org Chart',

  // ── CRM ──
  contacts: 'Contacts',
  leads: 'Leads',
  opportunities: 'Opportunities',
  campaigns: 'Campaigns',
  pipeline: 'Pipeline',
  activities: 'Activities',

  // ── Boardroom ──
  announcements: 'Announcements',
  meetings: 'Meetings',
  polls: 'Polls',
  documents: 'Documents',
  calendar: 'Calendar',
  chat: 'Team Chat',

  // ── Supplier Portal ──
  invoices: 'Invoices',
  submit: 'Submit',
  profile: 'Profile',
  'bank-accounts': 'Bank Accounts',
  disputes: 'Disputes',
  compliance: 'Compliance',
  notifications: 'Notifications',

  // ── Action verbs (generic) ──
  new: 'New',
  edit: 'Edit',
  pay: 'Pay',
  allocate: 'Allocate',
  modify: 'Modify',
  run: 'Run',
  recalculate: 'Recalculate',
  import: 'Import',
  reconciliation: 'Reconciliation',
  'close-checklist': 'Close Checklist',
  items: 'Items',
  remittance: 'Remittance',
  rejection: 'Rejection',
  summary: 'Summary',
  'run-period': 'Run Period',
};

/** UUID v4 pattern (or any 8+ hex/dash segment) — safe to skip in breadcrumbs. */
const DYNAMIC_SEGMENT_RE = /^[0-9a-f]{8,}(?:-[0-9a-f]{4,}){0,4}$/i;

/** Route groups that should be stripped from the breadcrumb path. */
const ROUTE_GROUPS = new Set(['(shell)', '(auth)', '(public)', '(portal)']);

// ─── Core Function ──────────────────────────────────────────────────────────

/**
 * Derive breadcrumbs from a pathname.
 *
 * Rules:
 * - Route groups like `(shell)` are stripped.
 * - Dynamic `[id]` segments (UUIDs) are skipped entirely.
 * - Up to `maxVisible` crumbs are returned; deeper routes are ellipsized.
 * - If a `pageBreadcrumb` is provided (from `usePageBreadcrumb()`), it
 *   replaces the last segment with a human-readable label.
 */
export function deriveBreadcrumbs(
  pathname: string,
  _modules?: ClientModuleWithNav[],
  options?: { pageBreadcrumb?: string; maxVisible?: number },
): Breadcrumb[] {
  const maxVisible = options?.maxVisible ?? 4;
  const pageBreadcrumb = options?.pageBreadcrumb;

  // Split and clean segments
  const rawSegments = pathname.split('/').filter(Boolean);
  const segments = rawSegments.filter((s) => !ROUTE_GROUPS.has(s));

  if (segments.length === 0) return [];

  // Build breadcrumbs from segments
  const crumbs: Breadcrumb[] = [];
  let hrefAccumulator = '';

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]!;

    // Always include every segment in the href to maintain correct paths,
    // even for dynamic [id] segments we don't render as visible crumbs.
    hrefAccumulator += `/${seg}`;

    // Skip dynamic IDs (UUIDs) — don't show "8f3a..." in breadcrumbs
    if (DYNAMIC_SEGMENT_RE.test(seg)) continue;

    const label = SEGMENT_LABELS[seg] ?? titleCase(seg);

    crumbs.push({ label, href: hrefAccumulator });
  }

  // Mark the last crumb as the current page (no href) and apply pageBreadcrumb override
  if (crumbs.length > 0) {
    const last = crumbs[crumbs.length - 1]!;
    last.href = undefined;
    if (pageBreadcrumb) last.label = pageBreadcrumb;
  }

  if (crumbs.length === 0) return [];

  // Trim to maxVisible — keep first + last, ellipsis in between
  if (crumbs.length > maxVisible) {
    const first = crumbs[0]!;
    const last = crumbs.slice(-(maxVisible - 1));
    return [first, ...last];
  }

  return crumbs;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function titleCase(s: string): string {
  return s
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
