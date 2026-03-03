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
import { ComplianceRenewalDialog } from './portal-compliance-renewal-dialog';
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

function ExpiryCountdown({ expiryDate }: { expiryDate: string }) {
  const now = new Date();
  const expiry = new Date(expiryDate);
  const diffMs = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return (
      <span className="text-xs font-medium text-destructive">
        Expired {Math.abs(diffDays)}d ago
      </span>
    );
  }
  if (diffDays <= 7) {
    return <span className="text-xs font-medium text-destructive">{diffDays}d remaining</span>;
  }
  if (diffDays <= 30) {
    return <span className="text-xs font-medium text-warning">{diffDays}d remaining</span>;
  }
  return <span className="text-xs text-muted-foreground">{diffDays}d remaining</span>;
}

interface PortalComplianceSummaryBlockProps {
  data: PortalComplianceSummary;
  supplierId?: string;
}

export function PortalComplianceSummaryBlock({
  data,
  supplierId,
}: PortalComplianceSummaryBlockProps) {
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
              <caption className="sr-only">Compliance items — {data.items.length} items</caption>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Countdown</TableHead>
                  <TableHead>Last Verified</TableHead>
                  <TableHead>Notes</TableHead>
                  {supplierId && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <ComplianceIcon status={item.status} />
                        <span className="font-medium">{item.label ?? item.itemType}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={item.status} showIcon={false} />
                    </TableCell>
                    <TableCell>
                      {item.expiryDate ? (
                        <DateCell date={item.expiryDate} format="short" />
                      ) : (
                        <span className="text-xs text-muted-foreground">{'\u2014'}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.expiryDate ? (
                        <ExpiryCountdown expiryDate={item.expiryDate} />
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
                    {supplierId && (
                      <TableCell className="text-right">
                        <ComplianceRenewalDialog
                          supplierId={supplierId}
                          itemId={item.id}
                          itemType={item.itemType}
                        />
                      </TableCell>
                    )}
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
