'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DateCell } from '@/components/erp/date-cell';
import { EmptyState } from '@/components/erp/empty-state';
import { FolderOpen } from 'lucide-react';
import type { PortalDocument } from '../queries/portal.queries';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface PortalDocumentTableProps {
  data: PortalDocument[];
}

export function PortalDocumentTable({ data }: PortalDocumentTableProps) {
  if (data.length === 0) {
    return (
      <EmptyState
        contentKey="portal.documents"
        icon={FolderOpen}
      />
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <caption className="sr-only">Documents — {data.length} files</caption>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>File</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Expires</TableHead>
            <TableHead>Uploaded</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((doc) => (
            <TableRow key={doc.id}>
              <TableCell className="font-medium">{doc.title}</TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs">
                  {doc.category}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{doc.fileName}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatFileSize(doc.fileSizeBytes)}
              </TableCell>
              <TableCell>
                {doc.expiresAt ? (
                  <DateCell date={doc.expiresAt} format="short" />
                ) : (
                  <span className="text-xs text-muted-foreground">{'\u2014'}</span>
                )}
              </TableCell>
              <TableCell>
                <DateCell date={doc.createdAt} format="short" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
