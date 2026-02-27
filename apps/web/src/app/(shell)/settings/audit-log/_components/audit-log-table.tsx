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

interface AuditEntry {
  id: string;
  userId: string | null;
  action: string;
  tableName: string;
  recordId: string | null;
  oldData: unknown;
  newData: unknown;
  ipAddress: string | null;
  occurredAt: string;
}

export function AuditLogTable({ entries }: { entries: AuditEntry[] }) {
  return (
    <Table>
      <TableCaption className="sr-only">Audit log entries</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Action</TableHead>
          <TableHead>Table</TableHead>
          <TableHead>Record</TableHead>
          <TableHead>User</TableHead>
          <TableHead>IP</TableHead>
          <TableHead>When</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.length === 0 && (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
              No audit entries found.
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
            <TableCell className="font-mono text-xs">{entry.tableName}</TableCell>
            <TableCell className="font-mono text-xs text-muted-foreground">
              {entry.recordId ? `${entry.recordId.slice(0, 8)}…` : '—'}
            </TableCell>
            <TableCell className="font-mono text-xs text-muted-foreground">
              {entry.userId ? `${entry.userId.slice(0, 8)}…` : '—'}
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">
              {entry.ipAddress ?? '—'}
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
