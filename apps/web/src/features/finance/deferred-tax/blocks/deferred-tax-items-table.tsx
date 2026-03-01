'use client';

import { Badge } from '@/components/ui/badge';
import { DataTable, type Column } from '@/components/erp/data-table';
import { cn, formatCurrency } from '@/lib/utils';
import { originTypeLabels } from '../types';
import type { OriginType } from '../types';
import type { DeferredTaxItemView as DeferredTaxItem } from '../queries/deferred-tax.queries';

interface DeferredTaxItemsTableProps {
  items: DeferredTaxItem[];
}

export function DeferredTaxItemsTable({ items }: DeferredTaxItemsTableProps) {
  const columns: Column<DeferredTaxItem>[] = [
    {
      key: 'itemNumber',
      header: 'Item #',
      sortable: true,
      render: (i) => <span className="font-mono">{i.itemNumber}</span>,
    },
    {
      key: 'description',
      header: 'Description',
      render: (i) => <div className="max-w-[200px] truncate">{i.description}</div>,
    },
    {
      key: 'type',
      header: 'Type',
      render: (i) => (
        <Badge variant={i.type === 'dta' ? 'default' : 'destructive'}>
          {i.type === 'dta' ? 'DTA' : 'DTL'}
        </Badge>
      ),
    },
    {
      key: 'originType',
      header: 'Origin',
      render: (i) => <Badge variant="secondary">{originTypeLabels[i.originType as OriginType]}</Badge>,
    },
    {
      key: 'temporaryDifference',
      header: 'Temp. Diff.',
      align: 'right',
      render: (i) => (
        <span className="font-mono">{formatCurrency(i.temporaryDifference, i.currency)}</span>
      ),
    },
    {
      key: 'taxRate',
      header: 'Rate',
      align: 'right',
      render: (i) => <span className="font-mono">{i.taxRate}%</span>,
    },
    {
      key: 'deferredTaxAmount',
      header: 'DT Amount',
      align: 'right',
      render: (i) => (
        <span
          className={cn('font-mono', i.deferredTaxAmount >= 0 ? 'text-success' : 'text-destructive')}
        >
          {formatCurrency(i.deferredTaxAmount, i.currency)}
        </span>
      ),
    },
    { key: 'jurisdiction', header: 'Jurisdiction', render: (i) => <span>{i.jurisdiction}</span> },
  ];

  return (
    <DataTable
      data={items}
      columns={columns}
      searchPlaceholder="Search items..."
      searchKeys={['itemNumber', 'description']}
    />
  );
}
