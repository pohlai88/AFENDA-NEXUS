import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { routes } from '@/lib/constants';

const STATUS_OPTIONS = ['ALL', 'ACTIVE', 'ON_HOLD', 'INACTIVE'] as const;

export function SupplierFilters({
  currentStatus,
  q,
}: {
  currentStatus?: string;
  q?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((s) => {
          const isActive = (s === 'ALL' && !currentStatus) || currentStatus === s;
          const sp = new URLSearchParams();
          if (s !== 'ALL') sp.set('status', s);
          if (q) sp.set('q', q);
          return (
            <Link key={s} href={`${routes.finance.suppliers}?${sp.toString()}`}>
              <Badge variant={isActive ? 'default' : 'outline'} className="cursor-pointer">
                {s === 'ALL' ? 'All' : s.replace(/_/g, ' ').charAt(0) + s.replace(/_/g, ' ').slice(1).toLowerCase()}
              </Badge>
            </Link>
          );
        })}
      </div>

      <form className="ml-auto flex gap-2" action={routes.finance.suppliers} method="GET">
        {currentStatus && currentStatus !== 'ALL' && <input type="hidden" name="status" value={currentStatus} />}
        <Input name="q" defaultValue={q} placeholder="Search suppliers…" className="w-64" />
        <Button type="submit" variant="outline" size="sm">Search</Button>
      </form>
    </div>
  );
}
