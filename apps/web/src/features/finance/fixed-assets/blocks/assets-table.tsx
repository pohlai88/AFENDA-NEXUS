'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { DataTable, type Column } from '@/components/erp/data-table';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { routes } from '@/lib/constants';
import { Box, Plus, MapPin, Building2 } from 'lucide-react';
import type { FixedAsset, AssetStatus } from '../types';
import { assetStatusConfig, depreciationMethodLabels } from '../types';

// ─── Status Badge ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: AssetStatus }) {
  const config = assetStatusConfig[status];
  return <Badge className={config.color}>{config.label}</Badge>;
}

// ─── Depreciation Progress ───────────────────────────────────────────────────

function DepreciationProgress({ asset }: { asset: FixedAsset }) {
  const depreciableAmount = asset.originalCost - asset.salvageValue;
  const percentage =
    depreciableAmount > 0 ? (asset.accumulatedDepreciation / depreciableAmount) * 100 : 0;

  return (
    <div className="space-y-1 w-28">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{Math.round(percentage)}%</span>
      </div>
      <Progress value={Math.min(percentage, 100)} className="h-1.5" />
    </div>
  );
}

// ─── Columns ─────────────────────────────────────────────────────────────────

const columns: Column<FixedAsset>[] = [
  {
    key: 'assetNumber',
    header: 'Asset #',
    sortable: true,
    render: (asset) => (
      <div className="flex items-center gap-2">
        <Box className="h-4 w-4 text-muted-foreground" />
        <span className="font-mono font-medium">{asset.assetNumber}</span>
      </div>
    ),
  },
  {
    key: 'name',
    header: 'Name',
    sortable: true,
    render: (asset) => (
      <div>
        <div className="font-medium">{asset.name}</div>
        <div className="text-xs text-muted-foreground">{asset.categoryName}</div>
      </div>
    ),
  },
  {
    key: 'location',
    header: 'Location',
    render: (asset) => (
      <div className="flex items-center gap-2 text-sm">
        <MapPin className="h-3 w-3 text-muted-foreground" />
        <div>
          <div>{asset.location}</div>
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Building2 className="h-3 w-3" />
            {asset.department}
          </div>
        </div>
      </div>
    ),
  },
  {
    key: 'originalCost',
    header: 'Original Cost',
    sortable: true,
    className: 'text-right',
    render: (asset) => (
      <span className="font-mono">{formatCurrency(asset.originalCost, asset.currency)}</span>
    ),
  },
  {
    key: 'accumulatedDepreciation',
    header: 'Acc. Depreciation',
    sortable: true,
    className: 'text-right',
    render: (asset) => (
      <span className="font-mono text-muted-foreground">
        ({formatCurrency(asset.accumulatedDepreciation, asset.currency)})
      </span>
    ),
  },
  {
    key: 'netBookValue',
    header: 'Net Book Value',
    sortable: true,
    className: 'text-right',
    render: (asset) => (
      <span
        className={cn('font-mono font-medium', asset.netBookValue === 0 && 'text-muted-foreground')}
      >
        {formatCurrency(asset.netBookValue, asset.currency)}
      </span>
    ),
  },
  {
    key: 'depreciation',
    header: 'Depreciation',
    render: (asset) => <DepreciationProgress asset={asset} />,
  },
  {
    key: 'acquisitionDate',
    header: 'Acquired',
    sortable: true,
    render: (asset) => formatDate(asset.acquisitionDate),
  },
  {
    key: 'status',
    header: 'Status',
    sortable: true,
    render: (asset) => <StatusBadge status={asset.status} />,
  },
];

// ─── Assets Table ────────────────────────────────────────────────────────────

interface AssetsTableProps {
  assets: FixedAsset[];
  pagination?: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

export function AssetsTable({ assets, pagination }: AssetsTableProps) {
  const router = useRouter();

  const handleRowClick = (asset: FixedAsset) => {
    router.push(`${routes.finance.fixedAssets}/${asset.id}`);
  };

  return (
    <DataTable
      data={assets}
      columns={columns}
      keyField="id"
      onRowClick={handleRowClick}
      pagination={pagination}
      searchable
      searchPlaceholder="Search assets..."
      emptyState={{
        key: 'finance.fixedAssets',
        icon: Box,
        action: {
          label: 'Add Asset',
          href: `${routes.finance.fixedAssets}/new`,
        },
      }}
      actions={
        <Button asChild>
          <Link href={`${routes.finance.fixedAssets}/new`}>
            <Plus className="mr-2 h-4 w-4" />
            Add Asset
          </Link>
        </Button>
      }
    />
  );
}
