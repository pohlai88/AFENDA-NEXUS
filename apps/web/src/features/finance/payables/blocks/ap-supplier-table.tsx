'use client';

import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge } from '@/components/erp/status-badge';
import { EmptyState } from '@/components/erp/empty-state';
import { Button } from '@/components/ui/button';
import { routes } from '@/lib/constants';
import { Users, Plus } from 'lucide-react';
import type { SupplierListItem } from '../queries/ap-supplier.queries';

interface ApSupplierTableProps {
  data: SupplierListItem[];
}

export function ApSupplierTable({ data }: ApSupplierTableProps) {
  if (data.length === 0) {
    return (
      <EmptyState
        contentKey="finance.payables.suppliers"
        constraint="table"
        icon={Users}
        action={
          <Button asChild>
            <Link href={routes.finance.supplierNew}>
              <Plus className="mr-2 h-4 w-4" />
              New Supplier
            </Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <caption className="sr-only">Suppliers — {data.length} suppliers</caption>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Currency</TableHead>
            <TableHead>Tax ID</TableHead>
            <TableHead>Payment Method</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((supplier) => {
            const href = routes.finance.supplierDetail(supplier.id);
            return (
              <TableRow
                key={supplier.id}
                className="cursor-pointer"
                tabIndex={0}
                role="link"
                aria-label={`Open supplier ${supplier.code} — ${supplier.name}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    window.location.href = href;
                  }
                }}
              >
                <TableCell>
                  <Link
                    href={href}
                    className="font-mono text-sm font-medium text-primary hover:underline"
                  >
                    {supplier.code}
                  </Link>
                </TableCell>
                <TableCell>{supplier.name}</TableCell>
                <TableCell>
                  <StatusBadge status={supplier.status} />
                </TableCell>
                <TableCell className="font-mono text-sm">{supplier.currencyCode}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {supplier.taxId ?? '—'}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {supplier.defaultPaymentMethod?.replace(/_/g, ' ') ?? '—'}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
