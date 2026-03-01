import { Badge } from '@/components/ui/badge';
import { getRequestContext } from '@/lib/auth';
import { getBenchmarkStudies } from '@/features/finance/transfer-pricing/queries/transfer-pricing.queries';

export function KPI({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}

export async function BenchmarksList({ policyId }: { policyId: string }) {
  const ctx = await getRequestContext();
  const result = await getBenchmarkStudies(ctx, policyId);

  if (!result.ok) {
    return <p className="text-sm text-destructive">{result.error.message}</p>;
  }

  const studies = result.value.data;

  if (studies.length === 0) {
    return <p className="text-sm text-muted-foreground">No benchmark studies found.</p>;
  }

  return (
    <div className="space-y-3">
      {studies.map((s) => (
        <div key={s.id} className="rounded-lg border p-4 space-y-1">
          <div className="flex items-center justify-between">
            <p className="font-medium">{s.studyNumber}</p>
            <Badge variant="outline">{s.isWithinRange ? 'In Range' : 'Out of Range'}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Median: {s.quartiles?.median ?? '—'}% · IQR: {s.quartiles?.lq ?? '—'}% – {s.quartiles?.uq ?? '—'}%
          </p>
          <p className="text-xs text-muted-foreground">
            Source: {s.studyProvider ?? '—'} · {s.comparableSetSize ?? 0} comparables
          </p>
        </div>
      ))}
    </div>
  );
}
