import Link from 'next/link';
import { routes } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Prepayment {
  id: string;
  invoiceNumber: string;
  supplierName: string;
  currencyCode: string;
  totalAmount: string;
  appliedAmount: string;
  remainingAmount: string;
  status: string;
  invoiceDate: string;
}

export function PrepaymentListTable({ prepayments }: { prepayments: Prepayment[] }) {
  return (
    <Card>
      <CardHeader><CardTitle>Prepayments</CardTitle></CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <caption className="sr-only">Prepayments</caption>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Applied</TableHead>
                <TableHead className="text-right">Remaining</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prepayments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <Link href={routes.finance.prepaymentDetail(p.id)} className="font-medium text-primary hover:underline">
                      {p.invoiceNumber}
                    </Link>
                  </TableCell>
                  <TableCell>{p.supplierName}</TableCell>
                  <TableCell className="text-right font-mono">{p.currencyCode} {p.totalAmount}</TableCell>
                  <TableCell className="text-right font-mono">{p.appliedAmount}</TableCell>
                  <TableCell className="text-right font-mono">{p.remainingAmount}</TableCell>
                  <TableCell>
                    <Badge variant={p.status === 'POSTED' ? 'default' : 'secondary'}>{p.status}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{p.invoiceDate}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
