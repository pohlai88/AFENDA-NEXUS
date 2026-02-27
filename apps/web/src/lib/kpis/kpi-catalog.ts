import { routes } from '@/lib/constants';

// ─── KPI Templates ──────────────────────────────────────────────────────────

export type KPITemplate =
  | 'value-trend'
  | 'value-sparkline'
  | 'ratio'
  | 'aging'
  | 'count-status'
  | 'stub';

// ─── KPI Catalog Entry ──────────────────────────────────────────────────────
// Template lives here (UI decision), NOT in resolver output.

export interface KPICatalogEntry {
  id: string;
  title: string;
  template: KPITemplate;
  format: 'money' | 'count' | 'percent' | 'text';
  href?: string;
}

// ─── Module KPI Catalogs ────────────────────────────────────────────────────

const FINANCE_CATALOG: KPICatalogEntry[] = [
  { id: 'fin.cash', title: 'Cash Position', template: 'value-trend', format: 'money', href: routes.finance.banking },
  { id: 'fin.ap', title: 'Accounts Payable', template: 'value-trend', format: 'money', href: routes.finance.payables },
  { id: 'fin.ar', title: 'Accounts Receivable', template: 'value-trend', format: 'money', href: routes.finance.receivables },
  { id: 'fin.pnl', title: 'Net Income (MTD)', template: 'value-trend', format: 'money', href: routes.finance.incomeStatement },
];

const FINANCE_AP_CATALOG: KPICatalogEntry[] = [
  { id: 'fin.ap.total', title: 'Total Payables', template: 'value-trend', format: 'money', href: routes.finance.payables },
  { id: 'fin.ap.aging', title: 'AP Aging', template: 'aging', format: 'money', href: routes.finance.apAging },
  { id: 'fin.ap.overdue', title: 'Overdue Invoices', template: 'count-status', format: 'count', href: routes.finance.payables },
  { id: 'fin.ap.pending', title: 'Pending Approval', template: 'count-status', format: 'count', href: routes.finance.approvals },
];

const FINANCE_AR_CATALOG: KPICatalogEntry[] = [
  { id: 'fin.ar.total', title: 'Total Receivables', template: 'value-trend', format: 'money', href: routes.finance.receivables },
  { id: 'fin.ar.aging', title: 'AR Aging', template: 'aging', format: 'money', href: routes.finance.arAging },
  { id: 'fin.ar.overdue', title: 'Overdue Invoices', template: 'count-status', format: 'count', href: routes.finance.receivables },
  { id: 'fin.ar.dso', title: 'Days Sales Outstanding', template: 'value-trend', format: 'count' },
];

const FINANCE_GL_CATALOG: KPICatalogEntry[] = [
  { id: 'fin.gl.journals', title: 'Journals (MTD)', template: 'count-status', format: 'count', href: routes.finance.journals },
  { id: 'fin.gl.unposted', title: 'Unposted Journals', template: 'count-status', format: 'count', href: routes.finance.journals },
  { id: 'fin.gl.trialBalance', title: 'Trial Balance', template: 'value-trend', format: 'money', href: routes.finance.trialBalance },
];

const FINANCE_BANKING_CATALOG: KPICatalogEntry[] = [
  { id: 'fin.bank.balance', title: 'Bank Balance', template: 'value-trend', format: 'money', href: routes.finance.banking },
  { id: 'fin.bank.unreconciled', title: 'Unreconciled Items', template: 'count-status', format: 'count', href: routes.finance.banking },
];

const HOME_CATALOG: KPICatalogEntry[] = [
  { id: 'home.activity', title: 'Recent Activity', template: 'count-status', format: 'count' },
];

const ADMIN_CATALOG: KPICatalogEntry[] = [
  { id: 'admin.tenants', title: 'Active Tenants', template: 'count-status', format: 'count', href: '/admin/tenants' },
  { id: 'admin.users', title: 'Total Users', template: 'count-status', format: 'count', href: '/admin/users' },
];

const STUB_CATALOG: KPICatalogEntry[] = [
  { id: 'stub.comingSoon', title: 'Coming Soon', template: 'stub', format: 'text' },
];

// ─── Catalog Lookup ─────────────────────────────────────────────────────────

const ALL_ENTRIES = [
  ...FINANCE_CATALOG,
  ...FINANCE_AP_CATALOG,
  ...FINANCE_AR_CATALOG,
  ...FINANCE_GL_CATALOG,
  ...FINANCE_BANKING_CATALOG,
  ...HOME_CATALOG,
  ...ADMIN_CATALOG,
  ...STUB_CATALOG,
];

const CATALOG_MAP = new Map(ALL_ENTRIES.map((e) => [e.id, e]));

const STUB_ENTRY: KPICatalogEntry = {
  id: 'unknown',
  title: 'Unknown',
  template: 'stub',
  format: 'text',
};

/**
 * Look up catalog entries for a list of KPI IDs.
 * Returns entries in the same order as the input IDs.
 */
export function getKPICatalogEntries(kpiIds: string[]): KPICatalogEntry[] {
  return kpiIds.map((id) => CATALOG_MAP.get(id) ?? { ...STUB_ENTRY, id });
}
