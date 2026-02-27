import * as React from 'react';
import Link from 'next/link';
import { ArrowDown, ArrowUp, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { KPICatalogEntry, KPITemplate } from '@/lib/kpis/kpi-catalog';
import type { KPIResolverResult } from '@/lib/kpis/kpi-registry.server';

// ─── KPI Card Props ─────────────────────────────────────────────────────────

interface KPICardProps {
  /** Catalog entry defining the KPI's title, template, and optional link. */
  catalog: KPICatalogEntry;
  /** Resolved data for this KPI (value, trend, sparkline, etc.). */
  data: KPIResolverResult;
}

// ─── Component ───────────────────────────────────────────────────────────────

function KPICard({ catalog, data }: KPICardProps) {
  const content = (
    <Card
      className={cn(
        'transition-colors',
        catalog.href && 'hover:border-primary/50 cursor-pointer',
        data.status === 'error' && 'opacity-60',
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {catalog.title}
        </CardTitle>
        {data.status === 'error' && (
          <span className="text-xs text-destructive">Error</span>
        )}
      </CardHeader>
      <CardContent>
        <TemplateRenderer template={catalog.template} data={data} />
      </CardContent>
    </Card>
  );

  if (catalog.href) {
    return <Link href={catalog.href}>{content}</Link>;
  }

  return content;
}

// ─── Template Renderer ──────────────────────────────────────────────────────

function TemplateRenderer({
  template,
  data,
}: {
  template: KPITemplate;
  data: KPIResolverResult;
}) {
  switch (template) {
    case 'value-trend':
      return <ValueTrendTemplate data={data} />;
    case 'value-sparkline':
      return <ValueSparklineTemplate data={data} />;
    case 'ratio':
      return <ValueTrendTemplate data={data} />;
    case 'aging':
      return <AgingTemplate data={data} />;
    case 'count-status':
      return <CountStatusTemplate data={data} />;
    case 'stub':
      return <StubTemplate />;
    default:
      return <ValueTrendTemplate data={data} />;
  }
}

// ─── Value + Trend Template ─────────────────────────────────────────────────

function ValueTrendTemplate({ data }: { data: KPIResolverResult }) {
  return (
    <div className="space-y-1">
      <div className="text-2xl font-bold">{data.formattedValue}</div>
      {data.trend && data.trendValue && (
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
      )}
    </div>
  );
}

// ─── Value + Sparkline Template ─────────────────────────────────────────────

function ValueSparklineTemplate({ data }: { data: KPIResolverResult }) {
  return (
    <div className="space-y-2">
      <div className="text-2xl font-bold">{data.formattedValue}</div>
      {data.sparklineData && data.sparklineData.length > 0 && (
        <MiniSparkline points={data.sparklineData} />
      )}
      {data.trend && data.trendValue && (
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
        </div>
      )}
    </div>
  );
}

// ─── Aging Template ─────────────────────────────────────────────────────────

function AgingTemplate({ data }: { data: KPIResolverResult }) {
  const buckets = data.buckets ?? [];
  const total = buckets.reduce((sum, b) => sum + b.value, 0);

  return (
    <div className="space-y-2">
      <div className="text-2xl font-bold">{data.formattedValue}</div>
      {buckets.length > 0 && (
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

function CountStatusTemplate({ data }: { data: KPIResolverResult }) {
  return (
    <div className="space-y-1">
      <div className="text-2xl font-bold">{data.formattedValue}</div>
      {data.trend && data.trendValue && (
        <div className="flex items-center gap-1 text-xs">
          <TrendIcon trend={data.trend} />
          <span className="text-muted-foreground">{data.trendValue}</span>
        </div>
      )}
    </div>
  );
}

// ─── Stub Template ──────────────────────────────────────────────────────────

function StubTemplate() {
  return (
    <div className="flex items-center gap-2">
      <div className="text-2xl font-bold text-muted-foreground">—</div>
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
