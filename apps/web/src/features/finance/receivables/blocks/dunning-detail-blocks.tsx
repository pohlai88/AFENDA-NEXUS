import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export function DunningRunHeader({ run }: { run: { status: string; lettersGenerated: number; totalOutstanding: string; currencyCode: string; createdBy: string; createdAt: string } }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <div><span className="text-xs text-muted-foreground">Status</span><p className="font-medium">{run.status}</p></div>
      <div><span className="text-xs text-muted-foreground">Letters</span><p className="font-medium">{run.lettersGenerated}</p></div>
      <div><span className="text-xs text-muted-foreground">Outstanding</span><p className="font-mono font-medium">{run.currencyCode} {run.totalOutstanding}</p></div>
      <div><span className="text-xs text-muted-foreground">Created</span><p className="font-medium">{new Date(run.createdAt).toLocaleDateString()}</p></div>
    </div>
  );
}

export function DunningLettersTable({ letters }: { letters: Array<{ id: string; customerName: string; dunningLevel: number; totalOverdue: string; currencyCode: string; invoiceCount: number; status: string; sentAt: string | null }> }) {
  if (letters.length === 0) {
    return <p className="py-8 text-center text-muted-foreground">No letters generated in this run.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <caption className="sr-only">Dunning notice details</caption>
        <TableHeader>
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead>Level</TableHead>
            <TableHead className="text-right">Overdue</TableHead>
            <TableHead className="text-right">Invoices</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Sent</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {letters.map((letter) => (
            <TableRow key={letter.id}>
              <TableCell className="font-medium">{letter.customerName}</TableCell>
              <TableCell>{letter.dunningLevel}</TableCell>
              <TableCell className="text-right font-mono">{letter.currencyCode} {letter.totalOverdue}</TableCell>
              <TableCell className="text-right">{letter.invoiceCount}</TableCell>
              <TableCell>{letter.status}</TableCell>
              <TableCell className="text-muted-foreground">{letter.sentAt ? new Date(letter.sentAt).toLocaleDateString() : '—'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
