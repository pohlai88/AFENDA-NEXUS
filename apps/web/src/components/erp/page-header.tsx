import * as React from 'react';
import Link from 'next/link';
import { ChevronRight, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// ─── Breadcrumb Type ──────────────────────────────────────────────────────────

interface Breadcrumb {
  label: string;
  href?: string;
}

// ─── PageHeader ───────────────────────────────────────────────────────────────

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Page title. */
  title?: string;
  /** Subtitle / description. */
  description?: string;
  /** Breadcrumb trail rendered above the title. */
  breadcrumbs?: Breadcrumb[];
  /** Action buttons rendered on the right. */
  actions?: React.ReactNode;
  /** Whether this page is currently favorited. */
  isFavorite?: boolean;
  /** Toggle favorite for this page. */
  onToggleFavorite?: () => void;
  /**
   * When `true`, hide this component's breadcrumb section.
   * Useful when auto-breadcrumbs are already rendering in the shell header
   * to avoid duplication.
   */
  hideShellBreadcrumbs?: boolean;
}

const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  ({ title, description, breadcrumbs, actions, isFavorite, onToggleFavorite, hideShellBreadcrumbs, children, className, ...props }, ref) => (
    <div ref={ref} className={cn('space-y-1', className)} {...props}>
      {!hideShellBreadcrumbs && breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb">
          <ol className="flex items-center gap-1 text-sm text-muted-foreground">
            {breadcrumbs.map((crumb, i) => (
              <li key={crumb.label} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="h-3 w-3" aria-hidden="true" />}
                {crumb.href ? (
                  <Link href={crumb.href} className="transition-colors hover:text-foreground">
                    {crumb.label}
                  </Link>
                ) : (
                  <span aria-current="page">{crumb.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {children ?? (
              <>
                <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
                {onToggleFavorite && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={onToggleFavorite}
                    aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Star
                      className={cn(
                        'h-4 w-4',
                        isFavorite
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-muted-foreground',
                      )}
                    />
                  </Button>
                )}
              </>
            )}
          </div>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  ),
);
PageHeader.displayName = 'PageHeader';

// ─── Sub-components ───────────────────────────────────────────────────────────

const PageHeaderHeading = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h1
    ref={ref}
    className={cn('text-2xl font-bold tracking-tight', className)}
    {...props}
  />
));
PageHeaderHeading.displayName = 'PageHeaderHeading';

const PageHeaderDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
PageHeaderDescription.displayName = 'PageHeaderDescription';

export { PageHeader, PageHeaderHeading, PageHeaderDescription };
export type { PageHeaderProps, Breadcrumb };
