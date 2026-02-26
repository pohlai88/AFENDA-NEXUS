'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, type Column } from '@/components/erp/data-table';
import { routes } from '@/lib/constants';
import { FileText, Plus, Percent, Hash, Calculator } from 'lucide-react';
import type { TaxCode, TaxType, TaxCalculationMethod } from '../types';
import { taxTypeLabels } from '../types';

// ─── Type Badges ─────────────────────────────────────────────────────────────

const taxTypeColors: Record<TaxType, string> = {
  sales: 'bg-success/15 text-success dark:bg-success/20',
  purchase: 'bg-info/15 text-info dark:bg-info/20',
  both: 'bg-accent text-accent-foreground',
  withholding: 'bg-warning/15 text-warning dark:bg-warning/20',
};

function TaxTypeBadge({ type }: { type: TaxType }) {
  return <Badge className={taxTypeColors[type]}>{taxTypeLabels[type]}</Badge>;
}

const methodLabels: Record<TaxCalculationMethod, string> = {
  percentage: 'Percentage',
  fixed: 'Fixed Amount',
  compound: 'Compound',
  inclusive: 'Tax Inclusive',
};

const methodIcons: Record<TaxCalculationMethod, typeof Percent> = {
  percentage: Percent,
  fixed: Hash,
  compound: Calculator,
  inclusive: Calculator,
};

// ─── Columns ─────────────────────────────────────────────────────────────────

const columns: Column<TaxCode>[] = [
  {
    key: 'code',
    header: 'Code',
    sortable: true,
    render: (tc) => (
      <div className="flex items-center gap-2">
        <div className="font-mono font-medium">{tc.code}</div>
        {tc.isDefault && (
          <Badge variant="outline" className="text-xs">
            Default
          </Badge>
        )}
      </div>
    ),
  },
  {
    key: 'name',
    header: 'Name',
    sortable: true,
    render: (tc) => (
      <div>
        <div className="font-medium">{tc.name}</div>
        <div className="text-xs text-muted-foreground truncate max-w-xs">{tc.description}</div>
      </div>
    ),
  },
  {
    key: 'taxType',
    header: 'Type',
    sortable: true,
    render: (tc) => <TaxTypeBadge type={tc.taxType} />,
  },
  {
    key: 'rate',
    header: 'Rate',
    sortable: true,
    className: 'text-right',
    render: (tc) => {
      const MethodIcon = methodIcons[tc.calculationMethod];
      return (
        <div className="flex items-center justify-end gap-2">
          <MethodIcon className="h-3 w-3 text-muted-foreground" />
          <span className="font-mono font-medium">{tc.rate}%</span>
        </div>
      );
    },
  },
  {
    key: 'calculationMethod',
    header: 'Method',
    render: (tc) => (
      <Badge variant="secondary" className="text-xs">
        {methodLabels[tc.calculationMethod]}
      </Badge>
    ),
  },
  {
    key: 'taxAccountCode',
    header: 'GL Account',
    render: (tc) => <span className="font-mono text-sm">{tc.taxAccountCode}</span>,
  },
  {
    key: 'jurisdiction',
    header: 'Jurisdiction',
    render: (tc) => tc.jurisdiction,
  },
  {
    key: 'status',
    header: 'Status',
    sortable: true,
    render: (tc) => (
      <Badge variant={tc.status === 'active' ? 'default' : 'secondary'}>{tc.status}</Badge>
    ),
  },
];

// ─── Tax Codes Table ─────────────────────────────────────────────────────────

interface TaxCodesTableProps {
  taxCodes: TaxCode[];
}

export function TaxCodesTable({ taxCodes }: TaxCodesTableProps) {
  const router = useRouter();

  const handleRowClick = (taxCode: TaxCode) => {
    router.push(`${routes.finance.tax}/codes/${taxCode.id}`);
  };

  return (
    <DataTable
      data={taxCodes}
      columns={columns}
      keyField="id"
      onRowClick={handleRowClick}
      searchable
      searchPlaceholder="Search tax codes..."
      emptyState={{
        icon: FileText,
        title: 'No tax codes found',
        description: 'Create your first tax code to start tracking taxes.',
        action: {
          label: 'Create Tax Code',
          href: `${routes.finance.tax}/codes/new`,
        },
      }}
      actions={
        <Button asChild>
          <Link href={`${routes.finance.tax}/codes/new`}>
            <Plus className="mr-2 h-4 w-4" />
            New Tax Code
          </Link>
        </Button>
      }
    />
  );
}
