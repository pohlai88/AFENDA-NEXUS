'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Navigation2, Search } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { EmptyState } from '@/components/erp/empty-state';
import { getIcon } from '@/lib/modules/icon-map';
import type { ClientModuleWithNav } from '@/lib/modules/types';
import type { NavGroup } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { ACTION_BTN, ICON, POPOVER_DOMAIN_W, SCROLL_MAX_H } from './shell.tokens';

// ─── Fuzzy search ─────────────────────────────────────────────────────────────

/**
 * Fuzzy match: query chars must appear in order in text (case-insensitive).
 * e.g. "gl" matches "General Ledger", "ap" matches "Accounts Payable".
 */
function fuzzyMatch(query: string, text: string): boolean {
  const q = query.toLowerCase().trim();
  if (!q) return true;
  const t = text.toLowerCase();
  let j = 0;
  for (let i = 0; i < t.length && j < q.length; i++) {
    if (t[i] === q[j]) j++;
  }
  return j === q.length;
}

// ─── Derive current module from pathname ─────────────────────────────────────

/**
 * Returns the module whose href matches the pathname, or the first segment
 * (e.g. /finance/... → finance). Falls back to home when at root.
 */
function getCurrentModule(
  pathname: string,
  modules: ClientModuleWithNav[]
): ClientModuleWithNav | null {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) {
    return modules.find((m) => m.href === '/' || m.id === 'home') ?? modules[0] ?? null;
  }
  const firstSeg = segments[0];
  return (
    modules.find((m) => {
      const modSeg = m.href.split('/').filter(Boolean)[0];
      return modSeg === firstSeg || m.id === firstSeg;
    }) ?? null
  );
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface ModuleNavPopoverProps {
  /** Visible modules with nav groups. */
  modules: ClientModuleWithNav[];
}

// ─── ModuleNavPopover ─────────────────────────────────────────────────────────

/**
 * Burger menu at the rightmost of the header. Opens a popover with
 * module-specific navigation — e.g. when in Finance, shows Finance nav groups
 * (General Ledger, AP, AR, etc.) with links to each item.
 */
function ModuleNavPopover({ modules }: ModuleNavPopoverProps) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');

  const currentModule = React.useMemo(
    () => getCurrentModule(pathname, modules),
    [pathname, modules]
  );

  const allNavGroups = React.useMemo(
    () => currentModule?.navGroups ?? [],
    [currentModule?.navGroups]
  );

  const navGroups = React.useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return allNavGroups;

    return allNavGroups
      .map((group) => {
        const filteredItems = (group.items ?? []).filter(
          (item) => fuzzyMatch(q, item.title) || fuzzyMatch(q, group.title)
        );
        if (filteredItems.length === 0 && !fuzzyMatch(q, group.title)) return null;
        return { ...group, items: filteredItems.length > 0 ? filteredItems : (group.items ?? []) };
      })
      .filter((g): g is NavGroup => g !== null);
  }, [allNavGroups, searchQuery]);

  const hasAnyItems = navGroups.some((g) => (g.items ?? []).length > 0);

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setSearchQuery('');
      }}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={ACTION_BTN}
              aria-label={`Open ${currentModule?.label ?? 'module'} navigation`}
            >
              <Navigation2 className={ICON} />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {currentModule ? `${currentModule.label} navigation` : 'Module navigation'}
        </TooltipContent>
      </Tooltip>
      <PopoverContent align="end" side="bottom" className={cn(POPOVER_DOMAIN_W, 'p-0')}>
        <PopoverHeader className="border-b px-4 py-3">
          <PopoverTitle className="text-base">
            {currentModule ? `${currentModule.label} Navigation` : 'Navigation'}
          </PopoverTitle>
          <div className="mt-2">
            <div className="relative">
              <Search
                className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                placeholder="Search navigation…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-sm"
                aria-label="Filter navigation"
              />
            </div>
          </div>
        </PopoverHeader>
        {!hasAnyItems ? (
          <EmptyState
            contentKey="shell.moduleNav"
            icon={Navigation2}
            variant={searchQuery.trim() ? 'noResults' : 'firstRun'}
            constraint="1x2"
          />
        ) : (
          <ScrollArea className={cn(SCROLL_MAX_H, 'h-[min(70vh,24rem)]')} type="auto">
            <nav className="flex flex-col gap-1 py-3 pr-4 pl-3" aria-label="Module navigation">
              {navGroups.map((group, idx) => (
                <React.Fragment key={group.title}>
                  <ModuleNavGroup
                    group={group}
                    pathname={pathname}
                    onNavigate={() => setOpen(false)}
                  />
                  {idx < navGroups.length - 1 && <Separator className="my-1" />}
                </React.Fragment>
              ))}
            </nav>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
}

// ─── ModuleNavGroup ──────────────────────────────────────────────────────────

interface ModuleNavGroupProps {
  group: NavGroup;
  pathname: string;
  onNavigate: () => void;
}

function ModuleNavGroup({ group, pathname, onNavigate }: ModuleNavGroupProps) {
  const GroupIcon = getIcon(group.icon);
  const items = group.items ?? [];

  if (items.length === 0) return null;

  return (
    <div className="px-2">
      <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-medium text-muted-foreground">
        <GroupIcon className="size-3.5 shrink-0" />
        <span>{group.title}</span>
      </div>
      <ul className="space-y-0.5">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const ItemIcon = getIcon(item.icon);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  'flex min-w-0 items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground',
                  isActive && 'bg-accent font-medium text-accent-foreground'
                )}
              >
                <ItemIcon className="size-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{item.title}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

ModuleNavPopover.displayName = 'ModuleNavPopover';

export { ModuleNavPopover };
