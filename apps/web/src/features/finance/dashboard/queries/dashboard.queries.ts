import type {
  KPICard,
  CashFlowDataPoint,
  RevenueExpenseDataPoint,
  ActivityItem,
  AttentionItem,
  QuickAction,
  AgingBucket,
} from '../types';
import { routes } from '@/lib/constants';
import type { IdParam } from '@afenda/contracts';
import { createApiClient } from '@/lib/api-client';
import type { ApiResult } from '@/lib/types';

// ─── Dashboard Summary (root shell) ──────────────────────────────────────────

export interface DashboardSummary {
  cashBalance: number;
  openAr: { count: number; total: number };
  openAp: { count: number; total: number };
  currentPeriod: { id: string; name: string; status: string } | null;
  recentActivity: Array<{ id: string; eventType: string; createdAt: string; payload?: unknown }>;
}

type RequestCtx = { tenantId: IdParam['id']; userId?: string; token?: string };

export async function getDashboardSummary(ctx: RequestCtx): Promise<ApiResult<DashboardSummary>> {
  const client = createApiClient(ctx);
  return client.get<DashboardSummary>('/dashboard/summary');
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const mockKPIs: KPICard[] = [
  {
    id: 'cash',
    title: 'Cash Position',
    value: 2450000,
    formattedValue: '$2.45M',
    change: 125000,
    changePercent: 5.4,
    trend: 'up',
    trendIsGood: true,
    sparklineData: [180, 195, 205, 220, 245],
    href: routes.finance.cashForecasts,
  },
  {
    id: 'ar',
    title: 'Accounts Receivable',
    value: 1850000,
    formattedValue: '$1.85M',
    change: -50000,
    changePercent: -2.6,
    trend: 'down',
    trendIsGood: true,
    sparklineData: [210, 205, 195, 190, 185],
    href: routes.finance.receivables,
  },
  {
    id: 'ap',
    title: 'Accounts Payable',
    value: 980000,
    formattedValue: '$980K',
    change: 35000,
    changePercent: 3.7,
    trend: 'up',
    trendIsGood: false,
    sparklineData: [85, 88, 92, 95, 98],
    href: routes.finance.payables,
  },
  {
    id: 'net-income',
    title: 'Net Income (MTD)',
    value: 425000,
    formattedValue: '$425K',
    change: 75000,
    changePercent: 21.4,
    trend: 'up',
    trendIsGood: true,
    sparklineData: [32, 35, 38, 40, 42.5],
    href: routes.finance.incomeStatement,
  },
];

const mockCashFlow: CashFlowDataPoint[] = [
  { month: 'Jan', inflows: 520000, outflows: 380000, net: 140000 },
  { month: 'Feb', inflows: 480000, outflows: 420000, net: 60000 },
  { month: 'Mar', inflows: 550000, outflows: 390000, net: 160000 },
  { month: 'Apr', inflows: 620000, outflows: 450000, net: 170000 },
  { month: 'May', inflows: 580000, outflows: 410000, net: 170000 },
  { month: 'Jun', inflows: 640000, outflows: 480000, net: 160000 },
];

const mockRevenueExpenses: RevenueExpenseDataPoint[] = [
  { month: 'Jan', revenue: 520000, expenses: 380000, profit: 140000 },
  { month: 'Feb', revenue: 480000, expenses: 350000, profit: 130000 },
  { month: 'Mar', revenue: 550000, expenses: 370000, profit: 180000 },
  { month: 'Apr', revenue: 620000, expenses: 410000, profit: 210000 },
  { month: 'May', revenue: 580000, expenses: 390000, profit: 190000 },
  { month: 'Jun', revenue: 640000, expenses: 420000, profit: 220000 },
];

const mockARAgingBuckets: AgingBucket[] = [
  { range: 'Current', amount: 850000, count: 45 },
  { range: '1-30 days', amount: 520000, count: 28 },
  { range: '31-60 days', amount: 280000, count: 15 },
  { range: '61-90 days', amount: 120000, count: 8 },
  { range: '90+ days', amount: 80000, count: 6 },
];

const mockActivities: ActivityItem[] = [
  {
    id: 'act-1',
    type: 'journal_posted',
    title: 'Journal Entry Posted',
    description: 'JE-2026-002150 - Month-end accruals',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    user: 'Sarah Chen',
    href: routes.finance.journalDetail('je-2026-002150'),
    amount: 45000,
    currency: 'USD',
  },
  {
    id: 'act-2',
    type: 'payment_received',
    title: 'Payment Received',
    description: 'From Acme Corp - Invoice #INV-2026-0892',
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    href: routes.finance.receivableDetail('inv-2026-0892'),
    amount: 125000,
    currency: 'USD',
  },
  {
    id: 'act-3',
    type: 'approval_pending',
    title: 'Approval Required',
    description: 'AP Invoice from TechSupply Inc - $52,400',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    href: routes.finance.approvals,
    amount: 52400,
    currency: 'USD',
  },
  {
    id: 'act-4',
    type: 'invoice_created',
    title: 'Invoice Created',
    description: 'INV-2026-0945 for Global Enterprises',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    user: 'Mike Johnson',
    href: routes.finance.receivableDetail('inv-2026-0945'),
    amount: 78500,
    currency: 'USD',
  },
  {
    id: 'act-5',
    type: 'reconciliation_complete',
    title: 'Bank Reconciliation',
    description: 'Operating Account - February 2026',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    user: 'Lisa Wang',
    href: routes.finance.bankReconciliation,
  },
];

const mockAttentionItems: AttentionItem[] = [
  {
    id: 'att-1',
    title: '4 Invoices Past Due',
    description: 'Total overdue amount: $85,200',
    priority: 'critical',
    href: routes.finance.arAging,
    actionLabel: 'View AR Aging',
  },
  {
    id: 'att-2',
    title: '7 Pending Approvals',
    description: '2 items at risk of SLA breach',
    priority: 'high',
    dueDate: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    href: routes.finance.approvals,
    actionLabel: 'Review',
  },
  {
    id: 'att-3',
    title: 'Period Close Due',
    description: 'February 2026 close deadline approaching',
    priority: 'medium',
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    href: routes.finance.periods,
    actionLabel: 'View Periods',
  },
  {
    id: 'att-4',
    title: 'Bank Statement Import',
    description: '3 statements ready for reconciliation',
    priority: 'low',
    href: routes.finance.bankStatements,
    actionLabel: 'Import',
  },
];

const quickActions: QuickAction[] = [
  {
    id: 'new-journal',
    title: 'New Journal Entry',
    description: 'Create a manual journal',
    icon: 'FileText',
    href: routes.finance.journalNew,
    variant: 'primary',
  },
  {
    id: 'new-invoice',
    title: 'Create Invoice',
    description: 'Issue customer invoice',
    icon: 'Receipt',
    href: routes.finance.receivableNew,
  },
  {
    id: 'record-payment',
    title: 'Record Payment',
    description: 'Receive or send payment',
    icon: 'Banknote',
    href: routes.finance.payables,
  },
  {
    id: 'reconcile',
    title: 'Bank Reconciliation',
    description: 'Match bank transactions',
    icon: 'GitMerge',
    href: routes.finance.bankReconciliation,
  },
];

// ─── Query Functions ─────────────────────────────────────────────────────────

export async function getDashboardKPIs() {
  await new Promise((resolve) => setTimeout(resolve, 100));
  return { ok: true as const, data: mockKPIs };
}

export async function getCashFlowChart() {
  await new Promise((resolve) => setTimeout(resolve, 100));
  return { ok: true as const, data: mockCashFlow };
}

export async function getRevenueExpenseChart() {
  await new Promise((resolve) => setTimeout(resolve, 100));
  return { ok: true as const, data: mockRevenueExpenses };
}

export async function getARAgingChart() {
  await new Promise((resolve) => setTimeout(resolve, 100));
  return { ok: true as const, data: mockARAgingBuckets };
}

export async function getRecentActivity() {
  await new Promise((resolve) => setTimeout(resolve, 100));
  return { ok: true as const, data: mockActivities };
}

export async function getAttentionItems() {
  await new Promise((resolve) => setTimeout(resolve, 100));
  return { ok: true as const, data: mockAttentionItems };
}

export async function getQuickActions() {
  return { ok: true as const, data: quickActions };
}
