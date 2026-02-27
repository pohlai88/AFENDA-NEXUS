'use client';

import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { DataTable, type Column } from '@/components/erp/data-table';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { routes } from '@/lib/constants';
import { FileText, Upload, Play, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import type { BankStatement, StatementStatus, StatementSource } from '../types';
import { statementStatusConfig } from '../types';

// ─── Source Badge ────────────────────────────────────────────────────────────

const sourceLabels: Record<StatementSource, string> = {
  manual: 'Manual',
  ofx: 'OFX',
  csv: 'CSV',
  api: 'API',
};

function SourceBadge({ source }: { source: StatementSource }) {
  return (
    <Badge variant="outline" className="text-xs">
      {sourceLabels[source]}
    </Badge>
  );
}

// ─── Status Badge ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: StatementStatus }) {
  const config = statementStatusConfig[status];
  const icons: Record<StatementStatus, typeof CheckCircle> = {
    pending: Clock,
    in_progress: Play,
    reconciled: CheckCircle,
    closed: AlertCircle,
  };
  const Icon = icons[status];

  return (
    <Badge className={cn('gap-1', config.color)}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

// ─── Match Progress ──────────────────────────────────────────────────────────

function MatchProgress({ matched, total }: { matched: number; total: number }) {
  const percentage = total > 0 ? (matched / total) * 100 : 0;

  return (
    <div className="space-y-1 w-32">
      <div className="flex items-center justify-between text-xs">
        <span>
          {matched}/{total}
        </span>
        <span className="text-muted-foreground">{Math.round(percentage)}%</span>
      </div>
      <Progress value={percentage} className="h-1.5" />
    </div>
  );
}

// ─── Columns ─────────────────────────────────────────────────────────────────

const columns: Column<BankStatement>[] = [
  {
    key: 'statementDate',
    header: 'Statement Date',
    sortable: true,
    render: (statement) => (
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-muted-foreground" />
        <div>
          <div className="font-medium">{formatDate(statement.statementDate)}</div>
          <div className="text-xs text-muted-foreground">
            {formatDate(statement.startDate)} - {formatDate(statement.endDate)}
          </div>
        </div>
      </div>
    ),
  },
  {
    key: 'bankAccountName',
    header: 'Bank Account',
    sortable: true,
    render: (statement) => <div className="font-medium">{statement.bankAccountName}</div>,
  },
  {
    key: 'closingBalance',
    header: 'Closing Balance',
    sortable: true,
    className: 'text-right',
    render: (statement) => (
      <div className="text-right font-mono">
        {formatCurrency(statement.closingBalance, statement.currency)}
      </div>
    ),
  },
  {
    key: 'transactionCount',
    header: 'Transactions',
    sortable: true,
    className: 'text-center',
    render: (statement) => <div className="text-center">{statement.transactionCount}</div>,
  },
  {
    key: 'matchedCount',
    header: 'Match Progress',
    render: (statement) => (
      <MatchProgress matched={statement.matchedCount} total={statement.transactionCount} />
    ),
  },
  {
    key: 'source',
    header: 'Source',
    render: (statement) => <SourceBadge source={statement.source} />,
  },
  {
    key: 'status',
    header: 'Status',
    sortable: true,
    render: (statement) => <StatusBadge status={statement.status} />,
  },
  {
    key: 'actions',
    header: '',
    className: 'w-[100px]',
    render: (statement) => (
      <div className="flex items-center justify-end">
        {statement.status === 'pending' || statement.status === 'in_progress' ? (
          <Button size="sm" variant="outline">
            Reconcile
          </Button>
        ) : (
          <Button size="sm" variant="ghost">
            View
          </Button>
        )}
      </div>
    ),
  },
];

// ─── Statements Table ────────────────────────────────────────────────────────

interface StatementsTableProps {
  statements: BankStatement[];
  pagination?: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

export function StatementsTable({ statements, pagination }: StatementsTableProps) {
  const router = useRouter();

  const handleRowClick = (statement: BankStatement) => {
    if (statement.status === 'pending' || statement.status === 'in_progress') {
      router.push(`${routes.finance.banking}/reconcile/${statement.id}`);
    } else {
      router.push(`${routes.finance.banking}/statements/${statement.id}`);
    }
  };

  return (
    <DataTable
      data={statements}
      columns={columns}
      keyField="id"
      onRowClick={handleRowClick}
      pagination={pagination}
      emptyState={{
        key: 'finance.banking.statements',
        icon: FileText,
        action: {
          label: 'Import Statement',
          href: `${routes.finance.banking}/import`,
        },
      }}
      actions={
        <Button asChild>
          <a href={`${routes.finance.banking}/import`}>
            <Upload className="mr-2 h-4 w-4" />
            Import Statement
          </a>
        </Button>
      }
    />
  );
}
