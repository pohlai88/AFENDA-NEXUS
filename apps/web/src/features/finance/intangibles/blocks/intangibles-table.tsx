'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { DataTable, type Column } from '@/components/erp/data-table';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { routes } from '@/lib/constants';
import { Lightbulb, Plus, FileCode, Award, Stamp, Key, Star, Beaker, Infinity } from 'lucide-react';
import type { IntangibleAsset, IntangibleStatus, IntangibleType } from '../types';
import { intangibleStatusConfig, intangibleTypeLabels } from '../types';

// ─── Type Icons ──────────────────────────────────────────────────────────────

const typeIcons: Record<IntangibleType, typeof Lightbulb> = {
  software: FileCode,
  patent: Award,
  trademark: Stamp,
  license: Key,
  goodwill: Star,
  development: Beaker,
  other: Lightbulb,
};

function TypeBadge({ type }: { type: IntangibleType }) {
  const Icon = typeIcons[type];
  return (
    <Badge variant="outline" className="gap-1">
      <Icon className="h-3 w-3" />
      {intangibleTypeLabels[type]}
    </Badge>
  );
}

// ─── Status Badge ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: IntangibleStatus }) {
  const config = intangibleStatusConfig[status];
  return <Badge className={config.color}>{config.label}</Badge>;
}

// ─── Amortization Progress ───────────────────────────────────────────────────

function AmortizationProgress({ asset }: { asset: IntangibleAsset }) {
  if (asset.hasIndefiniteLife) {
    return (
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Infinity className="h-3 w-3" />
        Indefinite
      </div>
    );
  }

  const amortizableAmount = asset.originalCost - asset.residualValue;
  const percentage =
    amortizableAmount > 0 ? (asset.accumulatedAmortization / amortizableAmount) * 100 : 0;

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

const columns: Column<IntangibleAsset>[] = [
  {
    key: 'assetNumber',
    header: 'Asset #',
    sortable: true,
    render: (asset) => (
      <div className="flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-muted-foreground" />
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
    key: 'intangibleType',
    header: 'Type',
    sortable: true,
    render: (asset) => <TypeBadge type={asset.intangibleType} />,
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
    key: 'accumulatedAmortization',
    header: 'Acc. Amortization',
    sortable: true,
    className: 'text-right',
    render: (asset) => (
      <span className="font-mono text-muted-foreground">
        ({formatCurrency(asset.accumulatedAmortization, asset.currency)})
      </span>
    ),
  },
  {
    key: 'carryingAmount',
    header: 'Carrying Amount',
    sortable: true,
    className: 'text-right',
    render: (asset) => (
      <span
        className={cn(
          'font-mono font-medium',
          asset.carryingAmount === 0 && 'text-muted-foreground'
        )}
      >
        {formatCurrency(asset.carryingAmount, asset.currency)}
      </span>
    ),
  },
  {
    key: 'amortization',
    header: 'Amortization',
    render: (asset) => <AmortizationProgress asset={asset} />,
  },
  {
    key: 'expiryDate',
    header: 'Expiry',
    sortable: true,
    render: (asset) => {
      if (asset.hasIndefiniteLife) {
        return <span className="text-muted-foreground">N/A</span>;
      }
      if (!asset.expiryDate) {
        return <span className="text-muted-foreground">-</span>;
      }
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
      const isExpiringSoon = new Date(asset.expiryDate) < oneYearFromNow;
      return (
        <span className={cn(isExpiringSoon && 'text-warning dark:text-warning')}>
          {formatDate(asset.expiryDate)}
        </span>
      );
    },
  },
  {
    key: 'status',
    header: 'Status',
    sortable: true,
    render: (asset) => <StatusBadge status={asset.status} />,
  },
];

// ─── Intangibles Table ───────────────────────────────────────────────────────

interface IntangiblesTableProps {
  assets: IntangibleAsset[];
  pagination?: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

export function IntangiblesTable({ assets, pagination }: IntangiblesTableProps) {
  const router = useRouter();

  const handleRowClick = (asset: IntangibleAsset) => {
    router.push(`${routes.finance.intangibles}/${asset.id}`);
  };

  return (
    <DataTable
      data={assets}
      columns={columns}
      keyField="id"
      onRowClick={handleRowClick}
      pagination={pagination}
      searchable
      searchPlaceholder="Search intangible assets..."
      emptyState={{
        key: 'finance.intangibles',
        icon: Lightbulb,
        action: {
          label: 'Add Intangible',
          href: `${routes.finance.intangibles}/new`,
        },
      }}
      actions={
        <Button asChild>
          <Link href={`${routes.finance.intangibles}/new`}>
            <Plus className="mr-2 h-4 w-4" />
            Add Intangible
          </Link>
        </Button>
      }
    />
  );
}
