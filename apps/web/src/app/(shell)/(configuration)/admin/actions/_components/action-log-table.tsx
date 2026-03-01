'use client';

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface ActionEntry {
  id: string;
  adminUserId: string;
  action: string;
  targetTenantId: string | null;
  targetUserId: string | null;
  details: unknown;
  occurredAt: string;
}

export function ActionLogTable({ entries }: { entries: ActionEntry[] }) {
  return (
    <Table>
      <TableCaption className="sr-only">Admin action log</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Action</TableHead>
          <TableHead>Admin</TableHead>
          <TableHead>Target Tenant</TableHead>
          <TableHead>Details</TableHead>
          <TableHead>When</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.length === 0 && (
          <TableRow>
            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
              No admin actions recorded.
            </TableCell>
          </TableRow>
        )}
        {entries.map((entry) => (
          <TableRow key={entry.id}>
            <TableCell>
              <Badge variant="outline" className="font-mono text-xs">
                {entry.action}
              </Badge>
            </TableCell>
            <TableCell className="font-mono text-xs text-muted-foreground">
              {entry.adminUserId.slice(0, 8)}…
            </TableCell>
            <TableCell className="font-mono text-xs text-muted-foreground">
              {entry.targetTenantId ? `${entry.targetTenantId.slice(0, 8)}…` : '—'}
            </TableCell>
            <TableCell>
              {entry.details ? (
                <pre className="max-w-xs truncate font-mono text-xs text-muted-foreground">
                  {JSON.stringify(entry.details)}
                </pre>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </TableCell>
            <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
              {new Date(entry.occurredAt).toLocaleString()}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
