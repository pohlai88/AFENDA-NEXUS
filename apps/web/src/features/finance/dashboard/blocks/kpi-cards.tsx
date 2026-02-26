'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus, ChevronRight } from 'lucide-react';
import type { KPICard } from '../types';
import { StaggerContainer, StaggerItem } from '@/components/motion';

// ─── Sparkline Component ─────────────────────────────────────────────────────

function Sparkline({ data, trend }: { data: number[]; trend?: 'up' | 'down' | 'flat' }) {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const height = 32;
  const width = 80;

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');

  const strokeColor =
    trend === 'up'
      ? 'var(--success)'
      : trend === 'down'
        ? 'var(--destructive)'
        : 'var(--muted-foreground)';

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={strokeColor}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── KPI Card Component ──────────────────────────────────────────────────────

function KPICardItem({ kpi }: { kpi: KPICard }) {
  const TrendIcon =
    kpi.trend === 'up' ? TrendingUp : kpi.trend === 'down' ? TrendingDown : Minus;

  const trendColorClass =
    kpi.trend === 'up'
      ? kpi.trendIsGood
        ? 'text-green-600 dark:text-green-400'
        : 'text-red-600 dark:text-red-400'
      : kpi.trend === 'down'
        ? kpi.trendIsGood
          ? 'text-green-600 dark:text-green-400'
          : 'text-red-600 dark:text-red-400'
        : 'text-muted-foreground';

  const content = (
    <Card
      className={cn(
        'relative overflow-hidden transition-colors',
        kpi.href && 'hover:bg-accent/50 cursor-pointer'
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {kpi.title}
        </CardTitle>
        {kpi.sparklineData && (
          <Sparkline data={kpi.sparklineData} trend={kpi.trend} />
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <div>
            <div className="text-2xl font-bold tabular-nums">{kpi.formattedValue}</div>
            {kpi.changePercent !== undefined && (
              <div className={cn('flex items-center gap-1 text-xs', trendColorClass)}>
                <TrendIcon className="h-3 w-3" />
                <span>
                  {kpi.changePercent > 0 ? '+' : ''}
                  {kpi.changePercent.toFixed(1)}%
                </span>
                {kpi.changeLabel && (
                  <span className="text-muted-foreground">{kpi.changeLabel}</span>
                )}
              </div>
            )}
          </div>
          {kpi.href && (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (kpi.href) {
    return <Link href={kpi.href}>{content}</Link>;
  }

  return content;
}

// ─── KPI Cards Grid ──────────────────────────────────────────────────────────

interface KPICardsProps {
  kpis: KPICard[];
}

export function KPICards({ kpis }: KPICardsProps) {
  return (
    <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi) => (
        <StaggerItem key={kpi.id}>
          <KPICardItem kpi={kpi} />
        </StaggerItem>
      ))}
    </StaggerContainer>
  );
}
