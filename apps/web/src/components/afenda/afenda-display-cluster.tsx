'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { SlidersHorizontal, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ACTION_BTN, ICON, ICON_SM, POPOVER_DISPLAY_W } from './shell.tokens';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { useShellPreferences } from '@/providers/shell-preferences-provider';
import {
  DENSITY_OPTIONS,
  THEME_OPTIONS,
} from '@/lib/shell/display-config.registry';
import { getIcon } from '@/lib/modules/icon-map';

// ─── AfendaDisplayCluster ────────────────────────────────────────────────────

/**
 * Display settings popover — Density + Theme.
 * Uses Popover for better font readability and touch targets.
 */
export function AfendaDisplayCluster() {
  const { prefs, setDensity } = useShellPreferences();
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className={ACTION_BTN}
              aria-label="Display settings"
            >
              <SlidersHorizontal className={ICON} aria-hidden />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">Display settings</TooltipContent>
      </Tooltip>
      <PopoverContent align="end" className={cn(POPOVER_DISPLAY_W, 'p-0')}>
        <div className="px-4 py-3">
          <h3 className="text-base font-semibold">Display</h3>
        </div>
        <Separator />
        <div className="space-y-1 px-2 py-2">
          <p className="px-2 text-sm font-medium text-muted-foreground">
            Density
          </p>
          {DENSITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setDensity(opt.value)}
              className={cn(
                'flex w-full items-center justify-between rounded-md px-3 py-2.5 text-base transition-colors hover:bg-accent hover:text-accent-foreground',
                prefs.density === opt.value && 'bg-accent text-accent-foreground',
              )}
            >
              <div className="flex flex-col items-start">
                <span className="font-medium">{opt.label}</span>
                <span className="text-sm text-muted-foreground">
                  {opt.description}
                </span>
              </div>
              {prefs.density === opt.value && (
                <Check className={cn(ICON_SM, 'shrink-0 text-primary')} />
              )}
            </button>
          ))}
        </div>
        <Separator />
        <div className="space-y-1 px-2 py-2">
          <p className="px-2 text-sm font-medium text-muted-foreground">
            Theme
          </p>
          {THEME_OPTIONS.map((opt) => {
            const Icon = getIcon(opt.icon);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setTheme(opt.value);
                }}
                className={cn(
                  'flex w-full items-center justify-between rounded-md px-3 py-2.5 text-base transition-colors hover:bg-accent hover:text-accent-foreground',
                  theme === opt.value && 'bg-accent text-accent-foreground',
                )}
              >
                <div className="flex items-center gap-2">
                  <Icon className={ICON_SM} />
                  <span className="font-medium">{opt.label}</span>
                </div>
                {theme === opt.value && (
                  <Check className={cn(ICON_SM, 'shrink-0 text-primary')} />
                )}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
AfendaDisplayCluster.displayName = 'AfendaDisplayCluster';
