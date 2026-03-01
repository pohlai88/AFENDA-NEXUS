'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface NavMainItem {
  title: string;
  href: string;
  icon: string;
  /** 3D emoji displayed in sidebar. */
  emoji: string;
  isActive?: boolean;
  badge?: string;
}

// ─── NavMain ─────────────────────────────────────────────────────────────────

/**
 * Top-level quick-access items (Home, Approvals) — sidebar-10 NavMain pattern.
 *
 * Uses 3D emoji icons (like the category headers) for visual hierarchy.
 * Badge values come from live data (AttentionSummary), never hardcoded.
 */
export function NavMain({ items }: { items: NavMainItem[] }) {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {items.map((item) => {
        const isActive =
          item.isActive ??
          (item.href === '/home'
            ? pathname === '/home' || pathname === '/'
            : pathname.startsWith(item.href));

        return (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
              <Link href={item.href}>
                <span className="shrink-0 text-base leading-none" role="img" aria-hidden>
                  {item.emoji}
                </span>
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
            {item.badge && <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>}
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
NavMain.displayName = 'NavMain';
