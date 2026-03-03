'use client';

import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/erp';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface AuditEntry {
  id: string;
  tenantId: string;
  userId: string | null;
  action: string;
  tableName: string;
  recordId: string | null;
  occurredAt: string;
}

export function GlobalAuditTable({ entries }: { entries: AuditEntry[] }) {
  if (entries.length === 0) {
    return <EmptyState contentKey="admin.audit" constraint="table" />;
  }

  return (
    <Table>
      <TableCaption className="sr-only">Global audit log</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Action</TableHead>
          <TableHead>Table</TableHead>
          <TableHead>Tenant</TableHead>
          <TableHead>User</TableHead>
          <TableHead>Record</TableHead>
          <TableHead>Time</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((entry) => (
          <TableRow key={entry.id}>
            <TableCell>
              <Badge variant="outline">{entry.action}</Badge>
            </TableCell>
            <TableCell className="font-mono text-xs">{entry.tableName}</TableCell>
            <TableCell className="font-mono text-xs">{entry.tenantId.slice(0, 8)}</TableCell>
            <TableCell className="font-mono text-xs">{entry.userId?.slice(0, 8) ?? '—'}</TableCell>
            <TableCell className="font-mono text-xs">
              {entry.recordId?.slice(0, 8) ?? '—'}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {new Date(entry.occurredAt).toLocaleString()}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
