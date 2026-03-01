'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowUpRight,
  Link as LinkIcon,
  MoreHorizontal,
  Plus,
  StarOff,
  Trash2,
} from 'lucide-react';
import { useFavorites } from '@/hooks/use-favorites';
import { getIcon } from '@/lib/modules/icon-map';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { ClientModuleWithNav } from '@/lib/modules/types';

// ─── Types ───────────────────────────────────────────────────────────────────

interface FavoritableItem {
  href: string;
  title: string;
  icon: string;
  moduleId: string;
  groupTitle: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Flatten all pages from all modules into a single searchable list. */
function flattenModulePages(modules: ClientModuleWithNav[]): FavoritableItem[] {
  const items: FavoritableItem[] = [];

  for (const mod of modules) {
    for (const group of mod.navGroups) {
      for (const item of group.items) {
        items.push({
          href: item.href,
          title: item.title,
          icon: item.icon,
          moduleId: mod.id,
          groupTitle: group.title,
        });
        // Include children as well
        if (item.children) {
          for (const child of item.children) {
            items.push({
              href: child.href,
              title: child.title,
              icon: child.icon,
              moduleId: mod.id,
              groupTitle: `${group.title} → ${item.title}`,
            });
          }
        }
      }
    }
  }

  return items;
}

// ─── NavFavorites ────────────────────────────────────────────────────────────

/**
 * Favorites section — shadcn sidebar-10 pattern + CommandK picker.
 *
 * Shows user-pinned pages with a context menu for removal / open-in-new-tab.
 * The "+" button opens a CommandK-style dialog listing all available pages
 * across modules so users can quickly search and pin any page.
 *
 * Hidden when the sidebar is collapsed to icon-only mode.
 */
export function NavFavorites({ modules }: { modules: ClientModuleWithNav[] }) {
  const pathname = usePathname();
  const { favorites, toggle, isFavorite } = useFavorites();
  const { isMobile } = useSidebar();
  const [pickerOpen, setPickerOpen] = React.useState(false);

  // Flatten all module pages for the picker
  const allPages = React.useMemo(() => flattenModulePages(modules), [modules]);

  // Group pages by module for the picker display
  const pagesByModule = React.useMemo(() => {
    const map = new Map<string, FavoritableItem[]>();
    for (const page of allPages) {
      const group = map.get(page.moduleId) ?? [];
      group.push(page);
      map.set(page.moduleId, group);
    }
    return map;
  }, [allPages]);

  return (
    <>
      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <SidebarGroupLabel>
          Favorites
        </SidebarGroupLabel>
        <Tooltip>
          <TooltipTrigger asChild>
            <SidebarGroupAction onClick={() => setPickerOpen(true)}>
              <Plus /> <span className="sr-only">Add Favorite</span>
            </SidebarGroupAction>
          </TooltipTrigger>
          <TooltipContent side="right">Add favorite</TooltipContent>
        </Tooltip>
        <SidebarMenu>
          {favorites.length === 0 ? (
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => setPickerOpen(true)}
                className="text-sidebar-foreground/50"
              >
                <Plus className="size-4" />
                <span>Add a favorite</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ) : (
            <>
              {favorites.slice(0, 8).map((fav) => {
                const FavIcon = fav.icon ? getIcon(fav.icon) : null;
                return (
                  <SidebarMenuItem key={fav.href}>
                    <SidebarMenuButton asChild isActive={pathname === fav.href}>
                      <Link href={fav.href}>
                        {FavIcon ? <FavIcon className="size-4 shrink-0" /> : <span className="shrink-0">⭐</span>}
                        <span className="min-w-0 flex-1 truncate">{fav.title}</span>
                      </Link>
                    </SidebarMenuButton>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <SidebarMenuAction showOnHover>
                          <MoreHorizontal />
                          <span className="sr-only">More</span>
                        </SidebarMenuAction>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        className="w-56 rounded-lg"
                        side={isMobile ? 'bottom' : 'right'}
                        align={isMobile ? 'end' : 'start'}
                      >
                        <DropdownMenuItem onClick={() => toggle(fav)}>
                          <StarOff className="text-muted-foreground" />
                          <span>Remove from Favorites</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => navigator.clipboard.writeText(window.location.origin + fav.href)}
                        >
                          <LinkIcon className="text-muted-foreground" />
                          <span>Copy Link</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <a href={fav.href} target="_blank" rel="noopener noreferrer">
                            <ArrowUpRight className="text-muted-foreground" />
                            <span>Open in New Tab</span>
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => toggle(fav)}
                        >
                          <Trash2 className="text-muted-foreground" />
                          <span>Delete</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </SidebarMenuItem>
                );
              })}
            </>
          )}
        </SidebarMenu>
      </SidebarGroup>

      {/* ─── Favorites Picker — Command palette style ─── */}
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="overflow-hidden p-0 sm:max-w-md">
          <DialogHeader className="sr-only">
            <DialogTitle>Add to Favorites</DialogTitle>
            <DialogDescription>Search and pin any page as a favorite.</DialogDescription>
          </DialogHeader>
          <Command className="[&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group]]:px-2">
            <CommandInput placeholder="Search pages…" />
            <CommandList className="max-h-72 overflow-y-auto">
              <CommandEmpty>No pages found.</CommandEmpty>
              {Array.from(pagesByModule.entries()).map(([moduleId, pages], idx) => {
                const moduleLabel = modules.find((m) => m.id === moduleId)?.label ?? moduleId;
                return (
                  <React.Fragment key={moduleId}>
                    {idx > 0 && <CommandSeparator />}
                    <CommandGroup heading={moduleLabel}>
                      {pages.map((page) => {
                        const PageIcon = getIcon(page.icon);
                        const favorited = isFavorite(page.href);

                        return (
                          <CommandItem
                            key={`${moduleId}:${page.groupTitle}:${page.title}`}
                            value={`${page.title} ${page.groupTitle} ${moduleId}`}
                            onSelect={() => {
                              toggle({
                                href: page.href,
                                title: page.title,
                                icon: page.icon,
                                moduleId: page.moduleId,
                              });
                            }}
                            className="flex items-center gap-2"
                          >
                            <PageIcon className="size-4 shrink-0 text-muted-foreground" />
                            <span className="flex-1 truncate">{page.title}</span>
                            {favorited && (
                              <span className="shrink-0 text-xs text-amber-500">★</span>
                            )}
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </React.Fragment>
                );
              })}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}
NavFavorites.displayName = 'NavFavorites';
