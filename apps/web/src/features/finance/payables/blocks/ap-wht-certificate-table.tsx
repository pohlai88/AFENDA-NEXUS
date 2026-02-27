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
import { Badge } from '@/components/ui/badge';
import { MoneyCell } from '@/components/erp/money-cell';
import { DateCell } from '@/components/erp/date-cell';
import { EmptyState } from '@/components/erp/empty-state';
import { FileText } from 'lucide-react';
import { routes } from '@/lib/constants';
import type { WhtCertificateListItem } from '../queries/ap-wht.queries';

interface ApWhtCertificateTableProps {
  data: WhtCertificateListItem[];
}

export function ApWhtCertificateTable({ data }: ApWhtCertificateTableProps) {
  if (data.length === 0) {
    return (
      <EmptyState
        contentKey="finance.payables.whtCerts"
        icon={FileText}
      />
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <caption className="sr-only">WHT certificates — {data.length} certificates</caption>
        <TableHeader>
          <TableRow>
            <TableHead>Certificate #</TableHead>
            <TableHead>Supplier</TableHead>
            <TableHead>Income Type</TableHead>
            <TableHead>Tax Year</TableHead>
            <TableHead className="text-right">Gross</TableHead>
            <TableHead className="text-right">WHT Amount</TableHead>
            <TableHead>Rate</TableHead>
            <TableHead>Issued</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((cert) => (
            <TableRow
              key={cert.id}
              className="cursor-pointer"
              tabIndex={0}
              role="link"
              aria-label={`Open supplier ${cert.supplierCode} — ${cert.supplierName}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  window.location.href = routes.finance.supplierDetail(cert.supplierId);
                }
              }}
            >
              <TableCell className="font-mono text-sm font-medium">{cert.certificateNumber}</TableCell>
              <TableCell>
                <Link
                  href={routes.finance.supplierDetail(cert.supplierId)}
                  className="text-sm text-primary hover:underline"
                >
                  {cert.supplierCode} — {cert.supplierName}
                </Link>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs">
                  {cert.incomeType.replace(/_/g, ' ')}
                </Badge>
              </TableCell>
              <TableCell className="tabular-nums">{cert.taxYear}</TableCell>
              <TableCell className="text-right">
                <MoneyCell amount={cert.grossAmount} currency={cert.currencyCode} />
              </TableCell>
              <TableCell className="text-right">
                <MoneyCell amount={cert.whtAmount} currency={cert.currencyCode} />
              </TableCell>
              <TableCell className="font-mono text-sm">{cert.whtRate}%</TableCell>
              <TableCell>
                <DateCell date={cert.issueDate} format="short" />
              </TableCell>
              <TableCell>
                <Badge variant={cert.status === 'ISSUED' ? 'default' : 'destructive'} className="text-xs">
                  {cert.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
