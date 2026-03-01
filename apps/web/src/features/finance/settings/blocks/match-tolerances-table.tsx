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

interface MatchTolerance {
  id: string;
  scope: string;
  toleranceBps: number;
  quantityTolerancePercent: number;
  autoHold: boolean;
  isActive: boolean;
  createdAt: string;
}

export function MatchTolerancesTable({ tolerances }: { tolerances: MatchTolerance[] }) {
  return (
    <Card>
      <CardHeader><CardTitle>Match Tolerances</CardTitle></CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <caption className="sr-only">Match tolerances</caption>
            <TableHeader>
              <TableRow>
                <TableHead>Scope</TableHead>
                <TableHead className="text-right">Tolerance (bps)</TableHead>
                <TableHead className="text-right">Qty Tolerance %</TableHead>
                <TableHead>Auto-Hold</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tolerances.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.scope}</TableCell>
                  <TableCell className="text-right font-mono">{t.toleranceBps}</TableCell>
                  <TableCell className="text-right font-mono">{t.quantityTolerancePercent}%</TableCell>
                  <TableCell>
                    <Badge variant={t.autoHold ? 'default' : 'secondary'}>{t.autoHold ? 'Yes' : 'No'}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={t.isActive ? 'default' : 'secondary'}>{t.isActive ? 'Active' : 'Inactive'}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{new Date(t.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
