'use client';

import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { DataTable, type Column } from '@/components/erp/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { formatDate } from '@/lib/utils';
import { Plus, FileCheck, AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';
import type { Covenant, CovenantStatus, CovenantType } from '../types';
import { covenantStatusConfig, covenantTypeLabels } from '../types';

function StatusBadge({ status }: { status: CovenantStatus }) {
  const config = covenantStatusConfig[status];
  const icons: Record<CovenantStatus, React.ElementType> = {
    compliant: CheckCircle2,
    at_risk: AlertTriangle,
    breached: AlertCircle,
    waived: FileCheck,
  };
  const Icon = icons[status];

  return (
    <Badge variant="outline" className={config.color}>
      <Icon className="mr-1 h-3 w-3" />
      {config.label}
    </Badge>
  );
}

function ComplianceGauge({ covenant }: { covenant: Covenant }) {
  const { operator, threshold, currentValue, thresholdMax } = covenant;

  let percentage = 0;
  let isHealthy = true;

  if (operator === 'gte' || operator === 'gt') {
    percentage = (currentValue / threshold) * 100;
    isHealthy = currentValue >= threshold;
  } else if (operator === 'lte' || operator === 'lt') {
    percentage = (currentValue / threshold) * 100;
    isHealthy = currentValue <= threshold;
  } else if (operator === 'between' && thresholdMax) {
    const range = thresholdMax - threshold;
    const position = currentValue - threshold;
    percentage = (position / range) * 100;
    isHealthy = currentValue >= threshold && currentValue <= thresholdMax;
  }

  const cappedPercentage = Math.min(Math.max(percentage, 0), 150);

  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <Progress
        value={Math.min(cappedPercentage, 100)}
        className={cn('h-2 flex-1', !isHealthy ? '[&>div]:bg-destructive' : cappedPercentage > 80 && operator !== 'gte' ? '[&>div]:bg-warning' : '')}
      />
      <span className={cn('text-xs font-mono', !isHealthy && 'text-destructive')}>
        {currentValue.toFixed(2)}
      </span>
    </div>
  );
}

interface CovenantsTableProps {
  covenants: Covenant[];
}

export function CovenantsTable({ covenants }: CovenantsTableProps) {
  const router = useRouter();

  const columns: Column<Covenant>[] = [
    {
      key: 'name',
      header: 'Covenant',
      sortable: true,
      render: (covenant) => (
        <div className="max-w-[200px]">
          <div className="font-medium truncate">{covenant.name}</div>
          <div className="text-xs text-muted-foreground truncate">{covenant.facilityName}</div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (covenant) => (
        <Badge variant="secondary">{covenantTypeLabels[covenant.type]}</Badge>
      ),
    },
    {
      key: 'metric',
      header: 'Metric',
      render: (covenant) => (
        <span className="font-mono text-sm">{covenant.metric}</span>
      ),
    },
    {
      key: 'threshold',
      header: 'Threshold',
      align: 'right',
      render: (covenant) => (
        <span className="font-mono text-sm">
          {covenant.operator === 'gte' || covenant.operator === 'gt' ? '≥ ' : ''}
          {covenant.operator === 'lte' || covenant.operator === 'lt' ? '≤ ' : ''}
          {covenant.threshold.toFixed(2)}
          {covenant.thresholdMax && ` - ${covenant.thresholdMax.toFixed(2)}`}
        </span>
      ),
    },
    {
      key: 'currentValue',
      header: 'Current',
      render: (covenant) => <ComplianceGauge covenant={covenant} />,
    },
    {
      key: 'testingFrequency',
      header: 'Frequency',
      render: (covenant) => (
        <span className="text-sm capitalize">{covenant.testingFrequency}</span>
      ),
    },
    {
      key: 'nextTestDate',
      header: 'Next Test',
      sortable: true,
      render: (covenant) => (
        <div className="text-sm">
          <div>{formatDate(covenant.nextTestDate)}</div>
          {covenant.lastTestDate && (
            <div className="text-xs text-muted-foreground">
              Last: {formatDate(covenant.lastTestDate)}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (covenant) => <StatusBadge status={covenant.status} />,
    },
  ];

  const handleRowClick = (covenant: Covenant) => {
    router.push(`/finance/treasury/covenants/${covenant.id}`);
  };

  return (
    <DataTable
      data={covenants}
      columns={columns}
      searchPlaceholder="Search covenants..."
      searchKeys={['name', 'metric', 'facilityName']}
      onRowClick={handleRowClick}
      emptyState={{
        icon: FileCheck,
        title: 'No covenants defined',
        description: 'Set up covenant monitoring for your credit facilities.',
        action: (
          <Button asChild>
            <Link href="/finance/treasury/covenants/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Covenant
            </Link>
          </Button>
        ),
      }}
      actions={
        <Button asChild>
          <Link href="/finance/treasury/covenants/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Covenant
          </Link>
        </Button>
      }
    />
  );
}
