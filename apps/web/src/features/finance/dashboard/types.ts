// ─── Dashboard KPI Types ─────────────────────────────────────────────────────

export interface KPICard {
  id: string;
  title: string;
  value: string | number;
  formattedValue: string;
  change?: number;
  changePercent?: number;
  changeLabel?: string;
  trend?: 'up' | 'down' | 'flat';
  trendIsGood?: boolean;
  sparklineData?: number[];
  href?: string;
}

export interface DashboardMetrics {
  cashPosition: number;
  accountsReceivable: number;
  accountsPayable: number;
  netIncome: number;
  revenue: number;
  expenses: number;
  pendingApprovals: number;
  overdueInvoices: number;
}

// ─── Chart Data Types ────────────────────────────────────────────────────────

export interface CashFlowDataPoint {
  month: string;
  inflows: number;
  outflows: number;
  net: number;
}

export interface RevenueExpenseDataPoint {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
}

export interface AgingBucket {
  range: string;
  amount: number;
  count: number;
}

// ─── Activity Types ──────────────────────────────────────────────────────────

export type ActivityType =
  | 'journal_posted'
  | 'invoice_created'
  | 'payment_received'
  | 'payment_sent'
  | 'approval_pending'
  | 'reconciliation_complete'
  | 'period_closed'
  | 'report_generated';

export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: string;
  user?: string;
  href?: string;
  amount?: number;
  currency?: string;
}

// ─── Quick Action Types ──────────────────────────────────────────────────────

export interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  href: string;
  variant?: 'default' | 'primary';
}

// ─── Needs Attention Types ───────────────────────────────────────────────────

export type AttentionPriority = 'critical' | 'high' | 'medium' | 'low';

export interface AttentionItem {
  id: string;
  title: string;
  description: string;
  priority: AttentionPriority;
  dueDate?: string;
  href: string;
  actionLabel?: string;
}
