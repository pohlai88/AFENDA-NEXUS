'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/erp/status-badge';
import { DateCell } from '@/components/erp/date-cell';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ShieldCheck, ShieldAlert, ShieldX, Clock } from 'lucide-react';
import type { PortalComplianceSummary } from '../queries/portal.queries';

function ComplianceIcon({ status }: { status: string }) {
  switch (status) {
    case 'VALID':
    case 'ACTIVE':
      return <ShieldCheck className="h-4 w-4 text-success" aria-label="Valid" />;
    case 'EXPIRING_SOON':
      return <ShieldAlert className="h-4 w-4 text-warning" aria-label="Expiring soon" />;
    case 'EXPIRED':
    case 'MISSING':
      return <ShieldX className="h-4 w-4 text-destructive" aria-label="Expired or missing" />;
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" aria-label={status} />;
  }
}

interface PortalComplianceSummaryBlockProps {
  data: PortalComplianceSummary;
}

export function PortalComplianceSummaryBlock({ data }: PortalComplianceSummaryBlockProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Overall Status</CardTitle>
          <StatusBadge status={data.overallStatus} />
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Compliance Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Last Verified</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((item) => (
                  <TableRow key={item.itemType}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <ComplianceIcon status={item.status} />
                        <span className="font-medium">{item.itemType}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={item.status} showIcon={false} />
                    </TableCell>
                    <TableCell>
                      {item.expiresAt ? (
                        <DateCell date={item.expiresAt} format="short" />
                      ) : (
                        <span className="text-xs text-muted-foreground">{'\u2014'}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.lastVerifiedAt ? (
                        <DateCell date={item.lastVerifiedAt} format="short" />
                      ) : (
                        <span className="text-xs text-muted-foreground">{'\u2014'}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.notes ?? '\u2014'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
