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
import { EmptyState } from '@/components/erp/empty-state';
import { Landmark } from 'lucide-react';
import type { PortalBankAccount } from '../queries/portal.queries';

interface PortalBankAccountListProps {
  data: PortalBankAccount[];
}

export function PortalBankAccountList({ data }: PortalBankAccountListProps) {
  if (data.length === 0) {
    return <EmptyState contentKey="portal.bankAccounts" constraint="table" icon={Landmark} />;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <caption className="sr-only">Bank accounts — {data.length} accounts</caption>
        <TableHeader>
          <TableRow>
            <TableHead>Bank</TableHead>
            <TableHead>Account Name</TableHead>
            <TableHead>Account Number</TableHead>
            <TableHead>SWIFT/BIC</TableHead>
            <TableHead>Currency</TableHead>
            <TableHead>Primary</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((acct) => (
            <TableRow key={acct.id}>
              <TableCell className="font-medium">{acct.bankName}</TableCell>
              <TableCell>{acct.accountName}</TableCell>
              <TableCell className="font-mono text-sm">{acct.accountNumber}</TableCell>
              <TableCell className="font-mono text-sm text-muted-foreground">
                {acct.swiftBic ?? '\u2014'}
              </TableCell>
              <TableCell>{acct.currencyCode}</TableCell>
              <TableCell>
                {acct.isPrimary && (
                  <Badge variant="default" className="text-xs">
                    Primary
                  </Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
