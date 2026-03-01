'use client';

import { ChartCard } from '@/components/charts/chart-card';
import { ChartContainer, type ChartConfig } from '@/components/ui/chart';
import { Sankey, Tooltip, ResponsiveContainer } from 'recharts';
import { formatChartValue } from './chart-utils';
import type { ChartParams, DrilldownTarget } from '@/components/charts';

/**
 * Sankey node
 */
interface SankeyNode {
  name: string;
}

/**
 * Sankey link (flow between nodes)
 */
interface SankeyLink {
  source: number;
  target: number;
  value: number;
}

/**
 * Sankey data structure
 */
interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

interface CashFlowSankeyChartProps {
  data: SankeyData;
  params: ChartParams;
  compact?: boolean;
  gridW?: number;
  gridH?: number;
  onDrilldown?: (target: DrilldownTarget) => void;
  lastUpdated?: string;
  isLoading?: boolean;
  error?: Error | null;
}

const SANKEY_CONFIG = {
  inflow: { label: 'Inflow', color: 'var(--chart-5)' },
  outflow: { label: 'Outflow', color: 'var(--chart-3)' },
  internal: { label: 'Internal', color: 'var(--chart-2)' },
} satisfies ChartConfig;

/**
 * Cash Flow Sankey Diagram
 * 
 * Enterprise cash flow visualization (Oracle-inspired):
 * - Operating activities
 * - Investing activities
 * - Financing activities
 * - Beginning/Ending cash
 * 
 * Drilldown: Cash flow statement
 */
export function CashFlowSankeyChart({
  data,
  _params,
  compact,
  _gridW = 4,
  _gridH = 2,
  onDrilldown,
  lastUpdated,
  isLoading,
  error,
}: CashFlowSankeyChartProps) {
  // Custom tooltip for Sankey
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: Record<string, unknown> }> }) => {
    if (!active || !payload || !payload.length) return null;

    const entry = payload[0].payload;
    const source = (entry.source as { name?: string })?.name || '';
    const target = (entry.target as { name?: string })?.name || '';
    const value = (entry.value as number) || 0;

    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <div className="flex flex-col gap-1 text-xs">
          <div className="font-medium">{source} → {target}</div>
          <div className="font-mono tabular-nums text-muted-foreground">
            {formatChartValue(value)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <ChartCard
      title="Cash Flow Sankey"
      description="Cash flow visualization across operating, investing, and financing activities"
      lastUpdated={lastUpdated}
      isLoading={isLoading}
      isEmpty={!data || !data.nodes || data.nodes.length === 0}
      error={error}
      compact={compact}
    >
      <ChartContainer
        config={SANKEY_CONFIG}
        className={compact ? 'h-full w-full min-h-[200px]' : 'h-[320px] w-full'}
      >
        <ResponsiveContainer width="100%" height="100%">
          <Sankey
            data={data}
            node={{
              fill: 'hsl(var(--chart-2))',
              fillOpacity: 0.8,
            }}
            link={{
              stroke: 'hsl(var(--chart-1))',
              strokeOpacity: 0.3,
            }}
            nodePadding={compact ? 30 : 50}
            margin={compact ? { top: 10, right: 10, bottom: 10, left: 10 } : { top: 20, right: 20, bottom: 20, left: 20 }}
            onClick={() => {
              if (onDrilldown) {
                onDrilldown({ kind: 'report', reportId: 'cashflow' });
              }
            }}
          >
            <Tooltip content={<CustomTooltip />} />
          </Sankey>
        </ResponsiveContainer>
      </ChartContainer>
    </ChartCard>
  );
}
