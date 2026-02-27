'use client';

import * as React from 'react';
import { useState, useEffect, useCallback, useTransition, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { getIcon } from '@/lib/modules/icon-map';
import { getActions, searchActions } from '@/lib/search/action-registry';
import { useFavorites } from '@/hooks/use-favorites';
import { useRecentItems } from '@/hooks/use-recent-items';
import { useDebounce } from '@/hooks/use-debounce';
import { getActiveModule } from '@/lib/modules/get-active-module';
import { searchGlobal } from '@/features/platform/search/actions/global-search.action';
import {
  Star,
  Clock,
  Zap,
  Compass,
  Search as SearchIcon,
  Loader2,
} from 'lucide-react';
import type { ClientModuleWithNav } from '@/lib/modules/types';
import type { EntitySearchResult, SearchAction } from '@/lib/search/search.types';

// ─── Types ───────────────────────────────────────────────────────────────────

interface CommandPaletteProps {
  /** Visible modules (including admin when applicable) passed from AppShell. */
  modules: ClientModuleWithNav[];
  /** Controlled open state — lifted to AppShell so the search button works. */
  open: boolean;
  /** Controlled open-change handler. */
  onOpenChange: (open: boolean) => void;
}

// ─── Entity type labels ──────────────────────────────────────────────────────

const ENTITY_TYPE_LABEL: Record<string, string> = {
  journal: 'Journal',
  account: 'Account',
  supplier: 'Supplier',
  invoice: 'Invoice',
};

const ENTITY_TYPE_COLOR: Record<string, string> = {
  journal: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  account: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  supplier: 'bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300',
  invoice: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
};

// ─── Command Palette v2 ─────────────────────────────────────────────────────

/**
 * Global command palette v2 — triggered by Cmd/Ctrl+K.
 *
 * Empty state: Favorites → Recent → Quick Actions → Module Navigation
 * With query: Entity search results + filtered actions + filtered navigation
 */
function CommandPalette({ modules, open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const activeModuleId = getActiveModule(pathname);

  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const [entityResults, setEntityResults] = useState<EntitySearchResult[]>([]);
  const [isSearching, startSearch] = useTransition();

  const { favorites } = useFavorites();
  const { recents } = useRecentItems();

  // Reset state when palette closes
  useEffect(() => {
    if (!open) {
      setQuery('');
      setEntityResults([]);
    }
  }, [open]);

  // Server-side entity search (debounced)
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setEntityResults([]);
      return;
    }

    startSearch(async () => {
      try {
        const results = await searchGlobal(debouncedQuery);
        setEntityResults(results);
      } catch {
        setEntityResults([]);
      }
    });
  }, [debouncedQuery]);

  // Get filtered actions
  const filteredActions = useMemo(() => {
    if (query) return searchActions(query, activeModuleId);
    return getActions(activeModuleId);
  }, [query, activeModuleId]);

  const navigate = useCallback(
    (href: string) => {
      onOpenChange(false);
      router.push(href);
    },
    [router, onOpenChange],
  );

  const handleAction = useCallback(
    (action: SearchAction) => {
      onOpenChange(false);
      if (action.handler) {
        action.handler();
      } else if (action.href) {
        router.push(action.href);
      }
    },
    [router, onOpenChange],
  );

  const hasQuery = query.length > 0;
  const showFavorites = !hasQuery && favorites.length > 0;
  const showRecents = !hasQuery && recents.length > 0;

  // Group entity results by type
  const entityGroups = useMemo(() => {
    const groups = new Map<string, EntitySearchResult[]>();
    for (const result of entityResults) {
      const list = groups.get(result.entityType) ?? [];
      list.push(result);
      groups.set(result.entityType, list);
    }
    return groups;
  }, [entityResults]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search entities, actions, or navigate..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>
          {isSearching ? (
            <div className="flex items-center justify-center gap-2 py-6">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Searching...</span>
            </div>
          ) : (
            'No results found.'
          )}
        </CommandEmpty>

        {/* ─── Favorites (empty state only) ─────────────────────────────── */}
        {showFavorites && (
          <>
            <CommandGroup heading={
              <span className="flex items-center gap-1.5">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                Favorites
              </span>
            }>
              {favorites.slice(0, 5).map((fav) => (
                <CommandItem
                  key={`fav-${fav.href}`}
                  value={`fav:${fav.title}`}
                  onSelect={() => navigate(fav.href)}
                >
                  <Star className="mr-2 h-4 w-4 fill-amber-400 text-amber-400" />
                  <span>{fav.title}</span>
                  {fav.moduleId && (
                    <span className="ml-auto text-xs text-muted-foreground">{fav.moduleId}</span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* ─── Recents (empty state only) ───────────────────────────────── */}
        {showRecents && (
          <>
            <CommandGroup heading={
              <span className="flex items-center gap-1.5">
                <Clock className="h-3 w-3" />
                Recent
              </span>
            }>
              {recents.slice(0, 5).map((r) => (
                <CommandItem
                  key={`recent-${r.href}`}
                  value={`recent:${r.title}`}
                  onSelect={() => navigate(r.href)}
                >
                  <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{r.title}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{r.moduleId}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* ─── Entity Search Results (with query) ──────────────────────── */}
        {hasQuery && entityGroups.size > 0 && (
          <>
            {Array.from(entityGroups.entries()).map(([entityType, results]) => (
              <CommandGroup
                key={`entity-${entityType}`}
                heading={
                  <span className="flex items-center gap-1.5">
                    <SearchIcon className="h-3 w-3" />
                    {ENTITY_TYPE_LABEL[entityType] ?? entityType}s
                  </span>
                }
              >
                {results.map((result) => {
                  const Icon = result.icon ? getIcon(result.icon) : SearchIcon;
                  return (
                    <CommandItem
                      key={result.id}
                      value={`entity:${result.title}`}
                      onSelect={() => { if (result.href) navigate(result.href); }}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        <span className="truncate">{result.title}</span>
                        {result.subtitle && (
                          <span className="truncate text-xs text-muted-foreground">
                            {result.subtitle}
                          </span>
                        )}
                      </div>
                      <Badge
                        variant="secondary"
                        className={`ml-auto shrink-0 text-[10px] ${ENTITY_TYPE_COLOR[entityType] ?? ''}`}
                      >
                        {ENTITY_TYPE_LABEL[entityType] ?? entityType}
                      </Badge>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            ))}
            <CommandSeparator />
          </>
        )}

        {/* ─── Loading indicator for entity search ─────────────────────── */}
        {hasQuery && isSearching && entityGroups.size === 0 && (
          <div className="flex items-center justify-center gap-2 px-4 py-3">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Searching entities...</span>
          </div>
        )}

        {/* ─── Quick Actions ────────────────────────────────────────────── */}
        {filteredActions.length > 0 && (
          <>
            <CommandGroup heading={
              <span className="flex items-center gap-1.5">
                <Zap className="h-3 w-3" />
                Quick Actions
              </span>
            }>
              {filteredActions.map((action) => {
                const Icon = getIcon(action.icon);
                return (
                  <CommandItem
                    key={action.id}
                    value={`action:${action.title}`}
                    onSelect={() => handleAction(action)}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    <span>{action.title}</span>
                    {action.shortcut && (
                      <kbd className="pointer-events-none ml-auto inline-flex h-5 select-none items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                        {action.shortcut}
                      </kbd>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* ─── Module Navigation ────────────────────────────────────────── */}
        <CommandGroup heading={
          <span className="flex items-center gap-1.5">
            <Compass className="h-3 w-3" />
            Navigation
          </span>
        }>
          {modules.map((mod) => {
            const Icon = getIcon(mod.iconName);
            return (
              <CommandItem
                key={mod.id}
                value={`nav:${mod.label}`}
                onSelect={() => navigate(mod.href)}
              >
                <Icon className="mr-2 h-4 w-4" />
                <span>{mod.label}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>

        {/* ─── Per-module navigation items ──────────────────────────────── */}
        {modules
          .filter((mod) => mod.navGroups.length > 0)
          .map((mod) => {
            const ModIcon = getIcon(mod.iconName);
            return mod.navGroups.map((group) => (
              <CommandGroup
                key={`${mod.id}-${group.title}`}
                heading={
                  <span className="flex items-center gap-1.5">
                    <ModIcon className="h-3 w-3" />
                    {mod.label} — {group.title}
                  </span>
                }
              >
                {group.items.map((item) => {
                  const ItemIcon = getIcon(item.icon);
                  return (
                    <CommandItem
                      key={item.href}
                      value={`subnav:${mod.label}:${item.title}`}
                      onSelect={() => navigate(item.href)}
                    >
                      <ItemIcon className="mr-2 h-4 w-4" />
                      <span>{item.title}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            ));
          })}
      </CommandList>
    </CommandDialog>
  );
}
CommandPalette.displayName = 'CommandPalette';

export { CommandPalette };
export type { CommandPaletteProps };
