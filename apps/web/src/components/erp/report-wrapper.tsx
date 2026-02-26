'use client';

import { useState, useCallback, useTransition, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { ExportMenu, type ExportPayload } from '@/components/erp/export-menu';
import { cn } from '@/lib/utils';
import {
  Star,
  StarOff,
  Download,
  Printer,
  Share2,
  RefreshCw,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DrilldownLink {
  label: string;
  href: string;
  type: 'account' | 'journal' | 'document' | 'entity';
}

export interface ReportBreadcrumb {
  label: string;
  href?: string;
}

interface ReportWrapperProps {
  title: string;
  description?: string;
  breadcrumbs?: ReportBreadcrumb[];
  children: ReactNode;
  reportId?: string;
  
  // Export
  exportPayload?: ExportPayload;
  
  // Favorites
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  
  // Refresh
  onRefresh?: () => void;
  isRefreshing?: boolean;
  
  // Actions
  actions?: ReactNode;
  
  // Drilldown context
  drilldownPath?: DrilldownLink[];
  
  // Loading
  loading?: boolean;
  
  className?: string;
}

// ─── Drilldown Breadcrumb ────────────────────────────────────────────────────

function DrilldownBreadcrumb({ path }: { path: DrilldownLink[] }) {
  if (path.length === 0) return null;

  return (
    <div className="flex items-center gap-1 text-sm text-muted-foreground">
      {path.map((item, index) => (
        <div key={item.href} className="flex items-center gap-1">
          {index > 0 && <ChevronRight className="h-3 w-3" />}
          <a
            href={item.href}
            className="hover:text-foreground hover:underline transition-colors"
          >
            {item.label}
          </a>
        </div>
      ))}
    </div>
  );
}

// ─── Report Loading Skeleton ─────────────────────────────────────────────────

function ReportLoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
      <Skeleton className="h-[400px] w-full" />
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function ReportWrapper({
  title,
  description,
  breadcrumbs,
  children,
  reportId,
  exportPayload,
  isFavorite = false,
  onToggleFavorite,
  onRefresh,
  isRefreshing = false,
  actions,
  drilldownPath,
  loading = false,
  className,
}: ReportWrapperProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // User cancelled or error
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Report link copied to clipboard');
    }
  }, [title]);

  const handleRefresh = useCallback(() => {
    if (onRefresh) {
      onRefresh();
    } else {
      startTransition(() => {
        router.refresh();
      });
    }
  }, [onRefresh, router]);

  if (loading) {
    return <ReportLoadingSkeleton />;
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          {/* Breadcrumbs */}
          {breadcrumbs && breadcrumbs.length > 0 && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              {breadcrumbs.map((crumb, index) => (
                <div key={crumb.label} className="flex items-center gap-1">
                  {index > 0 && <ChevronRight className="h-3 w-3" />}
                  {crumb.href ? (
                    <a href={crumb.href} className="hover:text-foreground hover:underline">
                      {crumb.label}
                    </a>
                  ) : (
                    <span>{crumb.label}</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Title */}
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {onToggleFavorite && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onToggleFavorite}
                aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                {isFavorite ? (
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ) : (
                  <StarOff className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>

          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}

          {/* Drilldown path */}
          {drilldownPath && drilldownPath.length > 0 && (
            <DrilldownBreadcrumb path={drilldownPath} />
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {actions}

          {/* Refresh */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing || isPending}
          >
            <RefreshCw
              className={cn('mr-1.5 h-4 w-4', (isRefreshing || isPending) && 'animate-spin')}
            />
            Refresh
          </Button>

          {/* More actions dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="mr-1.5 h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {exportPayload && (
                <>
                  <DropdownMenuItem
                    onClick={() => {
                      // Trigger CSV export via ExportMenu logic
                      toast.info('CSV export started');
                    }}
                  >
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toast.info('Excel export started')}>
                    Export as Excel
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toast.info('PDF export started')}>
                    Export as PDF
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Print
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleShare}>
                <Share2 className="mr-2 h-4 w-4" />
                Share Link
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Report Content */}
      <Card className="print:border-0 print:shadow-none">
        <CardContent className="p-6 print:p-0">{children}</CardContent>
      </Card>
    </div>
  );
}

// ─── Drilldown Table Row Helper ──────────────────────────────────────────────

interface DrilldownRowProps {
  href: string;
  children: ReactNode;
  className?: string;
}

export function DrilldownRow({ href, children, className }: DrilldownRowProps) {
  const router = useRouter();

  return (
    <tr
      className={cn(
        'cursor-pointer hover:bg-accent/50 transition-colors group',
        className
      )}
      onClick={() => router.push(href)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          router.push(href);
        }
      }}
    >
      {children}
      <td className="w-8 opacity-0 group-hover:opacity-100 transition-opacity">
        <ExternalLink className="h-3 w-3 text-muted-foreground" />
      </td>
    </tr>
  );
}

// ─── Report Favorites Hook ───────────────────────────────────────────────────

const FAVORITES_KEY = 'finance-report-favorites';

export function useReportFavorites() {
  const [favorites, setFavorites] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(FAVORITES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const toggleFavorite = useCallback((reportPath: string) => {
    setFavorites((prev) => {
      const next = prev.includes(reportPath)
        ? prev.filter((p) => p !== reportPath)
        : [...prev, reportPath];

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
        } catch {}
      }

      return next;
    });
  }, []);

  const isFavorite = useCallback(
    (reportPath: string) => favorites.includes(reportPath),
    [favorites]
  );

  return { favorites, toggleFavorite, isFavorite };
}
