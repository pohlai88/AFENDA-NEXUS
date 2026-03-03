'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/erp/status-badge';
import { MoneyCell } from '@/components/erp/money-cell';
import { DateCell } from '@/components/erp/date-cell';
import { routes } from '@/lib/constants';
import {
  Receipt,
  AlertTriangle,
  CheckCircle,
  Clock,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  MessageSquareWarning,
} from 'lucide-react';
import type {
  PortalDashboardSummary,
  PortalAgingBucket,
  PortalComplianceItem,
  PortalInvoiceListItem,
  PortalDispute,
} from '../queries/portal.queries';

// ─── Metric Cards ──────────────────────────────────────────────────────────

interface MetricCardProps {
  title: string;
  count: number;
  amount: string;
  currencyCode: string;
  icon: React.ElementType;
  iconClassName?: string;
}

function MetricCard({
  title,
  count,
  amount,
  currencyCode,
  icon: Icon,
  iconClassName,
}: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={cn('h-4 w-4 text-muted-foreground', iconClassName)} aria-hidden="true" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{count}</div>
        <p className="text-xs text-muted-foreground">
          <MoneyCell amount={amount} currency={currencyCode} showCode />
        </p>
      </CardContent>
    </Card>
  );
}

// ─── Aging Breakdown ───────────────────────────────────────────────────────

function AgingBreakdown({ buckets }: { buckets: PortalAgingBucket[] }) {
  if (buckets.length === 0) return null;

  const maxAmount = Math.max(...buckets.map((b) => parseFloat(b.totalAmount) || 0), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Aging Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {buckets.map((bucket) => {
            const amount = parseFloat(bucket.totalAmount) || 0;
            const pct = (amount / maxAmount) * 100;
            return (
              <div key={bucket.label} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{bucket.label}</span>
                  <span className="font-mono text-xs">
                    {bucket.count} inv &middot;{' '}
                    <MoneyCell amount={bucket.totalAmount} currency={bucket.currencyCode} />
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Compliance Summary ────────────────────────────────────────────────────

function ComplianceIcon({ status }: { status: string }) {
  switch (status) {
    case 'VALID':
    case 'ACTIVE':
      return <ShieldCheck className="h-4 w-4 text-success" aria-label="Valid" />;
    case 'EXPIRING_SOON':
      return <ShieldAlert className="h-4 w-4 text-warning" aria-label="Expiring soon" />;
    case 'EXPIRED':
    case 'MISSING':
      return <ShieldX className="h-4 w-4 text-destructive" aria-label="Expired or missing" />;
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" aria-label={status} />;
  }
}

function CompliancePanel({ items }: { items: PortalComplianceItem[] }) {
  if (items.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Compliance Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-2 text-sm">
              <ComplianceIcon status={item.status} />
              <span className="flex-1">{item.label ?? item.itemType}</span>
              <StatusBadge status={item.status} showIcon={false} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Recent Invoices ───────────────────────────────────────────────────────

function RecentInvoices({ invoices }: { invoices: PortalInvoiceListItem[] }) {
  if (invoices.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Recent Invoices</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {invoices.slice(0, 5).map((inv) => (
            <Link
              key={inv.id}
              href={routes.portal.invoiceDetail(inv.id)}
              className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-accent"
            >
              <div className="flex items-center gap-2">
                <Receipt className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                <span className="font-mono text-xs">{inv.invoiceNumber}</span>
                <StatusBadge status={inv.status} showIcon={false} />
              </div>
              <MoneyCell amount={inv.totalAmount} currency={inv.currencyCode} />
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Open Disputes ─────────────────────────────────────────────────────────

function OpenDisputes({ disputes }: { disputes: PortalDispute[] }) {
  if (disputes.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Open Disputes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {disputes.slice(0, 5).map((d) => (
            <Link
              key={d.id}
              href={routes.portal.disputeDetail(d.id)}
              className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-accent"
            >
              <div className="flex items-center gap-2">
                <MessageSquareWarning
                  className="h-3.5 w-3.5 text-muted-foreground"
                  aria-hidden="true"
                />
                <span className="truncate max-w-[200px]">{d.subject}</span>
                <StatusBadge status={d.status} showIcon={false} />
              </div>
              <span className="text-xs text-muted-foreground">
                <DateCell date={d.createdAt} format="relative" />
              </span>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────

interface PortalDashboardProps {
  data: PortalDashboardSummary;
}

export function PortalDashboard({ data }: PortalDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title="Open Invoices"
          count={data.openInvoiceCount}
          amount={data.openInvoiceAmount}
          currencyCode={data.currencyCode}
          icon={Receipt}
        />
        <MetricCard
          title="Overdue"
          count={data.overdueInvoiceCount}
          amount={data.overdueInvoiceAmount}
          currencyCode={data.currencyCode}
          icon={AlertTriangle}
          iconClassName="text-destructive"
        />
        <MetricCard
          title="Paid (Last 30 Days)"
          count={data.paidLast30Count}
          amount={data.paidLast30Amount}
          currencyCode={data.currencyCode}
          icon={CheckCircle}
          iconClassName="text-success"
        />
      </div>

      {/* Aging + Compliance row */}
      <div className="grid gap-4 md:grid-cols-2">
        <AgingBreakdown buckets={data.aging} />
        <CompliancePanel items={data.compliance.items} />
      </div>

      {/* Recent + Disputes row */}
      <div className="grid gap-4 md:grid-cols-2">
        <RecentInvoices invoices={data.recentInvoices} />
        <OpenDisputes disputes={data.openDisputes} />
      </div>
    </div>
  );
}
