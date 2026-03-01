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

interface PaymentTerm {
  id: string;
  code: string;
  name: string;
  dueDays: number;
  discountDays: number | null;
  discountPercent: number | null;
  isActive: boolean;
}

export function PaymentTermsTable({ terms }: { terms: PaymentTerm[] }) {
  return (
    <Card>
      <CardHeader><CardTitle>Payment Terms Templates</CardTitle></CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <caption className="sr-only">Payment terms templates</caption>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Due Days</TableHead>
                <TableHead className="text-right">Discount Days</TableHead>
                <TableHead className="text-right">Discount %</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {terms.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <Link href={routes.finance.paymentTermsDetail(t.id)} className="font-medium text-primary hover:underline">
                      {t.code}
                    </Link>
                  </TableCell>
                  <TableCell>{t.name}</TableCell>
                  <TableCell className="text-right">{t.dueDays}</TableCell>
                  <TableCell className="text-right">{t.discountDays ?? '—'}</TableCell>
                  <TableCell className="text-right">{t.discountPercent != null ? `${t.discountPercent}%` : '—'}</TableCell>
                  <TableCell>
                    <Badge variant={t.isActive ? 'default' : 'secondary'}>{t.isActive ? 'Active' : 'Inactive'}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
