'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DataTable, type Column } from '@/components/erp/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Plus, FileText, Building2, Car, Monitor, Package, HelpCircle } from 'lucide-react';
import type { LeaseContract, LeaseStatus, LeaseType, AssetClass } from '../types';
import { leaseStatusConfig, leaseTypeLabels, assetClassLabels } from '../types';
import { routes } from '@/lib/constants';

function StatusBadge({ status }: { status: LeaseStatus }) {
  const config = leaseStatusConfig[status];
  return (
    <Badge variant="outline" className={config.color}>
      {config.label}
    </Badge>
  );
}

function TypeBadge({ type }: { type: LeaseType }) {
  return (
    <Badge variant="secondary" className="text-xs">
      {leaseTypeLabels[type]}
    </Badge>
  );
}

const assetClassIcons: Record<AssetClass, React.ElementType> = {
  property: Building2,
  vehicle: Car,
  equipment: Package,
  it_equipment: Monitor,
  other: HelpCircle,
};

function AssetClassIcon({ assetClass }: { assetClass: AssetClass }) {
  const Icon = assetClassIcons[assetClass];
  return <Icon className="h-4 w-4 text-muted-foreground" />;
}

function LeaseTermProgress({ lease }: { lease: LeaseContract }) {
  const start = new Date(lease.commencementDate).getTime();
  const end = new Date(lease.endDate).getTime();
  const now = Date.now();
  const elapsed = now - start;
  const total = end - start;
  const percent = Math.min(Math.max((elapsed / total) * 100, 0), 100);

  return (
    <div className="flex items-center gap-2 min-w-[100px]">
      <Progress value={percent} className="h-2 flex-1" />
      <span className="text-xs text-muted-foreground">{Math.round(percent)}%</span>
    </div>
  );
}

interface LeasesTableProps {
  leases: LeaseContract[];
}

export function LeasesTable({ leases }: LeasesTableProps) {
  const router = useRouter();

  const columns: Column<LeaseContract>[] = [
    {
      key: 'leaseNumber',
      header: 'Lease #',
      sortable: true,
      render: (lease) => (
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="font-mono font-medium">{lease.leaseNumber}</span>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (lease) => (
        <div className="max-w-[200px]">
          <div className="font-medium truncate flex items-center gap-2">
            <AssetClassIcon assetClass={lease.assetClass} />
            {lease.description}
          </div>
          <div className="text-xs text-muted-foreground truncate">{lease.lessorName}</div>
        </div>
      ),
    },
    {
      key: 'leaseType',
      header: 'Type',
      render: (lease) => <TypeBadge type={lease.leaseType} />,
    },
    {
      key: 'rouAssetValue',
      header: 'ROU Asset',
      align: 'right',
      sortable: true,
      render: (lease) => (
        <div className="text-right">
          <div className="font-mono">{formatCurrency(lease.carryingAmount, lease.currency)}</div>
          <div className="text-xs text-muted-foreground">
            of {formatCurrency(lease.rouAssetValue, lease.currency)}
          </div>
        </div>
      ),
    },
    {
      key: 'leaseLiabilityValue',
      header: 'Liability',
      align: 'right',
      sortable: true,
      render: (lease) => (
        <span className="font-mono">
          {formatCurrency(lease.leaseLiabilityValue, lease.currency)}
        </span>
      ),
    },
    {
      key: 'paymentAmount',
      header: 'Payment',
      align: 'right',
      render: (lease) => (
        <div className="text-right">
          <div className="font-mono">{formatCurrency(lease.paymentAmount, lease.currency)}</div>
          <div className="text-xs text-muted-foreground capitalize">{lease.paymentFrequency}</div>
        </div>
      ),
    },
    {
      key: 'leaseTerm',
      header: 'Progress',
      render: (lease) => <LeaseTermProgress lease={lease} />,
    },
    {
      key: 'endDate',
      header: 'End Date',
      sortable: true,
      render: (lease) => <span className="text-sm">{formatDate(lease.endDate)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (lease) => <StatusBadge status={lease.status} />,
    },
  ];

  const handleRowClick = (lease: LeaseContract) => {
    router.push(routes.finance.leaseDetail(lease.id));
  };

  return (
    <DataTable
      data={leases}
      columns={columns}
      searchPlaceholder="Search leases..."
      searchKeys={['leaseNumber', 'description', 'lessorName']}
      onRowClick={handleRowClick}
      emptyState={{
        key: 'finance.leases',
        icon: FileText,
        action: (
          <Button asChild>
            <Link href={routes.finance.leaseNew}>
              <Plus className="mr-2 h-4 w-4" />
              New Lease
            </Link>
          </Button>
        ),
      }}
      actions={
        <Button asChild>
          <Link href={routes.finance.leaseNew}>
            <Plus className="mr-2 h-4 w-4" />
            New Lease
          </Link>
        </Button>
      }
    />
  );
}
