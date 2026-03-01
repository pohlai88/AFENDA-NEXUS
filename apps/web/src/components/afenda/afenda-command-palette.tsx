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
import { Kbd } from '@/components/ui/kbd';
import { cn } from '@/lib/utils';
import { ICON, ICON_XS, ICON_SM } from './shell.tokens';
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
  Compass,
  Search as SearchIcon,
  Loader2,
} from 'lucide-react';
import type { ClientModuleWithNav } from '@/lib/modules/types';
import type { EntitySearchResult, SearchAction } from '@/lib/search/search.types';

// ─── Entity Type Config ──────────────────────────────────────────────────────

/** Config for entity type display in search results. */
export interface EntityTypeConfig {
  label: string;
  color: string;
}

/** Zap icon from canonical registry — avoids HMR module factory issues. */
const ZapIcon = getIcon('Zap');

/** Default entity type display config — override via props to extend. */
const DEFAULT_ENTITY_TYPE_CONFIG: Record<string, EntityTypeConfig> = {
  journal: { label: 'Journal', color: 'bg-info/10 text-info' },
  account: { label: 'Account', color: 'bg-success/10 text-success' },
  supplier: { label: 'Supplier', color: 'bg-primary/10 text-primary' },
  invoice: { label: 'Invoice', color: 'bg-warning/10 text-warning' },
};

// ─── Types ───────────────────────────────────────────────────────────────────

interface AfendaCommandPaletteProps {
  /** Visible modules (including admin when applicable). */
  modules: ClientModuleWithNav[];
  /** Controlled open state. */
  open: boolean;
  /** Controlled open-change handler. */
  onOpenChange: (open: boolean) => void;
  /**
   * Entity type display config — merged with defaults.
   * Add new entity types here instead of editing this component.
   */
  entityTypeConfig?: Record<string, EntityTypeConfig>;
}

// ─── AfendaCommandPalette ────────────────────────────────────────────────────

/**
 * Global command palette — triggered by Cmd/Ctrl+K.
 *
 * Empty state: Favorites → Recent → Quick Actions → Module Navigation
 * With query: Entity search results + filtered actions + filtered navigation
 */
function AfendaCommandPalette({ modules, open, onOpenChange, entityTypeConfig }: AfendaCommandPaletteProps) {
  const entityConfig = useMemo(
    () => ({ ...DEFAULT_ENTITY_TYPE_CONFIG, ...entityTypeConfig }),
    [entityTypeConfig],
  );
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
              <Loader2 className={cn(ICON, 'animate-spin text-muted-foreground')} />
              <span className="text-sm text-muted-foreground">Searching...</span>
            </div>
          ) : (
            'No results found.'
          )}
        </CommandEmpty>

        {/* ─── Favorites (empty state only) ─────────────────────────────── */}
        {showFavorites && (
          <>
            <CommandGroup
              heading={
                <span className="flex items-center gap-1.5">
                  <Star className={cn(ICON_XS, 'fill-warning text-warning')} />
                  Favorites
                </span>
              }
            >
              {favorites.slice(0, 5).map((fav) => (
                <CommandItem
                  key={`fav-${fav.href}`}
                  value={`fav:${fav.title}`}
                  onSelect={() => navigate(fav.href)}
                >
                  <Star className={cn(ICON, 'mr-2 fill-warning text-warning')} />
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
            <CommandGroup
              heading={
                <span className="flex items-center gap-1.5">
                  <Clock className={ICON_XS} />
                  Recent
                </span>
              }
            >
              {recents.slice(0, 5).map((r) => (
                <CommandItem
                  key={`recent-${r.href}`}
                  value={`recent:${r.title}`}
                  onSelect={() => navigate(r.href)}
                >
                  <Clock className={cn(ICON, 'mr-2 text-muted-foreground')} />
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
                    <SearchIcon className={ICON_XS} />
                    {entityConfig[entityType]?.label ?? entityType}s
                  </span>
                }
              >
                {results.map((result) => {
                  const Icon = result.icon ? getIcon(result.icon) : SearchIcon;
                  return (
                    <CommandItem
                      key={result.id}
                      value={`entity:${result.title}`}
                      onSelect={() => {
                        if (result.href) navigate(result.href);
                      }}
                    >
                      <Icon className={cn(ICON, 'mr-2')} />
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
                        className={cn('ml-auto shrink-0 text-[10px]', entityConfig[entityType]?.color)}
                      >
                        {entityConfig[entityType]?.label ?? entityType}
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
            <Loader2 className={cn(ICON_SM, 'animate-spin text-muted-foreground')} />
            <span className="text-xs text-muted-foreground">Searching entities...</span>
          </div>
        )}

        {/* ─── Quick Actions ────────────────────────────────────────────── */}
        {filteredActions.length > 0 && (
          <>
            <CommandGroup
              heading={
                <span className="flex items-center gap-1.5">
                  <ZapIcon className={ICON_XS} />
                  Quick Actions
                </span>
              }
            >
              {filteredActions.map((action) => {
                const Icon = getIcon(action.icon);
                return (
                  <CommandItem
                    key={action.id}
                    value={`action:${action.title}`}
                    onSelect={() => handleAction(action)}
                  >
                    <Icon className={cn(ICON, 'mr-2')} />
                    <span>{action.title}</span>
                    {action.shortcut && (
                      <Kbd className="ml-auto">{action.shortcut}</Kbd>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* ─── Module Navigation ────────────────────────────────────────── */}
        <CommandGroup
          heading={
            <span className="flex items-center gap-1.5">
              <Compass className={ICON_XS} />
              Navigation
            </span>
          }
        >
          {modules.map((mod) => {
            const Icon = getIcon(mod.iconName);
            return (
              <CommandItem
                key={mod.id}
                value={`nav:${mod.label}`}
                onSelect={() => navigate(mod.href)}
              >
                <Icon className={cn(ICON, 'mr-2')} />
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
                    <ModIcon className={ICON_XS} />
                    {mod.label} — {group.title}
                  </span>
                }
              >
                {group.items.map((item) => {
                  const ItemIcon = getIcon(item.icon);
                  return (
                    <CommandItem
                      key={`${mod.id}:${group.title}:${item.title}`}
                      value={`subnav:${mod.label}:${item.title}`}
                      onSelect={() => navigate(item.href)}
                    >
                      <ItemIcon className={cn(ICON, 'mr-2')} />
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
AfendaCommandPalette.displayName = 'AfendaCommandPalette';

export { AfendaCommandPalette };
export type { AfendaCommandPaletteProps };
