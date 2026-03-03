'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MoneyCell } from '@/components/erp/money-cell';
import { routes } from '@/lib/constants';
import { Receipt, Banknote, Users, ShieldAlert, FileUp, GitMerge, ClipboardCheck } from 'lucide-react';

interface ApSummary {
  openInvoices: number;
  totalOutstanding: string;
  currency: string;
  activeHolds: number;
  draftPaymentRuns: number;
  supplierCount: number;
}

interface ApDashboardSummaryProps {
  summary: ApSummary;
}

const QUICK_LINKS = [
  { label: 'Invoices', href: routes.finance.payables, icon: Receipt },
  { label: 'Payment Runs', href: routes.finance.paymentRuns, icon: Banknote },
  { label: 'Suppliers', href: routes.finance.suppliers, icon: Users },
  { label: 'Holds', href: routes.finance.holds, icon: ShieldAlert },
  { label: 'Batch Import', href: routes.finance.batchImport, icon: FileUp },
  { label: 'Recon', href: routes.finance.supplierRecon, icon: GitMerge },
  { label: 'Close Checklist', href: routes.finance.closeChecklist, icon: ClipboardCheck },
] as const;

export function ApDashboardSummary({ summary }: ApDashboardSummaryProps) {
  return (
    <div className="space-y-4">
      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Open Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">{summary.openInvoices}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <MoneyCell amount={summary.totalOutstanding} currency={summary.currency} showCode />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Active Holds</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">{summary.activeHolds}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Draft Runs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">{summary.draftPaymentRuns}</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick links */}
      <div className="flex flex-wrap gap-2">
        {QUICK_LINKS.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <Icon className="h-3.5 w-3.5"  aria-hidden="true" />
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
