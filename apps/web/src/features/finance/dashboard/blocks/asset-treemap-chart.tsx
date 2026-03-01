'use client';

import { ChartCard } from '@/components/charts/chart-card';
import { ChartContainer, type ChartConfig } from '@/components/ui/chart';
import { Treemap, ResponsiveContainer } from 'recharts';
import { formatChartValue } from './chart-utils';
import type { ChartParams, DrilldownTarget } from '@/components/charts';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useState } from 'react';

/**
 * Asset treemap node
 */
interface AssetTreemapNode {
  name: string;
  value: number;       // Net book value
  category?: string;   // Asset category (e.g. "Equipment", "Vehicles")
  location?: string;   // Physical location
  book?: string;       // Book (GAAP, IFRS, Tax)
  children?: AssetTreemapNode[];
}

interface AssetTreemapChartProps {
  data: AssetTreemapNode[];
  params: ChartParams;
  compact?: boolean;
  gridW?: number;
  gridH?: number;
  onDrilldown?: (target: DrilldownTarget) => void;
  lastUpdated?: string;
  isLoading?: boolean;
  error?: Error | null;
}

const TREEMAP_CONFIG = {
  value: { label: 'Net Book Value', color: 'var(--chart-1)' },
} satisfies ChartConfig;

// Generate colors from chart palette
const COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--chart-6)',
];

/**
 * Custom Treemap Content
 */
const CustomTreemapContent = (props: Record<string, unknown>) => {
  const { x, y, width, height, index, name, value } = props as {
    x: number; y: number; width: number; height: number;
    index: number; name: string; value: number;
  };
  
  if (width < 40 || height < 40) return null;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: COLORS[index % COLORS.length],
          stroke: 'var(--background)',
          strokeWidth: 2,
          opacity: 0.9,
        }}
      />
      {width > 60 && height > 40 && (
        <>
          <text
            x={x + width / 2}
            y={y + height / 2 - 8}
            textAnchor="middle"
            fill="var(--background)"
            fontSize={12}
            fontWeight="bold"
          >
            {name}
          </text>
          <text
            x={x + width / 2}
            y={y + height / 2 + 8}
            textAnchor="middle"
            fill="var(--background)"
            fontSize={10}
          >
            {formatChartValue(value)}
          </text>
        </>
      )}
    </g>
  );
};

/**
 * Asset Depreciation Treemap
 * 
 * Enterprise asset portfolio visualization:
 * - Net book value by asset
 * - Toggle grouping: category / location / book
 * - Color-coded by group
 * 
 * Drilldown: Fixed assets list filtered by selected node
 */
export function AssetTreemapChart({
  data,
  _params,
  compact,
  _gridW = 2,
  _gridH = 2,
  onDrilldown,
  lastUpdated,
  isLoading,
  error,
}: AssetTreemapChartProps) {
  const [groupBy, setGroupBy] = useState<'category' | 'location' | 'book'>('category');

  const handleGroupChange = (value: string) => {
    if (value && (value === 'category' || value === 'location' || value === 'book')) {
      setGroupBy(value);
    }
  };

  // Transform data based on groupBy
  const getGroupedData = (): AssetTreemapNode[] => {
    const grouped = new Map<string, AssetTreemapNode[]>();

    const flattenTree = (nodes: AssetTreemapNode[]): AssetTreemapNode[] => {
      return nodes.flatMap(node => 
        node.children ? [node, ...flattenTree(node.children)] : [node]
      );
    };

    const allNodes = flattenTree(data);

    allNodes.forEach(node => {
      const key = groupBy === 'category' 
        ? node.category || 'Other'
        : groupBy === 'location'
        ? node.location || 'Unknown'
        : node.book || 'Default';
      
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)?.push(node);
    });

    return Array.from(grouped.entries()).map(([name, nodes]) => ({
      name,
      value: nodes.reduce((sum, node) => sum + node.value, 0),
      children: nodes,
    }));
  };

  const groupedData = getGroupedData();

  return (
    <ChartCard
      title="Asset Portfolio"
      description={`Grouped by ${groupBy}`}
      lastUpdated={lastUpdated}
      isLoading={isLoading}
      isEmpty={!data || data.length === 0}
      error={error}
      compact={compact}
    >
      {/* Group toggle */}
      {!compact && (
        <div className="mb-2 flex justify-end">
          <ToggleGroup
            type="single"
            value={groupBy}
            onValueChange={handleGroupChange}
            size="sm"
          >
            <ToggleGroupItem value="category" aria-label="By Category">
              Category
            </ToggleGroupItem>
            <ToggleGroupItem value="location" aria-label="By Location">
              Location
            </ToggleGroupItem>
            <ToggleGroupItem value="book" aria-label="By Book">
              Book
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      )}

      <ChartContainer
        config={TREEMAP_CONFIG}
        className={compact ? 'h-full w-full min-h-[160px]' : 'h-[300px] w-full'}
      >
        <ResponsiveContainer width="100%" height="100%">
          <Treemap
            data={groupedData}
            dataKey="value"
            aspectRatio={4 / 3}
            stroke="var(--background)"
            content={<CustomTreemapContent />}
            onClick={(node) => {
              if (onDrilldown) {
                onDrilldown({ 
                  kind: 'list', 
                  entity: 'asset',
                  preset: groupBy === 'category' 
                    ? `category:${node.name}`
                    : groupBy === 'location'
                    ? `location:${node.name}`
                    : `book:${node.name}`
                });
              }
            }}
          />
        </ResponsiveContainer>
      </ChartContainer>
    </ChartCard>
  );
}
