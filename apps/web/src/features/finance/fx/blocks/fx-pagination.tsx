import Link from 'next/link';
import { routes } from '@/lib/constants';

export function FxPagination({
  page,
  totalPages,
  total,
}: {
  page: number;
  totalPages: number;
  total: number;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between text-sm text-muted-foreground">
      <span>Page {page} of {totalPages} ({total} rates)</span>
      <div className="flex gap-2">
        {page > 1 && (
          <Link href={`${routes.finance.fxRates}?page=${page - 1}`} className="rounded-md border px-3 py-1.5 hover:bg-muted">
            Previous
          </Link>
        )}
        {page < totalPages && (
          <Link href={`${routes.finance.fxRates}?page=${page + 1}`} className="rounded-md border px-3 py-1.5 hover:bg-muted">
            Next
          </Link>
        )}
      </div>
    </div>
  );
}
