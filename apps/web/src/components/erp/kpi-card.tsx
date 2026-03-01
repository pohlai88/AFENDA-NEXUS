import * as React from 'react';
import Link from 'next/link';
import { ArrowDown, ArrowUp, ChevronRight, Minus, MoreHorizontal } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { KPICatalogEntry, KPITemplate } from '@/lib/kpis/kpi-catalog';
import { getQuickActions } from '@/lib/kpis/kpi-catalog';
import type { KPIResolverResult, KpiIndicator } from '@/lib/kpis/kpi-registry.server';

const GROUP_LABELS: Record<NonNullable<KPICatalogEntry['group']>, string> = {
  cash: 'Cash & Liquidity',
  receivables: 'Receivables',
  payables: 'Payables',
  operations: 'Operations',
};

const INDICATOR_LABELS: Record<KpiIndicator, string> = {
  on_track: 'On track',
  at_risk: 'At risk',
  overdue: 'Overdue',
};

const INDICATOR_VARIANTS: Record<KpiIndicator, string> = {
  on_track: 'bg-success/15 text-success border-success/30',
  at_risk: 'bg-warning/15 text-warning border-warning/30',
  overdue: 'bg-destructive/15 text-destructive border-destructive/30',
};

// ─── KPI Card Props ─────────────────────────────────────────────────────────

interface KPICardProps {
  /** Catalog entry defining the KPI's title, template, and optional link. */
  catalog: KPICatalogEntry;
  /** Resolved data for this KPI (value, trend, sparkline, etc.). */
  data: KPIResolverResult;
  /** Use plain language title when available (e.g. "Money owed" vs "Total Payables"). */
  plainLanguage?: boolean;
  /** Grid width in units (1 or 2). Enables compact layout when 1. */
  gridW?: number;
  /** Grid height in units (1 or 2). Enables compact layout when 1. */
  gridH?: number;
  /** Called when user chooses "Refresh" for error-state cards. */
  onRefresh?: () => void;
}

/** Compact when 1x1; full layout when 2x1, 1x2, or 2x2. */
const isCompact = (w?: number, h?: number) =>
  (w ?? 1) === 1 && (h ?? 1) === 1;

// ─── Component ───────────────────────────────────────────────────────────────

function KPICard({ catalog, data, plainLanguage, gridW, gridH, onRefresh }: KPICardProps) {
  const compact = isCompact(gridW, gridH);
  const displayTitle =
    plainLanguage && catalog.plainTitle ? catalog.plainTitle : catalog.title;
  const quickActions = getQuickActions(catalog);
  const drillTargets = catalog.drillTargets ?? [];
  const hasDrillTargets = drillTargets.length > 0;
  const hasActions = quickActions.length > 0 || catalog.href || hasDrillTargets;
  const isError = data.status === 'error';
  const hasHelperContent =
    catalog.description ||
    data.indicator ||
    hasActions ||
    (isError && !!onRefresh);
  const showFooter = hasActions && !compact;
  const showEmptyState = catalog.emptyState && data.isEmpty === true;

  const bodyContent = showEmptyState && catalog.emptyState ? (
    <div className="flex flex-col gap-2 py-2">
      <p className="text-sm font-medium text-muted-foreground">
        {catalog.emptyState.title}
      </p>
      <p className="text-xs text-muted-foreground">
        {catalog.emptyState.description}
      </p>
      <Button variant="outline" size="sm" className="h-7 w-fit text-xs" asChild>
        <Link href={catalog.emptyState.ctaHref}>{catalog.emptyState.ctaLabel}</Link>
      </Button>
    </div>
  ) : (
    <TemplateRenderer
      template={catalog.template}
      data={data}
      catalog={catalog}
      compact={compact}
    />
  );

  return (
    <TooltipProvider delayDuration={300}>
      <Card
        className={cn(
          'flex min-h-0 flex-col overflow-hidden transition-colors',
          'h-full gap-0! p-0!',
          compact && 'min-h-[100px]',
          !compact && 'min-h-[130px]',
          catalog.href && 'hover:border-primary/50',
          isError && 'opacity-75 ring-1 ring-destructive/20',
        )}
      >
        <CardHeader
          className={cn(
            'flex flex-row items-start justify-between space-y-0 px-4! pt-3!',
            compact ? 'pb-1.5!' : 'pb-2!',
          )}
        >
          <div className="min-w-0 flex-1">
            {!compact && catalog.group && (
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/80">
                {GROUP_LABELS[catalog.group]}
              </span>
            )}
            <CardTitle
              className={cn(
                'font-medium text-muted-foreground truncate block',
                compact ? 'text-xs' : 'text-sm',
              )}
            >
              {displayTitle}
            </CardTitle>
          </div>
          {hasHelperContent && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 rounded-md text-muted-foreground hover:text-foreground"
                  aria-label={`Options for ${displayTitle}`}
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {isError && onRefresh && (
                  <>
                    <DropdownMenuItem onClick={onRefresh}>
                      Refresh
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                {catalog.description && (
                  <>
                    <div className="px-2 py-1.5 text-xs text-muted-foreground">
                      {catalog.description}
                    </div>
                    <DropdownMenuSeparator />
                  </>
                )}
                {data.indicator && (
                  <div className="px-2 py-1 text-xs">
                    <span className="text-muted-foreground">Status: </span>
                    <span
                      className={cn(
                        'rounded px-1 py-0.5 text-[10px] font-medium',
                        data.indicator === 'on_track' && 'text-success',
                        data.indicator === 'at_risk' && 'text-warning',
                        data.indicator === 'overdue' && 'text-destructive',
                      )}
                    >
                      {INDICATOR_LABELS[data.indicator]}
                    </span>
                  </div>
                )}
                {(catalog.href || quickActions.length > 0 || hasDrillTargets) && (
                  <DropdownMenuSeparator />
                )}
                {catalog.href && (
                  <DropdownMenuItem asChild>
                    <Link href={catalog.href}>View details</Link>
                  </DropdownMenuItem>
                )}
                {quickActions.map((action) => (
                  <DropdownMenuItem key={action.href + action.label} asChild>
                    <Link href={action.href}>{action.label}</Link>
                  </DropdownMenuItem>
                ))}
                {drillTargets.map((t) => (
                  <DropdownMenuItem key={t.href + t.label} asChild>
                    <Link href={t.href}>{t.label}</Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </CardHeader>
        <CardContent
          className={cn(
            'flex flex-1 flex-col justify-center px-4! pt-0!',
            compact ? 'pb-3!' : 'pb-4!',
          )}
        >
          {catalog.href ? (
            <Link
              href={catalog.href}
              className="block -m-2 rounded-md p-2 transition-colors hover:bg-muted/50"
              aria-label={`View ${displayTitle} details`}
            >
              {bodyContent}
            </Link>
          ) : (
            bodyContent
          )}
        </CardContent>
        {showFooter && (
          <CardFooter className="flex flex-wrap items-center gap-2 border-t px-4! pt-3! pb-3!">
            {quickActions.map((action) => (
              <Button
                key={action.href + action.label}
                variant="outline"
                size="sm"
                className="h-6 text-xs"
                asChild
              >
                <Link href={action.href} onClick={(e) => e.stopPropagation()}>
                  {action.label}
                </Link>
              </Button>
            ))}
            {hasDrillTargets ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 gap-0.5 px-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Reports
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {catalog.href && (
                    <DropdownMenuItem asChild>
                      <Link href={catalog.href}>View details</Link>
                    </DropdownMenuItem>
                  )}
                  {drillTargets.map((t) => (
                    <DropdownMenuItem key={t.href + t.label} asChild>
                      <Link href={t.href}>{t.label}</Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              catalog.href && (
                <Link
                  href={catalog.href}
                  className="inline-flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  View details
                  <ChevronRight className="h-3 w-3" />
                </Link>
              )
            )}
          </CardFooter>
        )}
      </Card>
    </TooltipProvider>
  );
}

// ─── Template Renderer ──────────────────────────────────────────────────────

function TemplateRenderer({
  template,
  data,
  catalog,
  compact,
}: {
  template: KPITemplate;
  data: KPIResolverResult;
  catalog: KPICatalogEntry;
  compact: boolean;
}) {
  const common = { data, compact };
  switch (template) {
    case 'value-trend':
      return <ValueTrendTemplate {...common} />;
    case 'value-sparkline':
      return <ValueSparklineTemplate {...common} />;
    case 'ratio':
      return <ValueTrendTemplate {...common} />;
    case 'aging':
      return <AgingTemplate {...common} />;
    case 'count-status':
      return <CountStatusTemplate {...common} />;
    case 'bullet':
      return <BulletTemplate data={data} catalog={catalog} compact={compact} />;
    case 'dial':
      return <DialTemplate data={data} catalog={catalog} compact={compact} />;
    case 'speedometer':
      return <SpeedometerTemplate data={data} catalog={catalog} compact={compact} />;
    case 'stub':
      return <StubTemplate />;
    default:
      return <ValueTrendTemplate {...common} />;
  }
}

// ─── Value + Trend Template ─────────────────────────────────────────────────

function ValueTrendTemplate({
  data,
  compact,
}: {
  data: KPIResolverResult;
  compact?: boolean;
}) {
  const comparison = data.comparison;
  return (
    <div className={cn('space-y-1', compact && 'space-y-0.5')}>
      <div className={cn('font-semibold tabular-nums tracking-tight', compact ? 'text-lg' : 'text-2xl')}>
        {data.formattedValue}
      </div>
      {!compact && data.sparklineData && data.sparklineData.length > 0 && (
        <MiniSparkline points={data.sparklineData} />
      )}
      {comparison ? (
        <div className="flex items-center gap-1 text-xs">
          <TrendIcon trend={comparison.trend} />
          <span
            className={cn(
              comparison.trend === 'up' && 'text-trade-up',
              comparison.trend === 'down' && 'text-trade-down',
              comparison.trend === 'flat' && 'text-trade-flat',
            )}
          >
            {comparison.value}
          </span>
          <span className="text-muted-foreground">{comparison.label}</span>
        </div>
      ) : (
        data.trend &&
        data.trendValue && (
          <div className="flex items-center gap-1 text-xs">
            <TrendIcon trend={data.trend} />
            <span
              className={cn(
                data.trend === 'up' && 'text-trade-up',
                data.trend === 'down' && 'text-trade-down',
                data.trend === 'flat' && 'text-trade-flat',
              )}
            >
              {data.trendValue}
            </span>
            <span className="text-muted-foreground">vs last period</span>
          </div>
        )
      )}
    </div>
  );
}

// ─── Value + Sparkline Template ─────────────────────────────────────────────

function ValueSparklineTemplate({
  data,
  compact,
}: {
  data: KPIResolverResult;
  compact?: boolean;
}) {
  const comparison = data.comparison;
  return (
    <div className={cn(compact ? 'space-y-0.5' : 'space-y-2')}>
      <div className={cn('font-semibold tabular-nums tracking-tight', compact ? 'text-lg' : 'text-2xl')}>
        {data.formattedValue}
      </div>
      {!compact && data.sparklineData && data.sparklineData.length > 0 && (
        <MiniSparkline points={data.sparklineData} />
      )}
      {(comparison || (data.trend && data.trendValue)) && (
        <div className="flex items-center gap-1 text-xs">
          <TrendIcon
            trend={comparison?.trend ?? data.trend ?? 'flat'}
          />
          <span
            className={cn(
              (comparison?.trend ?? data.trend) === 'up' && 'text-trade-up',
              (comparison?.trend ?? data.trend) === 'down' && 'text-trade-down',
              (comparison?.trend ?? data.trend) === 'flat' && 'text-trade-flat',
            )}
          >
            {comparison ? comparison.value : data.trendValue}
          </span>
          {comparison && (
            <span className="text-muted-foreground">{comparison.label}</span>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Aging Template ─────────────────────────────────────────────────────────

function AgingTemplate({
  data,
  compact,
}: {
  data: KPIResolverResult;
  compact?: boolean;
}) {
  const buckets = data.buckets ?? [];
  const total = buckets.reduce((sum, b) => sum + b.value, 0);

  return (
    <div className={cn(compact ? 'space-y-0.5' : 'space-y-2')}>
      <div className={cn('font-semibold tabular-nums tracking-tight', compact ? 'text-lg' : 'text-2xl')}>
        {data.formattedValue}
      </div>
      {!compact && buckets.length > 0 && (
        <>
          <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
            {buckets.map((bucket, i) => {
              const pct = total > 0 ? (bucket.value / total) * 100 : 0;
              return (
                <div
                  key={bucket.label}
                  className={cn(
                    'h-full',
                    i === 0 && 'bg-success',
                    i === 1 && 'bg-info',
                    i === 2 && 'bg-warning',
                    i === 3 && 'bg-warning/70',
                    i >= 4 && 'bg-destructive',
                  )}
                  style={{ width: `${pct}%` }}
                />
              );
            })}
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground">
            {buckets.map((bucket) => (
              <span key={bucket.label}>{bucket.label}</span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Count + Status Template ────────────────────────────────────────────────

function CountStatusTemplate({
  data,
  compact,
}: {
  data: KPIResolverResult;
  compact?: boolean;
}) {
  return (
    <div className={cn(compact ? 'space-y-0' : 'space-y-1')}>
      <div className={cn('font-semibold tabular-nums tracking-tight', compact ? 'text-lg' : 'text-2xl')}>
        {data.formattedValue}
      </div>
      {data.trend && data.trendValue && (
        <div className="flex items-center gap-1 text-xs">
          <TrendIcon trend={data.trend} />
          <span className="text-muted-foreground">{data.trendValue}</span>
        </div>
      )}
    </div>
  );
}

// ─── Bullet Template (Zoho-style value vs target) ───────────────────────────

function BulletTemplate({
  data,
  catalog,
  compact,
}: {
  data: KPIResolverResult;
  catalog: KPICatalogEntry;
  compact?: boolean;
}) {
  const target = catalog.targetValue ?? 0;
  const raw = parseFloat(data.value) || 0;
  const maxVal = Math.max(raw, target, 1);
  const pct = maxVal > 0 ? Math.min((raw / maxVal) * 100, 100) : 0;
  const targetPct = maxVal > 0 ? Math.min((target / maxVal) * 100, 100) : 0;
  const thresholds = catalog.thresholds ?? [];
  const valueVsTargetPct = target > 0 ? (raw / target) * 100 : pct;
  const colorForPct = (p: number) => {
    const t = [...thresholds].sort((a, b) => a.value - b.value);
    for (let i = t.length - 1; i >= 0; i--) {
      if (p >= t[i]!.value) return t[i]!.color;
    }
    return 'success';
  };
  const barColor =
    colorForPct(valueVsTargetPct) === 'success'
      ? 'bg-success'
      : colorForPct(valueVsTargetPct) === 'warning'
        ? 'bg-warning'
        : 'bg-destructive';

  return (
    <div className={cn(compact ? 'space-y-0.5' : 'space-y-2')}>
      <div className="flex items-baseline justify-between gap-2">
        <span className={cn('font-semibold tabular-nums tracking-tight', compact ? 'text-lg' : 'text-2xl')}>
          {data.formattedValue}
        </span>
        {!compact && target > 0 && (
          <span className="text-xs text-muted-foreground">
            Target: {target.toLocaleString()}
          </span>
        )}
      </div>
      {!compact && (
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn('h-full rounded-full transition-all', barColor)}
          style={{ width: `${pct}%` }}
        />
        {target > 0 && targetPct < 100 && (
          <div
            className="absolute top-0 h-full w-0.5 bg-foreground/60"
            style={{ left: `${targetPct}%` }}
            aria-hidden
          />
        )}
      </div>
      )}
      {data.trendValue && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <TrendIcon trend={data.trend ?? 'flat'} />
          {data.trendValue}
        </div>
      )}
    </div>
  );
}

// ─── Dial Template (Zoho-style circular gauge) ──────────────────────────────

function DialTemplate({
  data,
  catalog,
  compact,
}: {
  data: KPIResolverResult;
  catalog: KPICatalogEntry;
  compact?: boolean;
}) {
  const min = catalog.minValue ?? 0;
  const max = catalog.maxValue ?? 100;
  const raw = parseFloat(data.value) || 0;
  const pct = max > min ? Math.min(Math.max((raw - min) / (max - min), 0), 1) * 100 : 0;
  const thresholds = catalog.thresholds ?? [
    { value: 33, color: 'success' as const },
    { value: 66, color: 'warning' as const },
    { value: 100, color: 'destructive' as const },
  ];
  const colorForPct = (p: number) => {
    const t = [...thresholds].sort((a, b) => a.value - b.value);
    for (let i = t.length - 1; i >= 0; i--) {
      if (p >= t[i]!.value) return t[i]!.color;
    }
    return 'success';
  };
  const strokeColor =
    colorForPct(pct) === 'success'
      ? 'stroke-success'
      : colorForPct(pct) === 'warning'
        ? 'stroke-warning'
        : 'stroke-destructive';
  const r = compact ? 28 : 36;
  const circumference = 2 * Math.PI * r;
  const strokeDash = (pct / 100) * circumference;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-lg font-semibold tabular-nums tracking-tight">{data.formattedValue}</span>
        {data.trendValue && (
          <span className="text-xs text-muted-foreground">{data.trendValue}</span>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative size-24">
        <svg viewBox="0 0 100 100" className="size-full -rotate-90">
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-muted"
          />
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            className={cn('transition-all', strokeColor)}
            strokeDasharray={circumference}
            strokeDashoffset={circumference - strokeDash}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-semibold tabular-nums tracking-tight">{data.formattedValue}</span>
        </div>
      </div>
      {data.trendValue && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <TrendIcon trend={data.trend ?? 'flat'} />
          {data.trendValue}
        </div>
      )}
    </div>
  );
}

// ─── Speedometer Template (180° arc, red/yellow/green zones) ──────────────────

function SpeedometerTemplate({
  data,
  catalog,
  compact,
}: {
  data: KPIResolverResult;
  catalog: KPICatalogEntry;
  compact?: boolean;
}) {
  const min = catalog.minValue ?? 0;
  const max = catalog.maxValue ?? 100;
  const raw = parseFloat(data.value) || 0;
  const pct = max > min ? Math.min(Math.max((raw - min) / (max - min), 0), 1) * 100 : 0;
  const thresholds = catalog.thresholds ?? [
    { value: 33, color: 'success' as const },
    { value: 66, color: 'warning' as const },
    { value: 100, color: 'destructive' as const },
  ];
  const colorForPct = (p: number) => {
    const t = [...thresholds].sort((a, b) => a.value - b.value);
    for (let i = t.length - 1; i >= 0; i--) {
      if (p >= t[i]!.value) return t[i]!.color;
    }
    return 'success';
  };
  const strokeColor =
    colorForPct(pct) === 'success'
      ? 'stroke-success'
      : colorForPct(pct) === 'warning'
        ? 'stroke-warning'
        : 'stroke-destructive';
  const r = 45;
  const circumference = Math.PI * r;
  const strokeDash = (pct / 100) * circumference;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-lg font-semibold tabular-nums tracking-tight">{data.formattedValue}</span>
        {data.trendValue && (
          <span className="text-xs text-muted-foreground">{data.trendValue}</span>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-20 w-full max-w-[140px]">
        <svg viewBox="0 0 100 60" className="size-full">
          <path
            d={`M 10 55 A ${r} ${r} 0 0 1 90 55`}
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            className="text-muted"
          />
          <path
            d={`M 10 55 A ${r} ${r} 0 0 1 90 55`}
            fill="none"
            strokeWidth="10"
            strokeLinecap="round"
            className={cn('transition-all', strokeColor)}
            strokeDasharray={circumference}
            strokeDashoffset={circumference - strokeDash}
          />
        </svg>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
          <span className="text-lg font-semibold tabular-nums tracking-tight">{data.formattedValue}</span>
        </div>
      </div>
      {data.trendValue && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <TrendIcon trend={data.trend ?? 'flat'} />
          {data.trendValue}
        </div>
      )}
    </div>
  );
}

// ─── Stub Template ──────────────────────────────────────────────────────────

function StubTemplate() {
  return (
    <div className="flex items-center gap-2">
      <div className="text-2xl font-semibold tabular-nums text-muted-foreground">—</div>
      <span className="text-xs text-muted-foreground">Coming soon</span>
    </div>
  );
}

// ─── Shared Components ──────────────────────────────────────────────────────

function TrendIcon({ trend }: { trend: 'up' | 'down' | 'flat' }) {
  if (trend === 'up') return <ArrowUp className="h-3 w-3 text-trade-up" />;
  if (trend === 'down') return <ArrowDown className="h-3 w-3 text-trade-down" />;
  return <Minus className="h-3 w-3 text-trade-flat" />;
}

function MiniSparkline({ points }: { points: number[] }) {
  if (points.length < 2) return null;

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const width = 120;
  const height = 24;

  const pathData = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * width;
      const y = height - ((p - min) / range) * height;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="text-primary"
      role="img"
      aria-label="Sparkline chart"
    >
      <path d={pathData} fill="none" stroke="currentColor" strokeWidth={1.5} />
    </svg>
  );
}
MiniSparkline.displayName = 'MiniSparkline';

export { KPICard };
export type { KPICardProps };
