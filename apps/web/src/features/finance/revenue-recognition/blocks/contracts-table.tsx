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

interface RevenueContract {
  id: string;
  contractNumber: string;
  customerName: string;
  recognitionMethod: string;
  currency: string;
  totalAmount: string;
  recognizedAmount: string;
  deferredAmount: string;
  startDate: string;
  endDate: string;
  status: string;
}

export function RevenueContractsTable({ contracts }: { contracts: RevenueContract[] }) {
  return (
    <Card>
      <CardHeader><CardTitle>Revenue Contracts</CardTitle></CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <caption className="sr-only">Revenue contracts</caption>
            <TableHeader>
              <TableRow>
                <TableHead>Contract</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Method</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Recognized</TableHead>
                <TableHead className="text-right">Deferred</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Link href={routes.finance.revenueContractDetail(c.id)} className="font-medium text-primary hover:underline">
                      {c.contractNumber}
                    </Link>
                  </TableCell>
                  <TableCell>{c.customerName}</TableCell>
                  <TableCell><Badge variant="outline">{c.recognitionMethod}</Badge></TableCell>
                  <TableCell className="text-right font-mono">{c.currency} {c.totalAmount}</TableCell>
                  <TableCell className="text-right font-mono">{c.recognizedAmount}</TableCell>
                  <TableCell className="text-right font-mono">{c.deferredAmount}</TableCell>
                  <TableCell className="text-muted-foreground">{c.startDate} — {c.endDate}</TableCell>
                  <TableCell><Badge variant={c.status === 'ACTIVE' ? 'default' : 'secondary'}>{c.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
