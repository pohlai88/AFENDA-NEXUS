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
import type { SupplierBankAccountView } from '../queries/ap-supplier.queries';

interface ApSupplierBankAccountsProps {
  accounts: SupplierBankAccountView[];
}

export function ApSupplierBankAccounts({ accounts }: ApSupplierBankAccountsProps) {
  if (accounts.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No bank accounts registered for this supplier.
      </p>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <caption className="sr-only">Supplier bank accounts — {accounts.length} accounts</caption>
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
          {accounts.map((acct) => (
            <TableRow key={acct.id}>
              <TableCell className="font-medium">{acct.bankName}</TableCell>
              <TableCell>{acct.accountName}</TableCell>
              <TableCell className="font-mono text-sm">{acct.accountNumber}</TableCell>
              <TableCell className="font-mono text-sm text-muted-foreground">
                {acct.swiftBic ?? '—'}
              </TableCell>
              <TableCell className="font-mono text-sm">{acct.currencyCode}</TableCell>
              <TableCell>
                {acct.isPrimary && (
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
