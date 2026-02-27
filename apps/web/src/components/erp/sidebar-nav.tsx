'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { type NavGroup, type NavItem } from '@/lib/constants';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';
import { getIcon } from '@/lib/modules/icon-map';

// ─── Shortcut Hints ──────────────────────────────────────────────────────────

/** Map of hrefs to keyboard shortcut hints displayed in the sidebar. */
const SHORTCUT_HINTS: Record<string, string> = {
  '/finance/journals': 'g j',
  '/finance/accounts': 'g a',
  '/finance/periods': 'g p',
  '/finance/ledgers': 'g l',
  '/finance/banking': 'g b',
  '/finance/expenses': 'g x',
  '/settings': 'g s',
  '/': 'g d',
};

// ─── Icon Helper ─────────────────────────────────────────────────────────────

function NavIcon({ name, className }: { name: string; className?: string }) {
  const Icon = getIcon(name);
  return <Icon className={cn('h-4 w-4', className)} />;
}
NavIcon.displayName = 'NavIcon';

// ─── Skeleton ────────────────────────────────────────────────────────────────

/** Loading placeholder for the sidebar navigation groups. */
function SidebarNavSkeleton() {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Navigation</SidebarGroupLabel>
      <SidebarMenu>
        {Array.from({ length: 5 }, (_, i) => (
          <SidebarMenuItem key={i}>
            <SidebarMenuSkeleton showIcon />
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
SidebarNavSkeleton.displayName = 'SidebarNavSkeleton';

// ─── Types ───────────────────────────────────────────────────────────────────

/** Approval / expense badge counts injected from the layout. */
interface ApprovalBadgeCounts {
  approvals?: number;
  expenses?: number;
}

interface DomainNavProps {
  /** Navigation groups to render. */
  navGroups: NavGroup[];
  /** Optional badge counts for approval/expense items. */
  badgeCounts?: ApprovalBadgeCounts;
}

interface NavGroupSectionProps {
  group: NavGroup;
  pathname: string;
  badgeCounts?: ApprovalBadgeCounts;
}

interface NavMenuItemProps {
  item: NavItem;
  pathname: string;
  badgeCounts?: ApprovalBadgeCounts;
}

// ─── Domain Navigation ───────────────────────────────────────────────────────

/**
 * Renders an array of `NavGroup[]` as sidebar navigation sections.
 * Supports collapsible groups, nested children, and badge counts.
 */
function DomainNav({ navGroups, badgeCounts }: DomainNavProps) {
  const pathname = usePathname();

  return (
    <>
      {navGroups.map((group) => (
        <NavGroupSection key={group.title} group={group} pathname={pathname} badgeCounts={badgeCounts} />
      ))}
    </>
  );
}
DomainNav.displayName = 'DomainNav';

// ─── Nav Group Section ───────────────────────────────────────────────────────

function NavGroupSection({ group, pathname, badgeCounts }: NavGroupSectionProps) {
  const isActive = group.items.some((item) => pathname.startsWith(item.href));

  if (group.collapsible) {
    return (
      <SidebarGroup>
        <Collapsible asChild defaultOpen={isActive} className="group/collapsible">
          <div>
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="-mx-2 cursor-pointer rounded-md px-2 py-1 hover:bg-accent/50 flex items-center gap-2">
                <NavIcon name={group.icon} className="h-3.5 w-3.5" />
                <span className="flex-1">{group.title}</span>
                <ChevronRight className="h-3.5 w-3.5 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenu className="mt-1">
                {group.items.map((item) => (
                  <NavMenuItem key={item.href} item={item} pathname={pathname} badgeCounts={badgeCounts} />
                ))}
              </SidebarMenu>
            </CollapsibleContent>
          </div>
        </Collapsible>
      </SidebarGroup>
    );
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="flex items-center gap-2">
        <NavIcon name={group.icon} className="h-3.5 w-3.5" />
        {group.title}
      </SidebarGroupLabel>
      <SidebarMenu>
        {group.items.map((item) => (
          <NavMenuItem key={item.href} item={item} pathname={pathname} badgeCounts={badgeCounts} />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
NavGroupSection.displayName = 'NavGroupSection';

// ─── Nav Menu Item ───────────────────────────────────────────────────────────

function NavMenuItem({ item, pathname, badgeCounts }: NavMenuItemProps) {
  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
  const badgeCount = getBadgeCount(item.href, badgeCounts);

  if (item.children && item.children.length > 0) {
    return (
      <Collapsible asChild defaultOpen={isActive} className="group/collapsible">
        <SidebarMenuItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton tooltip={item.title} isActive={isActive}>
              <NavIcon name={item.icon} />
              <span>{item.title}</span>
              {badgeCount > 0 && (
                <Badge
                  variant={item.badgeVariant ?? 'secondary'}
                  className="ml-auto h-5 min-w-5 justify-center px-1.5 text-xs"
                >
                  {badgeCount}
                </Badge>
              )}
              <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              {item.children.map((child) => (
                <SidebarMenuSubItem key={child.href}>
                  <SidebarMenuSubButton asChild isActive={pathname === child.href}>
                    <Link href={child.href}>
                      <span>{child.title}</span>
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    );
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
        <Link href={item.href}>
          <NavIcon name={item.icon} />
          <span>{item.title}</span>
          {badgeCount > 0 && (
            <Badge
              variant={item.badgeVariant ?? 'secondary'}
              className="ml-auto h-5 min-w-5 justify-center px-1.5 text-xs"
            >
              {badgeCount}
            </Badge>
          )}
          {!badgeCount && SHORTCUT_HINTS[item.href] && (
            <kbd className="ml-auto hidden h-5 select-none items-center rounded border bg-muted/60 px-1.5 font-mono text-[10px] font-medium text-muted-foreground group-data-[state=expanded]:inline-flex">
              {SHORTCUT_HINTS[item.href]}
            </kbd>
          )}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
NavMenuItem.displayName = 'NavMenuItem';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Resolve a badge count for a given href based on known patterns. */
function getBadgeCount(href: string, counts?: ApprovalBadgeCounts): number {
  if (!counts) return 0;
  if (href.includes('/approvals')) return counts.approvals ?? 0;
  if (href.includes('/expenses')) return counts.expenses ?? 0;
  return 0;
}

export { DomainNav, SidebarNavSkeleton };
export type { DomainNavProps, ApprovalBadgeCounts };


