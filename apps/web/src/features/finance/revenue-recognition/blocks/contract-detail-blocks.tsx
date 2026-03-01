import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getRequestContext } from '@/lib/auth';
import { getContractMilestones } from '@/features/finance/revenue-recognition/queries/revenue.queries';

export function ContractHeader({ contract }: { contract: { status: string; recognitionMethod: string; currency: string; totalAmount: string; recognizedAmount: string; deferredAmount: string } }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <div><span className="text-xs text-muted-foreground">Status</span><p className="font-medium">{contract.status}</p></div>
      <div><span className="text-xs text-muted-foreground">Method</span><p className="font-medium">{contract.recognitionMethod}</p></div>
      <div><span className="text-xs text-muted-foreground">Total</span><p className="font-mono font-medium">{contract.currency} {contract.totalAmount}</p></div>
      <div><span className="text-xs text-muted-foreground">Deferred</span><p className="font-mono font-medium">{contract.deferredAmount}</p></div>
    </div>
  );
}

export function ContractOverview({ contract }: { contract: { startDate: string; endDate: string; recognizedAmount: string; deferredAccountId: string; revenueAccountId: string; createdAt: string } }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div><span className="text-xs text-muted-foreground">Period</span><p>{contract.startDate} — {contract.endDate}</p></div>
      <div><span className="text-xs text-muted-foreground">Recognized Amount</span><p className="font-mono">{contract.recognizedAmount}</p></div>
      <div><span className="text-xs text-muted-foreground">Deferred Account</span><p className="font-mono text-xs">{contract.deferredAccountId}</p></div>
      <div><span className="text-xs text-muted-foreground">Revenue Account</span><p className="font-mono text-xs">{contract.revenueAccountId}</p></div>
      <div><span className="text-xs text-muted-foreground">Created</span><p>{new Date(contract.createdAt).toLocaleDateString()}</p></div>
    </div>
  );
}

export async function MilestonesSection({ contractId }: { contractId: string }) {
  const ctx = await getRequestContext();
  const result = await getContractMilestones(ctx, contractId);
  if (!result.ok) return <p className="text-sm text-destructive">{result.error.message}</p>;
  const milestones = result.value;
  if (milestones.length === 0) return <p className="py-8 text-center text-muted-foreground">No milestones defined.</p>;
  return (
    <div className="overflow-x-auto">
      <Table>
        <caption className="sr-only">Revenue milestones</caption>
        <TableHeader>
          <TableRow>
            <TableHead>Milestone</TableHead>
            <TableHead>Target Date</TableHead>
            <TableHead className="text-right">Completion</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Recognized</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {milestones.map((m) => (
            <TableRow key={m.id}>
              <TableCell className="font-medium">{m.milestoneName}</TableCell>
              <TableCell>{m.targetDate}</TableCell>
              <TableCell className="text-right">{m.completionPercent}%</TableCell>
              <TableCell className="text-right font-mono">{m.amount}</TableCell>
              <TableCell>
                <Badge variant={m.isRecognized ? 'default' : 'secondary'}>
                  {m.isRecognized ? 'Yes' : 'No'}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
