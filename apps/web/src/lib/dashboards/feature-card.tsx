import * as React from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getIcon } from '@/lib/modules/icon-map';
import type { AttentionSeverity } from '@/lib/attention/attention.types';

// ─── Feature Card Types ──────────────────────────────────────────────────────

export type FeatureCardVariant = 'active' | 'planned';

/**
 * Feature card data model — clean separation between active and planned features.
 */
export interface FeatureCardModel {
  /** Stable feature ID (e.g., 'gl', 'ap', 'ar'). */
  featureId: string;
  /** Display title. */
  title: string;
  /** Optional description. */
  description?: string;
  /** Icon name or React node. */
  icon?: string | React.ReactNode;
  /** Variant: active (with links) or planned (no links). */
  variant: FeatureCardVariant;

  // Active cards only
  /** Primary navigation href (for "View all" link). */
  href?: string;
  /** List of navigable items. */
  items?: Array<{ title: string; href: string }>;

  // Planned cards only
  /** Roadmap metadata. */
  roadmap?: {
    /** Target date or milestone (e.g., 'Q2 2026', 'MVP-2'). */
    target?: string;
    /** Optional longer detail text. */
    detail?: string;
  };
}

/**
 * Feature card signals — live metrics, attention, and badges.
 * Max 2 signals visible by default (attention pill + one metric).
 */
export interface FeatureCardSignals {
  /** Highest attention severity for this feature. */
  severity?: AttentionSeverity;
  /** Total attention count. */
  attentionCount?: number;
  /** Primary metric (e.g., "$1.2M outstanding"). */
  metricPrimary?: string;
  /** Secondary metric (e.g., "12 invoices overdue"). */
  metricSecondary?: string;
  /** Status badge (e.g., "Beta", "New", "Updated"). */
  badge?: 'Beta' | 'New' | 'Updated';
}

interface FeatureCardProps {
  model: FeatureCardModel;
  signals?: FeatureCardSignals;
  /** Max links to display before "View all" (default: 5). */
  maxLinks?: number;
}

// ─── Severity Styling ────────────────────────────────────────────────────────

function getSeverityAccent(severity?: AttentionSeverity): string {
  switch (severity) {
    case 'critical':
      return 'border-l-4 border-l-destructive';
    case 'warning':
      return 'border-l-4 border-l-warning';
    case 'info':
      return 'border-l-4 border-l-info';
    default:
      return '';
  }
}

function getSeverityColor(severity?: AttentionSeverity): string {
  switch (severity) {
    case 'critical':
      return 'text-destructive';
    case 'warning':
      return 'text-warning';
    case 'info':
      return 'text-info';
    default:
      return 'text-muted-foreground';
  }
}

// ─── Feature Card Component ──────────────────────────────────────────────────

function FeatureCard({ model, signals, maxLinks = 5 }: FeatureCardProps) {
  const Icon = typeof model.icon === 'string' ? getIcon(model.icon) : null;
  const isPlanned = model.variant === 'planned';

  // Render signals (max 2 visible)
  const visibleSignals: React.ReactNode[] = [];

  // Priority 1: Attention pill (if present)
  if (signals?.severity && signals?.attentionCount) {
    visibleSignals.push(
      <div
        key="attention"
        className={cn('flex items-center gap-1 text-xs', getSeverityColor(signals.severity))}
      >
        <span className="font-medium">{signals.attentionCount}</span>
        <span className="text-muted-foreground">
          {signals.severity === 'critical' ? 'critical' : 'need attention'}
        </span>
      </div>
    );
  }

  // Priority 2: Primary metric (if no attention, or only 1 signal so far)
  if (visibleSignals.length < 2 && signals?.metricPrimary) {
    visibleSignals.push(
      <div key="metric-primary" className="text-xs text-muted-foreground">
        {signals.metricPrimary}
      </div>
    );
  }

  // Backup: Secondary metric (if only 1 signal so far)
  if (visibleSignals.length < 2 && signals?.metricSecondary) {
    visibleSignals.push(
      <div key="metric-secondary" className="text-xs text-muted-foreground">
        {signals.metricSecondary}
      </div>
    );
  }

  // Limit items display
  const displayItems = model.items?.slice(0, maxLinks) ?? [];
  const hasMore = (model.items?.length ?? 0) > maxLinks;

  return (
    <Card
      className={cn(
        'flex flex-col transition-shadow',
        !isPlanned &&
          'hover:shadow-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
        isPlanned && 'opacity-60',
        getSeverityAccent(signals?.severity)
      )}
      aria-disabled={isPlanned}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {(Icon || typeof model.icon === 'object') && (
              <div
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-md',
                  isPlanned ? 'bg-muted' : 'bg-primary/10'
                )}
              >
                {Icon ? (
                  <Icon
                    className={cn('h-4 w-4', isPlanned ? 'text-muted-foreground' : 'text-primary')}
                    aria-hidden="true"
                  />
                ) : (
                  model.icon
                )}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm truncate">{model.title}</CardTitle>
                {signals?.badge && (
                  <Badge variant="outline" className="text-xs shrink-0">
                    {signals.badge}
                  </Badge>
                )}
              </div>
              {model.description && (
                <CardDescription className="text-xs line-clamp-2">
                  {model.description}
                </CardDescription>
              )}
            </div>
          </div>

          {/* Sub-domain dashboard link — top-right corner */}
          {!isPlanned && model.href && (
            <Link
              href={model.href}
              aria-label={`Go to ${model.title}`}
              className="mt-0.5 shrink-0 rounded-sm p-0.5 text-muted-foreground/50 transition-colors hover:text-foreground hover:bg-accent"
            >
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          )}
        </div>

        {/* Signals row (max 2) */}
        {visibleSignals.length > 0 && (
          <div className="flex items-center gap-3 mt-2 pt-2 border-t">{visibleSignals}</div>
        )}

        {/* Roadmap metadata (planned cards only) */}
        {isPlanned && model.roadmap && (
          <div className="mt-2 pt-2 border-t">
            {model.roadmap.target && (
              <div className="text-xs text-muted-foreground">Target: {model.roadmap.target}</div>
            )}
            {model.roadmap.detail && (
              <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {model.roadmap.detail}
              </div>
            )}
          </div>
        )}
      </CardHeader>

      {/* Active cards: navigable items */}
      {!isPlanned && displayItems.length > 0 && (
        <CardContent className="flex-1">
          <div className="flex flex-col gap-1">
            {displayItems.map((item, i) => (
              <Link
                // eslint-disable-next-line react/no-array-index-key
                key={`${item.href}-${i}`}
                href={item.href}
                className={cn(
                  'rounded-md px-2 py-1.5 text-sm transition-colors',
                  'hover:bg-accent hover:text-accent-foreground'
                )}
              >
                {item.title}
              </Link>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

FeatureCard.displayName = 'FeatureCard';

export { FeatureCard };
export type { FeatureCardProps };
