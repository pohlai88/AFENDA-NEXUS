import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { routes } from '@/lib/constants';

const STATUS_OPTIONS = ['ALL', 'ACTIVE', 'RELEASED'] as const;
const TYPE_OPTIONS = ['ALL', 'DUPLICATE', 'MATCH_EXCEPTION', 'VALIDATION', 'APPROVAL', 'FX_RATE', 'MANUAL'] as const;

export function ApHoldFilters({
  status,
  holdType,
  supplierId,
  fromDate,
  toDate,
}: {
  status?: string;
  holdType?: string;
  supplierId?: string;
  fromDate?: string;
  toDate?: string;
}) {
  function filterHref(overrides: Record<string, string | undefined>) {
    const sp = new URLSearchParams();
    const s = overrides.status ?? status;
    const t = overrides.holdType ?? holdType;
    if (s && s !== 'ALL') sp.set('status', s);
    if (t && t !== 'ALL') sp.set('holdType', t);
    if (supplierId) sp.set('supplierId', supplierId);
    if (fromDate) sp.set('fromDate', fromDate);
    if (toDate) sp.set('toDate', toDate);
    return `${routes.finance.holds}?${sp.toString()}`;
  }

  return (
    <>
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Status</p>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((s) => {
            const isActive = (s === 'ALL' && !status) || status === s;
            return (
              <Link key={s} href={filterHref({ status: s })}>
                <Badge variant={isActive ? 'default' : 'outline'} className="cursor-pointer">
                  {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
                </Badge>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Hold Type</p>
        <div className="flex flex-wrap gap-2">
          {TYPE_OPTIONS.map((t) => {
            const isActive = (t === 'ALL' && !holdType) || holdType === t;
            return (
              <Link key={t} href={filterHref({ holdType: t })}>
                <Badge variant={isActive ? 'default' : 'outline'} className="cursor-pointer text-xs">
                  {t === 'ALL' ? 'All' : t.replace(/_/g, ' ')}
                </Badge>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
