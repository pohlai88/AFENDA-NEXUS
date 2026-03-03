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
import { Bell, BellOff } from 'lucide-react';
import type { PortalComplianceAlertLog } from '../queries/portal.queries';

const ALERT_LABELS: Record<string, string> = {
  EXPIRING_30D: '30-day warning',
  EXPIRING_14D: '14-day warning',
  EXPIRING_7D: '7-day warning',
  EXPIRED: 'Expired',
};

function alertVariant(alertType: string): 'outline' | 'destructive' | 'secondary' {
  if (alertType === 'EXPIRED') return 'destructive';
  if (alertType === 'EXPIRING_7D') return 'destructive';
  if (alertType === 'EXPIRING_14D') return 'outline';
  return 'outline';
}

interface PortalComplianceAlertsBlockProps {
  alerts: PortalComplianceAlertLog[];
}

export function PortalComplianceAlertsBlock({ alerts }: PortalComplianceAlertsBlockProps) {
  if (alerts.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <BellOff className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">
            No compliance alerts have been generated yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  const active = alerts.filter((a) => !a.supersededAt);
  const historical = alerts.filter((a) => !!a.supersededAt);

  return (
    <div className="space-y-6">
      {/* Active Alerts */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <Bell className="h-5 w-5 text-warning" aria-hidden />
          <CardTitle className="text-base">
            Active Alerts{active.length > 0 && ` (${active.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {active.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No active compliance alerts — all clear.
            </p>
          ) : (
            <AlertTable alerts={active} />
          )}
        </CardContent>
      </Card>

      {/* Historical Alerts */}
      {historical.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-muted-foreground">
              Resolved Alerts ({historical.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AlertTable alerts={historical} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function AlertTable({ alerts }: { alerts: PortalComplianceAlertLog[] }) {
  return (
    <div className="rounded-md border">
      <Table>
        <caption className="sr-only">Compliance alerts — {alerts.length} items</caption>
        <TableHeader>
          <TableRow>
            <TableHead>Item Type</TableHead>
            <TableHead>Alert</TableHead>
            <TableHead>Alerted At</TableHead>
            <TableHead>Resolved</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {alerts.map((alert) => (
            <TableRow key={alert.id}>
              <TableCell className="font-medium">{alert.itemType}</TableCell>
              <TableCell>
                <StatusBadge
                  status={ALERT_LABELS[alert.alertType] ?? alert.alertType}
                  variant={alertVariant(alert.alertType)}
                  showIcon={false}
                />
              </TableCell>
              <TableCell>
                <DateCell date={alert.alertedAt} format="short" />
              </TableCell>
              <TableCell>
                {alert.supersededAt ? (
                  <DateCell date={alert.supersededAt} format="short" />
                ) : (
                  <span className="text-xs text-muted-foreground">{'\u2014'}</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
