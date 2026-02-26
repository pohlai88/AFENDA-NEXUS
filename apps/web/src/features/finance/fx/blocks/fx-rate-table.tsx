'use client';

import { DataTable, type ColumnDef } from '@/components/erp/data-table';
import { DateCell } from '@/components/erp/date-cell';
import { Badge } from '@/components/ui/badge';
import { FxRateActions } from './fx-rate-actions';
import type { FxRateListItem } from '../queries/fx.queries';

export function fxRateColumns(
  editAction?: (rate: FxRateListItem) => React.ReactNode
): ColumnDef<FxRateListItem>[] {
  return [
    {
      id: 'pair',
      header: 'Pair',
      sortable: true,
      sortFn: (a, b) =>
        `${a.fromCurrency}/${a.toCurrency}`.localeCompare(`${b.fromCurrency}/${b.toCurrency}`),
      accessorFn: (row) => (
        <Badge variant="outline">
          {row.fromCurrency}/{row.toCurrency}
        </Badge>
      ),
    },
    {
      id: 'rate',
      header: 'Rate',
      className: 'text-right',
      sortable: true,
      sortFn: (a, b) => Number(a.rate) - Number(b.rate),
      accessorFn: (row) => <span className="font-mono">{Number(row.rate).toFixed(6)}</span>,
    },
    {
      id: 'effectiveDate',
      header: 'Effective Date',
      sortable: true,
      sortFn: (a, b) => a.effectiveDate.localeCompare(b.effectiveDate),
      accessorFn: (row) => <DateCell date={row.effectiveDate} />,
    },
    {
      id: 'expiresAt',
      header: 'Expires',
      sortable: true,
      sortFn: (a, b) => (a.expiresAt ?? '').localeCompare(b.expiresAt ?? ''),
      accessorFn: (row) => (row.expiresAt ? <DateCell date={row.expiresAt} /> : '—'),
    },
    {
      id: 'source',
      header: 'Source',
      sortable: true,
      sortFn: (a, b) => a.source.localeCompare(b.source),
      accessorFn: (row) => <Badge variant="secondary">{row.source}</Badge>,
    },
    {
      id: 'actions',
      header: 'Actions',
      className: 'text-right',
      accessorFn: (row) => (
        <div className="flex items-center justify-end gap-2">
          {editAction?.(row)}
          <FxRateActions rateId={row.id} displayLabel={`${row.fromCurrency}/${row.toCurrency}`} />
        </div>
      ),
    },
  ];
}

interface FxRateTableProps {
  data: FxRateListItem[];
  editAction?: (rate: FxRateListItem) => React.ReactNode;
}

export function FxRateTable({ data, editAction }: FxRateTableProps) {
  return (
    <DataTable
      columns={fxRateColumns(editAction)}
      data={data}
      keyFn={(row) => row.id}
      searchPlaceholder="Search FX rates..."
      searchFn={(row, query) => {
        const q = query.toLowerCase();
        return (
          row.fromCurrency.toLowerCase().includes(q) ||
          row.toCurrency.toLowerCase().includes(q) ||
          row.source.toLowerCase().includes(q)
        );
      }}
      emptyMessage="No FX rates match your search."
    />
  );
}
