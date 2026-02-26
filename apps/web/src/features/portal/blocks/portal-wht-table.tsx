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
import { MoneyCell } from '@/components/erp/money-cell';
import { DateCell } from '@/components/erp/date-cell';
import { EmptyState } from '@/components/erp/empty-state';
import { routes } from '@/lib/constants';
import { Award } from 'lucide-react';
import type { PortalWhtCertificate } from '../queries/portal.queries';

interface PortalWhtTableProps {
  data: PortalWhtCertificate[];
}

export function PortalWhtTable({ data }: PortalWhtTableProps) {
  if (data.length === 0) {
    return (
      <EmptyState
        title="No WHT certificates found"
        description="Withholding tax certificates will appear here once issued."
        icon={Award}
      />
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Certificate #</TableHead>
            <TableHead>Period</TableHead>
            <TableHead>Issued</TableHead>
            <TableHead className="text-right">WHT Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((cert) => (
            <TableRow key={cert.id} className="cursor-pointer">
              <TableCell>
                <Link
                  href={routes.portal.whtDetail(cert.id)}
                  className="font-mono text-sm font-medium text-primary hover:underline"
                >
                  {cert.certificateNumber}
                </Link>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                <DateCell date={cert.periodStart} format="short" />
                {' \u2013 '}
                <DateCell date={cert.periodEnd} format="short" />
              </TableCell>
              <TableCell>
                <DateCell date={cert.issuedAt} format="short" />
              </TableCell>
              <TableCell className="text-right">
                <MoneyCell amount={cert.whtAmount} currency={cert.currencyCode} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
