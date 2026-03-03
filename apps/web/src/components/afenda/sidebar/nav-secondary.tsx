'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getIcon } from '@/lib/modules/icon-map';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface NavSecondaryItem {
  title: string;
  href: string;
  icon: string;
  badge?: React.ReactNode;
}

// ─── NavSecondary ────────────────────────────────────────────────────────────

/**
 * Bottom utility bar — shadcn sidebar-10 NavSecondary pattern.
 * Settings, Admin, Help — always visible at the sidebar bottom.
 */
export function NavSecondary({
  items,
  ...props
}: { items: NavSecondaryItem[] } & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  const pathname = usePathname();

  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const Icon = getIcon(item.icon);
            const isActive = pathname.startsWith(item.href);
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                  <Link href={item.href}>
                    <Icon  aria-hidden="true" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
                {item.badge && <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>}
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
NavSecondary.displayName = 'NavSecondary';
