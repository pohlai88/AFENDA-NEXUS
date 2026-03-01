'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DataTable, type Column } from '@/components/erp/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Plus, Calculator, FileText, RotateCcw } from 'lucide-react';
import type { AllocationRun, AllocationStatus, AllocationMethod } from '../types';
import { allocationStatusConfig, allocationMethodLabels } from '../types';
import { routes } from '@/lib/constants';

function StatusBadge({ status }: { status: AllocationStatus }) {
  const config = allocationStatusConfig[status];
  return (
    <Badge variant="outline" className={config.color}>
      {config.label}
    </Badge>
  );
}

function MethodBadge({ method }: { method: AllocationMethod }) {
  return (
    <Badge variant="secondary" className="text-xs">
      {allocationMethodLabels[method]}
    </Badge>
  );
}

interface AllocationRunsTableProps {
  runs: AllocationRun[];
}

export function AllocationRunsTable({ runs }: AllocationRunsTableProps) {
  const router = useRouter();

  const columns: Column<AllocationRun>[] = [
    {
      key: 'runNumber',
      header: 'Run #',
      sortable: true,
      render: (run) => (
        <div className="flex items-center gap-2">
          <Calculator className="h-4 w-4 text-muted-foreground" />
          <span className="font-mono font-medium">{run.runNumber}</span>
        </div>
      ),
    },
    {
      key: 'period',
      header: 'Period',
      sortable: true,
      render: (run) => <span className="font-mono">{run.period}</span>,
    },
    {
      key: 'method',
      header: 'Method',
      render: (run) => <MethodBadge method={run.method} />,
    },
    {
      key: 'totalAllocated',
      header: 'Total Allocated',
      align: 'right',
      sortable: true,
      render: (run) => (
        <span className="font-mono">
          {run.totalAllocated > 0 ? formatCurrency(run.totalAllocated, run.currency) : '—'}
        </span>
      ),
    },
    {
      key: 'rulesApplied',
      header: 'Rules',
      align: 'center',
      render: (run) => <span>{run.rulesApplied || '—'}</span>,
    },
    {
      key: 'costCentersAffected',
      header: 'Cost Centers',
      align: 'center',
      render: (run) => <span>{run.costCentersAffected || '—'}</span>,
    },
    {
      key: 'journalEntryNumber',
      header: 'Journal Entry',
      render: (run) =>
        run.journalEntryNumber ? (
          <Link
            href={routes.finance.journalDetail(run.journalEntryId ?? '')}
            className="flex items-center gap-1 text-primary hover:underline"
          >
            <FileText className="h-3.5 w-3.5" />
            {run.journalEntryNumber}
          </Link>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: 'initiatedAt',
      header: 'Initiated',
      sortable: true,
      render: (run) => (
        <div className="text-sm">
          <div>{formatDate(run.initiatedAt)}</div>
          <div className="text-xs text-muted-foreground">{run.initiatedBy}</div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (run) => (
        <div className="flex items-center gap-2">
          <StatusBadge status={run.status} />
          {run.reversedAt && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <RotateCcw className="h-3 w-3" />
              Reversed
            </span>
          )}
        </div>
      ),
    },
  ];

  const handleRowClick = (run: AllocationRun) => {
    router.push(routes.finance.allocationDetail(run.id));
  };

  return (
    <DataTable
      data={runs}
      columns={columns}
      searchPlaceholder="Search allocation runs..."
      searchKeys={['runNumber', 'period', 'initiatedBy']}
      onRowClick={handleRowClick}
      emptyState={{
        key: 'finance.costAccounting.allocations',
        icon: Calculator,
        action: (
          <Button asChild>
            <Link href={routes.finance.allocationNew}>
              <Plus className="mr-2 h-4 w-4" />
              New Allocation Run
            </Link>
          </Button>
        ),
      }}
      actions={
        <Button asChild>
          <Link href={routes.finance.allocationNew}>
            <Plus className="mr-2 h-4 w-4" />
            New Allocation
          </Link>
        </Button>
      }
    />
  );
}
