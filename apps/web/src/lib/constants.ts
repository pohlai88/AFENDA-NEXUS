import type { JournalStatus, ApInvoiceStatus, ArInvoiceStatus } from "@afenda/contracts";

// ─── Route Paths ────────────────────────────────────────────────────────────

export const routes = {
  home: "/",
  login: "/login",
  dashboard: "/dashboard",
  finance: {
    journals: "/finance/journals",
    journalDetail: (id: string) => `/finance/journals/${id}`,
    journalNew: "/finance/journals/new",
    trialBalance: "/finance/trial-balance",
    accounts: "/finance/accounts",
    periods: "/finance/periods",
    reports: "/finance/reports",
  },
  settings: "/settings",
} as const;

// ─── Status Colors (maps to shadcn Badge variants) ─────────────────────────

type DocumentStatus = JournalStatus | ApInvoiceStatus | ArInvoiceStatus | string;

export const statusConfig: Record<
  string,
  { variant: "default" | "secondary" | "destructive" | "outline"; label: string }
> = {
  DRAFT: { variant: "secondary", label: "Draft" },
  POSTED: { variant: "default", label: "Posted" },
  REVERSED: { variant: "outline", label: "Reversed" },
  VOIDED: { variant: "destructive", label: "Voided" },
  PENDING_APPROVAL: { variant: "outline", label: "Pending Approval" },
  APPROVED: { variant: "default", label: "Approved" },
  PAID: { variant: "default", label: "Paid" },
  PARTIALLY_PAID: { variant: "outline", label: "Partially Paid" },
  CANCELLED: { variant: "destructive", label: "Cancelled" },
  WRITTEN_OFF: { variant: "destructive", label: "Written Off" },
  OPEN: { variant: "default", label: "Open" },
  CLOSED: { variant: "secondary", label: "Closed" },
  LOCKED: { variant: "outline", label: "Locked" },
};

export function getStatusConfig(status: DocumentStatus) {
  return statusConfig[status] ?? { variant: "secondary" as const, label: status };
}

// ─── Currency Config ────────────────────────────────────────────────────────

export const currencyConfig: Record<string, { symbol: string; decimals: number }> = {
  USD: { symbol: "$", decimals: 2 },
  EUR: { symbol: "€", decimals: 2 },
  GBP: { symbol: "£", decimals: 2 },
  MYR: { symbol: "RM", decimals: 2 },
  JPY: { symbol: "¥", decimals: 0 },
  SGD: { symbol: "S$", decimals: 2 },
};

// ─── Navigation Config ──────────────────────────────────────────────────────

export interface NavItem {
  title: string;
  href: string;
  icon: string;
  children?: NavItem[];
}

export const navigationConfig: NavItem[] = [
  {
    title: "Dashboard",
    href: "/",
    icon: "LayoutDashboard",
  },
  {
    title: "Finance",
    href: "/finance",
    icon: "BookOpen",
    children: [
      { title: "Journals", href: "/finance/journals", icon: "FileText" },
      { title: "Trial Balance", href: "/finance/trial-balance", icon: "Scale" },
      { title: "Accounts", href: "/finance/accounts", icon: "List" },
      { title: "Periods", href: "/finance/periods", icon: "Calendar" },
      { title: "Reports", href: "/finance/reports", icon: "BarChart3" },
    ],
  },
  {
    title: "Settings",
    href: "/settings",
    icon: "Settings",
  },
];
