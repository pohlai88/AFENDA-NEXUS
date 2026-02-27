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
import type { SupplierSiteView } from '../queries/ap-supplier.queries';

interface ApSupplierSitesTableProps {
  sites: SupplierSiteView[];
}

export function ApSupplierSitesTable({ sites }: ApSupplierSitesTableProps) {
  if (sites.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No sites registered for this supplier.
      </p>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <caption className="sr-only">Supplier sites — {sites.length} sites</caption>
        <TableHeader>
          <TableRow>
            <TableHead>Site Code</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>City</TableHead>
            <TableHead>Country</TableHead>
            <TableHead>Primary</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sites.map((site) => (
            <TableRow key={site.id}>
              <TableCell className="font-mono text-sm">{site.siteCode}</TableCell>
              <TableCell className="font-medium">{site.name}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{site.addressLine1}</TableCell>
              <TableCell className="text-sm">{site.city}</TableCell>
              <TableCell className="font-mono text-sm">{site.countryCode}</TableCell>
              <TableCell>
                {site.isPrimary && (
                  <Badge variant="default" className="text-xs">Primary</Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
