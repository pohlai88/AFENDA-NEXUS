'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { SlidersHorizontal, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ACTION_BTN, ICON, ICON_SM } from './shell.tokens';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useShellPreferences } from '@/providers/shell-preferences-provider';
import { DENSITY_OPTIONS, THEME_OPTIONS } from '@/lib/shell/display-config.registry';
import { getIcon } from '@/lib/modules/icon-map';

// ─── Popover width — wider for better readability ────────────────────────────

const DISPLAY_POPOVER_W = 'w-72' as const;

// ─── AfendaDisplayCluster ────────────────────────────────────────────────────

/**
 * Display settings popover — Density + Theme.
 *
 * Uses the same PopoverHeader / ScrollArea / segmentation pattern as
 * ModuleNavPopover for a consistent shell popover UX.
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
      <PopoverContent align="end" className={cn(DISPLAY_POPOVER_W, 'p-0')}>
        {/* ─── Header: matches ModuleNavPopover pattern ─── */}
        <PopoverHeader className="border-b px-4 py-3">
          <PopoverTitle className="text-base">Display</PopoverTitle>
        </PopoverHeader>

        {/* ─── Scrollable content with segmented sections ─── */}
        <ScrollArea className="max-h-[min(70vh,28rem)]" type="auto">
          <nav className="flex flex-col" aria-label="Display settings">
            {/* ── Density section ── */}
            <div className="px-2 py-2">
              <p className="mb-1 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Density
              </p>
              <div className="space-y-0.5">
                {DENSITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setDensity(opt.value)}
                    className={cn(
                      'flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground',
                      prefs.density === opt.value && 'bg-accent text-accent-foreground'
                    )}
                  >
                    <div className="flex flex-col items-start gap-0.5">
                      <span className="font-medium">{opt.label}</span>
                      <span className="text-xs text-muted-foreground">{opt.description}</span>
                    </div>
                    {prefs.density === opt.value && (
                      <Check className={cn(ICON_SM, 'shrink-0 text-primary')} />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <Separator />

            {/* ── Theme section ── */}
            <div className="px-2 py-2">
              <p className="mb-1 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Theme
              </p>
              <div className="space-y-0.5">
                {THEME_OPTIONS.map((opt) => {
                  const Icon = getIcon(opt.icon);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setTheme(opt.value)}
                      className={cn(
                        'flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground',
                        theme === opt.value && 'bg-accent text-accent-foreground'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={cn(ICON_SM, 'text-muted-foreground')} aria-hidden="true" />
                        <span className="font-medium">{opt.label}</span>
                      </div>
                      {theme === opt.value && (
                        <Check className={cn(ICON_SM, 'shrink-0 text-primary')} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </nav>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
AfendaDisplayCluster.displayName = 'AfendaDisplayCluster';
