'use client';

import Link from 'next/link';
import { DataTable, type Column } from '@/components/erp/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { Plus, Gauge, Activity } from 'lucide-react';
import type { CostDriver, DriverType } from '../types';
import { driverTypeLabels } from '../types';

function TypeBadge({ type }: { type: DriverType }) {
  const colors: Record<DriverType, string> = {
    headcount: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    revenue: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    square_footage: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    machine_hours: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    direct_labor: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
    units_produced: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    custom: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
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
          <div className="text-xs text-muted-foreground truncate max-w-[200px]">
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
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
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
        icon: Activity,
        title: 'No cost drivers defined',
        description: 'Create cost drivers to allocate costs across cost centers.',
        action: (
          <Button asChild>
            <Link href="/finance/cost-centers/drivers/new">
              <Plus className="mr-2 h-4 w-4" />
              New Driver
            </Link>
          </Button>
        ),
      }}
      actions={
        <Button asChild>
          <Link href="/finance/cost-centers/drivers/new">
            <Plus className="mr-2 h-4 w-4" />
            New Driver
          </Link>
        </Button>
      }
    />
  );
}
