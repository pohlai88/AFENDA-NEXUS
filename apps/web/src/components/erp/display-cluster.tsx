'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { SlidersHorizontal, Sun, Moon, Monitor, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useShellPreferences } from '@/providers/shell-preferences-provider';
import type { DensityProfile } from '@/lib/shell/shell-preferences.types';

// ─── Density options ─────────────────────────────────────────────────────────

const DENSITY_OPTIONS: { value: DensityProfile; label: string; description: string }[] = [
  { value: 'default', label: 'Default', description: 'Standard spacing' },
  { value: 'compact', label: 'Compact', description: 'Reduced whitespace' },
  { value: 'ultra', label: 'Ultra', description: 'Minimal spacing' },
  { value: 'touch', label: 'Touch', description: 'Larger tap targets' },
];

// ─── Theme options ───────────────────────────────────────────────────────────

const THEME_OPTIONS: {
  value: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];

// ─── DisplayCluster ──────────────────────────────────────────────────────────

/**
 * Single dropdown that merges Density + Theme controls.
 * Replaces the standalone `ThemeToggle` in the header, collapsing
 * 2 header buttons into 1.
 */
export function DisplayCluster() {
  const { prefs, setDensity } = useShellPreferences();
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          aria-label="Display settings"
        >
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {/* Density sub-group */}
        <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
          Density
        </DropdownMenuLabel>
        <DropdownMenuGroup>
          {DENSITY_OPTIONS.map((opt) => (
            <DropdownMenuItem
              key={opt.value}
              onClick={() => setDensity(opt.value)}
              className="flex items-center justify-between"
            >
              <div>
                <span>{opt.label}</span>
                <span className="ml-2 text-xs text-muted-foreground">
                  {opt.description}
                </span>
              </div>
              {prefs.density === opt.value && (
                <Check className="h-3.5 w-3.5 text-primary" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* Theme sub-group */}
        <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
          Theme
        </DropdownMenuLabel>
        <DropdownMenuGroup>
          {THEME_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            return (
              <DropdownMenuItem
                key={opt.value}
                onClick={() => setTheme(opt.value)}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-3.5 w-3.5" />
                  <span>{opt.label}</span>
                </div>
                {theme === opt.value && (
                  <Check className="h-3.5 w-3.5 text-primary" />
                )}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
DisplayCluster.displayName = 'DisplayCluster';
