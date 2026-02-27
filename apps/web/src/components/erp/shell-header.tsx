'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
import { DisplayCluster } from './display-cluster';
import { UserMenu } from './user-menu';
import { Search } from 'lucide-react';
import { deriveBreadcrumbs } from '@/lib/breadcrumbs/auto-breadcrumbs';
import { usePageBreadcrumb } from '@/providers/page-breadcrumb-provider';
import type { ClientModuleWithNav } from '@/lib/modules/types';

// ─── Types ───────────────────────────────────────────────────────────────────

/** User identity displayed in the header / user menu. */
interface ShellHeaderUser {
  name: string;
  email: string;
  image?: string | null;
}

interface ShellHeaderProps {
  /** Current authenticated user. */
  user?: ShellHeaderUser;
  /** Server action called on sign-out. */
  logoutAction?: () => Promise<void>;
  /** Callback to open the command palette (Cmd/Ctrl+K). */
  onOpenCommandPalette: () => void;
  /** Visible modules for breadcrumb derivation. */
  modules?: ClientModuleWithNav[];
  /** Slot for status cluster (attention + notifications badge). */
  statusCluster?: React.ReactNode;
  /** Slot for the domain navigation popover (right-side sidebar-10). */
  domainPopover?: React.ReactNode;
}

// ─── Shell Header (sidebar-10 pattern) ───────────────────────────────────────

/**
 * Header layout – two-sidebar architecture:
 *
 *   [☰ RailTrigger] | [Breadcrumbs...] ── gap ── [DomainPopover] [Search] [Status] [Display] [User]
 *
 * SidebarTrigger controls the left module rail.
 * DomainPopover slot renders the right-side domain detail navigation.
 */
function ShellHeader({
  user,
  logoutAction,
  onOpenCommandPalette,
  modules,
  statusCluster,
  domainPopover,
}: ShellHeaderProps) {
  const pathname = usePathname();
  const { pageBreadcrumb } = usePageBreadcrumb();

  const crumbs = React.useMemo(
    () => deriveBreadcrumbs(pathname, modules, { pageBreadcrumb: pageBreadcrumb ?? undefined }),
    [pathname, modules, pageBreadcrumb],
  );

  // Last crumb label used as page title on mobile
  const pageTitle = crumbs.length > 0 ? crumbs[crumbs.length - 1]!.label : '';

  return (
    <header className="flex h-14 shrink-0 items-center gap-2">
      {/* Left — SidebarTrigger + separator (sidebar-10 pattern) */}
      <div className="flex flex-1 items-center gap-2 px-3">
        <SidebarTrigger />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />

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

      {/* Right — Actions (sidebar-10 NavActions area) */}
      <div className="ml-auto flex items-center gap-1.5 px-3">
        {/* Domain navigation popover (right-side detail nav) */}
        {domainPopover}

        <Separator orientation="vertical" className="mx-0.5 data-[orientation=vertical]:h-4" />

        {/* Desktop search button — full width */}
        <Button
          variant="outline"
          size="sm"
          className="hidden h-8 w-64 justify-start text-sm text-muted-foreground lg:flex"
          onClick={onOpenCommandPalette}
        >
          <Search className="mr-2 h-4 w-4" />
          <span>Search...</span>
          <kbd className="pointer-events-none ml-auto inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            ⌘K
          </kbd>
        </Button>

        {/* Tablet search button — icon only */}
        <Button
          variant="outline"
          size="icon"
          className="hidden h-8 w-8 md:flex lg:hidden"
          onClick={onOpenCommandPalette}
          aria-label="Search"
        >
          <Search className="h-4 w-4" />
        </Button>

        {/* Mobile search button — icon only */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 md:hidden"
          onClick={onOpenCommandPalette}
          aria-label="Search"
        >
          <Search className="h-4 w-4" />
        </Button>

        {/* Status cluster slot (attention + notifications) */}
        {statusCluster}

        {/* Display cluster (density + theme) */}
        <DisplayCluster />

        {/* User menu */}
        <UserMenu user={user} logoutAction={logoutAction} />
      </div>
    </header>
  );
}
ShellHeader.displayName = 'ShellHeader';

export { ShellHeader };
export type { ShellHeaderProps, ShellHeaderUser };
