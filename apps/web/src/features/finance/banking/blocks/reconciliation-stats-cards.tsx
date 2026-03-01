import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Clock, FileText, AlertTriangle, CheckCircle } from 'lucide-react';
import { getReconciliationStats } from '../queries/banking.queries';
import { getRequestContext } from '@/lib/auth';

// ─── Reconciliation Stats Cards ─────────────────────────────────────────────

export async function ReconciliationStatsCards() {
  const ctx = await getRequestContext();
  const result = await getReconciliationStats(ctx);
  if (!result.ok) return null;

  const stats = result.data;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 text-warning">
            <Clock className="h-4 w-4" />
            <CardDescription>Pending</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.pendingStatements}</div>
          <p className="text-xs text-muted-foreground">statements awaiting import</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 text-blue-500">
            <FileText className="h-4 w-4" />
            <CardDescription>In Progress</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.inProgressStatements}</div>
          <p className="text-xs text-muted-foreground">reconciliations in progress</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <CardDescription>Unmatched Items</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalUnmatchedItems}</div>
          <p className="text-xs text-muted-foreground">transactions to review</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 text-success">
            <CheckCircle className="h-4 w-4" />
            <CardDescription>Days Since Reconciled</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.unreconciledDays}</div>
          <p className="text-xs text-muted-foreground">
            last: {stats.lastReconciledDate?.toLocaleDateString() ?? 'Never'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
