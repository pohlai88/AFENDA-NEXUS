import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export function KPI({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}

export function fmt(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

interface ScheduleEntry {
  id: string;
  dueDate: string;
  principalDue: number;
  interestDue: number;
  totalDue: number;
  status: string;
}

export function ScheduleTable({ schedule, currency }: { schedule: ScheduleEntry[]; currency: string }) {
  if (!schedule.length) {
    return <p className="text-sm text-muted-foreground">No repayment schedule entries.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <caption className="sr-only">IC loan repayment schedule</caption>
        <TableHeader>
          <TableRow>
            <TableHead>Due Date</TableHead>
            <TableHead>Principal</TableHead>
            <TableHead>Interest</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {schedule.map((e) => (
            <TableRow key={e.id}>
              <TableCell>{new Date(e.dueDate).toLocaleDateString()}</TableCell>
              <TableCell>{fmt(e.principalDue, currency)}</TableCell>
              <TableCell>{fmt(e.interestDue, currency)}</TableCell>
              <TableCell className="font-medium">{fmt(e.totalDue, currency)}</TableCell>
              <TableCell><Badge variant="outline">{e.status}</Badge></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
