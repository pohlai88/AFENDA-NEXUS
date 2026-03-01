import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface PaymentTermLine {
  id: string;
  sequence: number;
  duePercent: number;
  dueDays: number;
  discountDays: number | null;
  discountPercent: number | null;
}

export function PaymentTermsLinesTable({ lines }: { lines: PaymentTermLine[] }) {
  if (lines.length === 0) {
    return <p className="py-8 text-center text-muted-foreground">No payment lines defined.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <Table>
        <caption className="sr-only">Payment terms lines</caption>
        <TableHeader>
          <TableRow>
            <TableHead>#</TableHead>
            <TableHead className="text-right">Due %</TableHead>
            <TableHead className="text-right">Due Days</TableHead>
            <TableHead className="text-right">Disc Days</TableHead>
            <TableHead className="text-right">Disc %</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lines.map((l) => (
            <TableRow key={l.id}>
              <TableCell>{l.sequence}</TableCell>
              <TableCell className="text-right">{l.duePercent}%</TableCell>
              <TableCell className="text-right">{l.dueDays}</TableCell>
              <TableCell className="text-right">{l.discountDays ?? '—'}</TableCell>
              <TableCell className="text-right">{l.discountPercent != null ? `${l.discountPercent}%` : '—'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
