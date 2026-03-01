'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowUpRight,
  Link as LinkIcon,
  MoreHorizontal,
  Plus,
  Trash2,
  FilePlus2,
  Eye,
  Settings2,
  BarChart3,
  Wrench,
} from 'lucide-react';
import { useQuickActions } from '@/hooks/use-quick-actions';
import { getActions } from '@/lib/search/action-registry';
import { getIcon } from '@/lib/modules/icon-map';
import { Kbd } from '@/components/ui/kbd';
import { formatShortcutKey } from '@/lib/shortcuts/format-shortcut';
import type { ActionCategory } from '@/lib/search/search.types';
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

// ─── CRUD Category Metadata ──────────────────────────────────────────────────

const CATEGORY_META: Record<
  ActionCategory,
  { label: string; icon: React.ElementType; order: number }
> = {
  create: { label: 'Create', icon: FilePlus2, order: 0 },
  view: { label: 'View / Open', icon: Eye, order: 1 },
  manage: { label: 'Manage', icon: Settings2, order: 2 },
  report: { label: 'Reports', icon: BarChart3, order: 3 },
  utility: { label: 'Utility', icon: Wrench, order: 4 },
};

// ─── NavQuickActions ─────────────────────────────────────────────────────────

/**
 * Quick Actions section — CRUD-driven action picker.
 *
 * All available actions are sourced from the central action-registry,
 * which maps 1-to-1 with OpenAPI CRUD operations. Actions are organised
 * into five categories: Create · View / Open · Manage · Reports · Utility.
 *
 * Users can pin up to 9 actions; pinned actions show Ctrl+1…9 shortcuts.
 * Ctrl+Q opens the picker dialog.
 *
 * Hidden when sidebar is collapsed to icon-only mode.
 */
export function NavQuickActions() {
  const pathname = usePathname();
  const { actions, toggle, isQuickAction } = useQuickActions();
  const { isMobile } = useSidebar();
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const isMac = React.useMemo(
    () => typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent),
    [],
  );

  // ─── Picker data: action-registry grouped by CRUD category ──────────────

  /** All navigable actions from the registry, grouped by CRUD category. */
  const actionsByCategory = React.useMemo(() => {
    const all = getActions().filter((a) => a.href);
    const grouped = new Map<ActionCategory, typeof all>();
    for (const action of all) {
      const cat: ActionCategory = action.category ?? 'utility';
      if (!grouped.has(cat)) grouped.set(cat, []);
      grouped.get(cat)!.push(action);
    }
    // Return entries sorted by category order
    return Array.from(grouped.entries()).sort(
      ([a], [b]) => (CATEGORY_META[a]?.order ?? 99) - (CATEGORY_META[b]?.order ?? 99),
    );
  }, []);

  // ─── Ctrl+Q global shortcut (explicit Ctrl to avoid Cmd+Q quit on Mac)
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        !e.shiftKey &&
        e.key.toLowerCase() === 'q'
      ) {
        e.preventDefault();
        setPickerOpen((prev) => !prev);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <SidebarGroupLabel>
          Quick Actions <Kbd className="text-[10px]">{formatShortcutKey('ctrl+q', isMac)}</Kbd>
        </SidebarGroupLabel>
        <Tooltip>
          <TooltipTrigger asChild>
            <SidebarGroupAction
              onClick={() => setPickerOpen(true)}
            >
              <Plus /> <span className="sr-only">Add Quick Action</span>
            </SidebarGroupAction>
          </TooltipTrigger>
          <TooltipContent side="right">Add quick action</TooltipContent>
        </Tooltip>
        <SidebarMenu>
          {actions.length === 0 ? (
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => setPickerOpen(true)}
                className="text-sidebar-foreground/50"
              >
                <Plus className="size-4" />
                <span>Add a quick action</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ) : (
            <>
              {actions.slice(0, 9).map((action) => {
                const ActionIcon = getIcon(action.icon);
                return (
                  <SidebarMenuItem key={action.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === action.href}
                      tooltip={`${action.title} (${formatShortcutKey(`ctrl+${action.slot}`, isMac)})`}
                    >
                      <Link href={action.href}>
                        <ActionIcon className="size-4 shrink-0" />
                        <span>{action.title}</span>
                        <Kbd className="ml-auto shrink-0 text-[10px]">
                          {formatShortcutKey(`ctrl+${action.slot}`, isMac)}
                        </Kbd>
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
                        <DropdownMenuItem
                          onClick={() =>
                            toggle({
                              actionId: action.actionId,
                              title: action.title,
                              icon: action.icon,
                              href: action.href,
                            })
                          }
                        >
                          <Trash2 className="text-muted-foreground" />
                          <span>Remove from Quick Actions</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() =>
                            navigator.clipboard.writeText(
                              window.location.origin + action.href,
                            )
                          }
                        >
                          <LinkIcon className="text-muted-foreground" />
                          <span>Copy Link</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <a
                            href={action.href}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ArrowUpRight className="text-muted-foreground" />
                            <span>Open in New Tab</span>
                          </a>
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

      {/* ─── Quick Action Picker — grouped by CRUD category ─── */}
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="overflow-hidden p-0 sm:max-w-md">
          <DialogHeader className="sr-only">
            <DialogTitle>Add Quick Action</DialogTitle>
            <DialogDescription>
              Pin any CRUD action as a quick-action shortcut (Ctrl+1…9).
            </DialogDescription>
          </DialogHeader>
          <Command className="[&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group]]:px-2">
            <CommandInput placeholder="Search actions…" />
            <CommandList className="max-h-80 overflow-y-auto">
              <CommandEmpty>No actions found.</CommandEmpty>

              {actionsByCategory.map(([category, catActions], catIdx) => {
                const meta = CATEGORY_META[category];
                const CatIcon = meta.icon;
                return (
                  <React.Fragment key={category}>
                    {catIdx > 0 && <CommandSeparator />}
                    <CommandGroup
                      heading={
                        <span className="flex items-center gap-1.5">
                          <CatIcon className="size-3.5" />
                          {meta.label}
                        </span>
                      }
                    >
                      {catActions.map((regAction) => {
                        const RegIcon = getIcon(regAction.icon);
                        const pinned = isQuickAction(regAction.href!);
                        const slot = actions.find(
                          (a) => a.href === regAction.href,
                        )?.slot;

                        return (
                          <CommandItem
                            key={regAction.id}
                            value={`${category}:${regAction.title} ${regAction.id}`}
                            onSelect={() => {
                              toggle({
                                actionId: regAction.href!,
                                title: regAction.title,
                                icon: regAction.icon,
                                href: regAction.href!,
                              });
                            }}
                            className="flex items-center gap-2"
                          >
                            <RegIcon className="size-4 shrink-0 text-muted-foreground" />
                            <span className="flex-1 truncate">
                              {regAction.title}
                            </span>
                            {pinned && slot && (
                              <Kbd className="shrink-0 text-[10px]">
                                {formatShortcutKey(`ctrl+${slot}`, isMac)}
                              </Kbd>
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
NavQuickActions.displayName = 'NavQuickActions';
