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
import { DateCell } from '@/components/erp/date-cell';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/erp/empty-state';
import { routes } from '@/lib/constants';
import { MessageSquareWarning } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PortalDispute } from '../queries/portal.queries';

interface PortalDisputeTableProps {
  data: PortalDispute[];
}

export function PortalDisputeTable({ data }: PortalDisputeTableProps) {
  if (data.length === 0) {
    return (
      <EmptyState
        title="No disputes"
        description="Raise a dispute if you have a billing or payment issue."
        icon={MessageSquareWarning}
        action={
          <Button asChild>
            <Link href={routes.portal.disputeNew}>Raise Dispute</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Subject</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((dispute) => (
            <TableRow key={dispute.id} className="cursor-pointer">
              <TableCell>
                <Link
                  href={routes.portal.disputeDetail(dispute.id)}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  {dispute.subject}
                </Link>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs">
                  {dispute.category}
                </Badge>
              </TableCell>
              <TableCell>
                <StatusBadge status={dispute.status} />
              </TableCell>
              <TableCell>
                <DateCell date={dispute.createdAt} format="short" />
              </TableCell>
              <TableCell>
                <DateCell date={dispute.updatedAt} format="short" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
