'use client';

import Link from 'next/link';
import { DataTable, type Column } from '@/components/erp/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils';
import { layoutTokens } from '@/lib/layout-tokens';
import { Plus, Gauge, Activity } from 'lucide-react';
import type { CostDriver, DriverType } from '../types';
import { driverTypeLabels } from '../types';
import { routes } from '@/lib/constants';

function TypeBadge({ type }: { type: DriverType }) {
  const colors: Record<DriverType, string> = {
    headcount: 'bg-info/15 text-info dark:bg-info/20',
    revenue: 'bg-success/15 text-success dark:bg-success/20',
    square_footage: 'bg-accent text-accent-foreground',
    machine_hours: 'bg-warning/15 text-warning dark:bg-warning/20',
    direct_labor: 'bg-info/15 text-info dark:bg-info/20',
    units_produced: 'bg-warning/15 text-warning dark:bg-warning/20',
    custom: 'bg-muted text-muted-foreground',
  };

  return (
    <Badge variant="outline" className={colors[type]}>
      {driverTypeLabels[type]}
    </Badge>
  );
}

interface CostDriversTableProps {
  drivers: CostDriver[];
}

export function CostDriversTable({ drivers }: CostDriversTableProps) {
  const columns: Column<CostDriver>[] = [
    {
      key: 'code',
      header: 'Code',
      sortable: true,
      render: (driver) => (
        <div className="flex items-center gap-2">
          <Gauge className="h-4 w-4 text-muted-foreground" />
          <span className="font-mono font-medium">{driver.code}</span>
        </div>
      ),
    },
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (driver) => (
        <div>
          <div className="font-medium">{driver.name}</div>
          <div className={cn('text-xs text-muted-foreground', layoutTokens.truncateLayoutMd)}>
            {driver.description}
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (driver) => <TypeBadge type={driver.type} />,
    },
    {
      key: 'unit',
      header: 'Unit',
      render: (driver) => <span className="font-mono text-sm">{driver.unit}</span>,
    },
    {
      key: 'effectiveFrom',
      header: 'Effective From',
      sortable: true,
      render: (driver) => <span className="text-sm">{formatDate(driver.effectiveFrom)}</span>,
    },
    {
      key: 'effectiveTo',
      header: 'Effective To',
      render: (driver) =>
        driver.effectiveTo ? (
          <span className="text-sm">{formatDate(driver.effectiveTo)}</span>
        ) : (
          <Badge variant="secondary">Active</Badge>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (driver) => (
        <Badge
          variant="outline"
          className={
            driver.status === 'active'
              ? 'bg-success/15 text-success'
              : 'bg-muted text-muted-foreground'
          }
        >
          {driver.status === 'active' ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ];

  return (
    <DataTable
      data={drivers}
      columns={columns}
      searchPlaceholder="Search drivers..."
      searchKeys={['code', 'name', 'description']}
      emptyState={{
        key: 'finance.costAccounting.drivers',
        icon: Activity,
        action: (
          <Button asChild>
            <Link href={routes.finance.costDriverNew}>
              <Plus className="mr-2 h-4 w-4" />
              New Driver
            </Link>
          </Button>
        ),
      }}
      actions={
        <Button asChild>
          <Link href={routes.finance.costDriverNew}>
            <Plus className="mr-2 h-4 w-4" />
            New Driver
          </Link>
        </Button>
      }
    />
  );
}
