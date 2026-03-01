'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChartCardProps {
  title: string;
  description?: string;
  lastUpdated?: string;
  isLoading?: boolean;
  isEmpty?: boolean;
  error?: Error | string | null;
  onRefresh?: () => void;
  compact?: boolean;
  className?: string;
  children: React.ReactNode;
}

/**
 * ChartCard - Standardized wrapper for all chart widgets
 * 
 * Enforces enterprise requirements:
 * - Loading state (skeleton)
 * - Empty state
 * - Error boundary
 * - Last updated timestamp
 * - Refresh button
 * - Consistent padding/spacing
 */
export function ChartCard({
  title,
  description,
  lastUpdated,
  isLoading,
  isEmpty,
  error,
  onRefresh,
  compact,
  className,
  children,
}: ChartCardProps) {
  // Error state
  if (error) {
    const errorMessage = typeof error === 'string' ? error : error.message;
    return (
      <Card className={cn(compact && 'h-full flex flex-col', className)} data-testid="chart-card" data-state="error">
        <CardHeader className={compact ? 'px-3 py-2' : undefined}>
          <CardTitle className={compact ? 'text-sm font-medium' : undefined}>{title}</CardTitle>
          {description && !compact && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className={cn(compact && 'flex-1 px-3 pb-3', 'flex items-center justify-center')}>
          <div className="text-center space-y-2 py-8">
            <AlertCircle className="h-8 w-8 mx-auto text-destructive" />
            <p className="text-sm text-destructive font-medium">Failed to load chart</p>
            <p className="text-xs text-muted-foreground">{errorMessage}</p>
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                className="mt-2"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (isEmpty) {
    return (
      <Card className={cn(compact && 'h-full flex flex-col', className)} data-testid="chart-card" data-state="empty">
        <CardHeader className={compact ? 'px-3 py-2' : undefined}>
          <CardTitle className={compact ? 'text-sm font-medium' : undefined}>{title}</CardTitle>
          {description && !compact && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className={cn(compact && 'flex-1 px-3 pb-3', 'flex items-center justify-center')}>
          <div className="text-center space-y-2 py-8">
            <p className="text-sm text-muted-foreground">No data available</p>
            <p className="text-xs text-muted-foreground">Try adjusting the date range or filters</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <Card className={cn(compact && 'h-full flex flex-col', className)} data-testid="chart-card" data-state="loading">
        <CardHeader className={compact ? 'px-3 py-2' : undefined}>
          <CardTitle className={compact ? 'text-sm font-medium' : undefined}>{title}</CardTitle>
          {description && !compact && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className={cn(compact && 'flex-1 px-3 pb-3', 'space-y-2')}>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    );
  }

  // Normal state
  return (
    <Card className={cn(compact && 'h-full flex flex-col', className)} data-testid="chart-card" data-state="loaded" aria-label={title}>
      <CardHeader className={compact ? 'px-3 py-2' : undefined}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className={compact ? 'text-sm font-medium' : undefined}>{title}</CardTitle>
            {description && !compact && <CardDescription>{description}</CardDescription>}
          </div>
          <div className="flex items-center gap-2">
            {lastUpdated && !compact && (
              <span className="text-xs text-muted-foreground" title={lastUpdated}>
                {new Date(lastUpdated).toLocaleTimeString()}
              </span>
            )}
            {onRefresh && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={onRefresh}
                title="Refresh data"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className={compact ? 'flex-1 px-3 pb-3 pt-0 min-h-0' : undefined}>
        {children}
      </CardContent>
    </Card>
  );
}
