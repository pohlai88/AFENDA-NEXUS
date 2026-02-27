import * as React from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// ─── Types ───────────────────────────────────────────────────────────────────

interface PaginationProps extends Omit<React.HTMLAttributes<HTMLElement>, 'children'> {
  /** Current 1-based page index. */
  page: number;
  /** Items per page. */
  pageSize: number;
  /** Total number of items across all pages. */
  totalCount: number;
  /** Callback to generate a URL for a given page number. */
  buildHref: (nextPage: number) => string;
  /** Show first/last page buttons. @default false */
  showEndButtons?: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function PaginationButton({
  href,
  disabled,
  label,
  children,
}: {
  href: string;
  disabled: boolean;
  label: string;
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <Button variant="outline" size="icon" className="h-8 w-8" disabled aria-label={label}>
        {children}
      </Button>
    );
  }

  return (
    <Button variant="outline" size="icon" className="h-8 w-8" asChild>
      <Link href={href} aria-label={label}>
        {children}
      </Link>
    </Button>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

const Pagination = React.forwardRef<HTMLElement, PaginationProps>(
  ({ page, pageSize, totalCount, buildHref, showEndButtons = false, className, ...props }, ref) => {
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const hasPrev = page > 1;
    const hasNext = page < totalPages;

    if (totalCount === 0) return null;

    return (
      <nav
        ref={ref}
        aria-label="Pagination"
        className={cn('flex items-center justify-between', className)}
        {...props}
      >
        <p className="text-xs text-muted-foreground tabular-nums">
          {totalCount} result{totalCount !== 1 ? 's' : ''}
        </p>

        <div className="flex items-center gap-1">
          {showEndButtons && (
            <PaginationButton href={buildHref(1)} disabled={!hasPrev} label="First page">
              <ChevronsLeft className="h-4 w-4" />
            </PaginationButton>
          )}

          <PaginationButton href={buildHref(page - 1)} disabled={!hasPrev} label="Previous page">
            <ChevronLeft className="h-4 w-4" />
          </PaginationButton>

          <span className="px-2 text-sm text-muted-foreground tabular-nums">
            Page {page} of {totalPages}
          </span>

          <PaginationButton href={buildHref(page + 1)} disabled={!hasNext} label="Next page">
            <ChevronRight className="h-4 w-4" />
          </PaginationButton>

          {showEndButtons && (
            <PaginationButton href={buildHref(totalPages)} disabled={!hasNext} label="Last page">
              <ChevronsRight className="h-4 w-4" />
            </PaginationButton>
          )}
        </div>
      </nav>
    );
  },
);
Pagination.displayName = 'Pagination';

export { Pagination };
export type { PaginationProps };
