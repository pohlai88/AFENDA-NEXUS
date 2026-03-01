import Link from 'next/link';
import { routes } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface DunningRun {
  id: string;
  runDate: string;
  status: string;
  lettersGenerated: number;
  totalOutstanding: string;
  currencyCode: string;
  createdAt: string;
}

export function DunningRunsTable({ runs }: { runs: DunningRun[] }) {
  return (
    <Card>
      <CardHeader><CardTitle>Dunning Runs</CardTitle></CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <caption className="sr-only">Dunning runs</caption>
            <TableHeader>
              <TableRow>
                <TableHead>Run Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Letters</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.map((run) => (
                <TableRow key={run.id}>
                  <TableCell>
                    <Link href={routes.finance.dunningDetail(run.id)} className="font-medium text-primary hover:underline">
                      {run.runDate}
                    </Link>
                  </TableCell>
                  <TableCell>{run.status}</TableCell>
                  <TableCell className="text-right">{run.lettersGenerated}</TableCell>
                  <TableCell className="text-right font-mono">{run.currencyCode} {run.totalOutstanding}</TableCell>
                  <TableCell className="text-muted-foreground">{new Date(run.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
