'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { AfendaDisplayCluster } from './afenda-display-cluster';
import { ModuleNavPopover } from './module-nav-popover';
import { UserMenu } from '@/components/erp/user-menu';
import { Kbd } from '@/components/ui/kbd';
import { cn } from '@/lib/utils';
import {
  HEADER_HEIGHT,
  ACTION_GAP,
  ACTION_BTN,
  ICON,
  SEARCH_BAR_W,
} from './shell.tokens';
import { deriveBreadcrumbs } from '@/lib/breadcrumbs/auto-breadcrumbs';
import { usePageBreadcrumb } from '@/providers/page-breadcrumb-provider';
import type { ClientModuleWithNav } from '@/lib/modules/types';
import type { ShellUser } from '@/lib/shell/shell-user';

// ─── Platform shortcut label ─────────────────────────────────────────────────

/** Returns "⌘K" on macOS, "Ctrl K" on Windows/Linux. */
function useModKey(): string {
  const [label, setLabel] = React.useState('⌘K');

  React.useEffect(() => {
    if (typeof navigator !== 'undefined' && !/Mac|iPod|iPhone|iPad/.test(navigator.userAgent)) {
      setLabel('Ctrl K');
    }
  }, []);

  return label;
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface AfendaShellHeaderProps {
  /** Current authenticated user. */
  user?: ShellUser;
  /** Server action called on sign-out. */
  logoutAction?: () => Promise<void>;
  /** Callback to open the command palette (Cmd/Ctrl+K). */
  onOpenCommandPalette: () => void;
  /** Visible modules for breadcrumb derivation. */
  modules?: ClientModuleWithNav[];
  /** Slot for status cluster (attention + notifications badge). */
  statusCluster?: React.ReactNode;
  /** Optional calculator slot (e.g. CalculatorPopover with mod+= shortcut). */
  calculatorSlot?: React.ReactNode;
  /** Optional shortcut reference slot (e.g. Keyboard icon + ? to open shortcut list). */
  shortcutSlot?: React.ReactNode;
}

// ─── AfendaShellHeader (sidebar-16 site-header pattern) ──────────────────────

/**
 * Sticky site header following the shadcn sidebar-16 pattern.
 *
 * Layout:
 *   [Breadcrumbs] ──── [Search] [Status] [Display] [User] | [☰ SidebarTrigger]
 *
 * - Sticky with `top-0 z-50` for scroll persistence
 * - Platform-aware shortcut hint (⌘K / Ctrl K)
 * - Single responsive search button (collapses to icon on mobile)
 */
function AfendaShellHeader({
  user,
  logoutAction,
  onOpenCommandPalette,
  modules,
  statusCluster,
  calculatorSlot,
  shortcutSlot,
}: AfendaShellHeaderProps) {
  const pathname = usePathname();
  const { pageBreadcrumb } = usePageBreadcrumb();
  const modKey = useModKey();

  const crumbs = React.useMemo(
    () => deriveBreadcrumbs(pathname, modules, { pageBreadcrumb: pageBreadcrumb ?? undefined }),
    [pathname, modules, pageBreadcrumb],
  );

  // Last crumb label used as page title on mobile
  const pageTitle = crumbs.length > 0 ? crumbs[crumbs.length - 1]!.label : '';

  return (
    <header
      className={cn(
        'bg-background sticky top-0 z-50 flex shrink-0 items-center border-b',
        HEADER_HEIGHT,
      )}
    >
      {/* Left — Sidebar trigger + separator + Breadcrumbs */}
      <div className="flex flex-1 items-center gap-2 px-2 pl-2 md:px-4">
        <SidebarTrigger className="-ml-1 shrink-0" />
        <Separator orientation="vertical" className="h-4 shrink-0" aria-hidden />

        {/* Desktop breadcrumbs */}
        {crumbs.length > 0 && (
          <Breadcrumb className="hidden md:flex">
            <BreadcrumbList>
              {crumbs.map((crumb, i) => {
                const isLast = i === crumbs.length - 1;
                return (
                  <React.Fragment key={`${crumb.label}-${i}`}>
                    {i > 0 && <BreadcrumbSeparator />}
                    <BreadcrumbItem>
                      {isLast ? (
                        <BreadcrumbPage className="line-clamp-1">
                          {crumb.label}
                        </BreadcrumbPage>
                      ) : crumb.href ? (
                        <BreadcrumbLink asChild>
                          <Link href={crumb.href}>{crumb.label}</Link>
                        </BreadcrumbLink>
                      ) : (
                        <span className="text-muted-foreground">{crumb.label}</span>
                      )}
                    </BreadcrumbItem>
                  </React.Fragment>
                );
              })}
            </BreadcrumbList>
          </Breadcrumb>
        )}

        {/* Mobile page title */}
        {pageTitle && (
          <span className="truncate text-sm font-medium md:hidden">{pageTitle}</span>
        )}
      </div>

      {/* Right — Actions */}
      <div className={cn('ml-auto flex items-center px-4', ACTION_GAP)}>
        {/* Search — wide on desktop, icon-only on mobile */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn('hidden justify-start text-sm text-muted-foreground lg:flex', SEARCH_BAR_W)}
              onClick={onOpenCommandPalette}
              aria-label="Search"
            >
              <Search className={ICON} aria-hidden />
              <span className="ml-2">Search...</span>
              <Kbd className="ml-auto">{modKey}</Kbd>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            Search <span className="text-muted-foreground">({modKey})</span>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className={cn(ACTION_BTN, 'lg:hidden')}
              onClick={onOpenCommandPalette}
              aria-label="Search"
            >
              <Search className={ICON} aria-hidden />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Search</TooltipContent>
        </Tooltip>

        {/* Calculator (mod+=) */}
        {calculatorSlot}

        {/* Status cluster (attention + notifications) */}
        {statusCluster}

        {/* Display cluster (density + theme) */}
        <AfendaDisplayCluster />

        {/* Shortcut reference (? key) */}
        {shortcutSlot}

        {/* User menu */}
        <UserMenu user={user} logoutAction={logoutAction} />

        {/* Module nav popover (burger) — rightmost */}
        <ModuleNavPopover modules={modules ?? []} />
      </div>
    </header>
  );
}
AfendaShellHeader.displayName = 'AfendaShellHeader';

export { AfendaShellHeader };
export type { AfendaShellHeaderProps };
