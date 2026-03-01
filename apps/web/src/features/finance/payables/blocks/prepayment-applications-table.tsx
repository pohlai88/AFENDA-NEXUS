import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Application {
  id: string;
  targetInvoiceNumber: string;
  amount: string;
  appliedAt: string;
}

export function PrepaymentApplicationsTable({ applications }: { applications: Application[] }) {
  if (applications.length === 0) {
    return <p className="py-8 text-center text-muted-foreground">Not yet applied to any invoice.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <Table>
        <caption className="sr-only">Prepayment applications</caption>
        <TableHeader>
          <TableRow>
            <TableHead>Target Invoice</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Applied At</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {applications.map((a) => (
            <TableRow key={a.id}>
              <TableCell className="font-medium">{a.targetInvoiceNumber}</TableCell>
              <TableCell className="text-right font-mono">{a.amount}</TableCell>
              <TableCell className="text-muted-foreground">{new Date(a.appliedAt).toLocaleDateString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
