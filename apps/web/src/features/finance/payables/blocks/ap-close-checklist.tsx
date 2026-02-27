'use client';

import { CheckCircle2, XCircle, AlertTriangle, MinusCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ApCloseChecklist, CloseChecklistItem } from '../queries/ap-close.queries';

interface ApCloseChecklistViewProps {
  checklist: ApCloseChecklist;
}

const STATUS_CONFIG: Record<CloseChecklistItem['status'], { icon: typeof CheckCircle2; color: string; label: string }> = {
  PASS: { icon: CheckCircle2, color: 'text-success', label: 'Pass' },
  FAIL: { icon: XCircle, color: 'text-destructive', label: 'Fail' },
  WARNING: { icon: AlertTriangle, color: 'text-warning', label: 'Warning' },
  SKIPPED: { icon: MinusCircle, color: 'text-muted-foreground', label: 'Skipped' },
};

export function ApCloseChecklistView({ checklist }: ApCloseChecklistViewProps) {
  return (
    <div className="space-y-4">
      {/* Summary badges */}
      <div className="flex flex-wrap gap-3">
        <Badge variant="default" className="bg-success">
          {checklist.passCount} Passed
        </Badge>
        {checklist.failCount > 0 && (
          <Badge variant="destructive">
            {checklist.failCount} Failed
          </Badge>
        )}
        {checklist.warningCount > 0 && (
          <Badge variant="outline" className="border-warning text-warning">
            {checklist.warningCount} Warnings
          </Badge>
        )}
      </div>

      {/* Checklist items */}
      <div className="space-y-2">
        {checklist.items.map((item) => {
          const config = STATUS_CONFIG[item.status];
          const Icon = config.icon;

          return (
            <Card key={item.id}>
              <CardContent className="flex items-start gap-3 py-3">
                <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', config.color)} />
                <div className="flex-1 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{item.label}</p>
                    {item.count !== undefined && (
                      <span className="text-xs tabular-nums text-muted-foreground">
                        ({item.count})
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                  {item.details && (
                    <p className="text-xs text-muted-foreground italic">{item.details}</p>
                  )}
                </div>
                <Badge variant="outline" className="shrink-0 text-xs">
                  {config.label}
                </Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
