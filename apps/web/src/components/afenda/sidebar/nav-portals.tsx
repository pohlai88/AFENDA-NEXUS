'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ExternalLink } from 'lucide-react';
import { getIcon } from '@/lib/modules/icon-map';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { PortalDef } from '@/lib/sidebar/sidebar-config';

// ─── NavPortals ──────────────────────────────────────────────────────────────

/**
 * Portal section — external-facing portals for different stakeholders.
 *
 * Positioned above the Navigation categories in the sidebar.
 * Each portal links to a distinct self-service experience:
 * Customer, Supplier, Investor, Franchisee, etc.
 *
 * Uses 3D emoji icons consistent with the category style.
 */
export function NavPortals({ portals }: { portals: PortalDef[] }) {
  const pathname = usePathname();

  if (portals.length === 0) return null;

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Portals</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {portals.map((portal) => {
            const isActive = pathname === portal.href || pathname.startsWith(`${portal.href}/`);
            const PortalIcon = getIcon(portal.icon);

            return (
              <SidebarMenuItem key={portal.href}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={portal.label}>
                      <Link href={portal.href}>
                        <span className="shrink-0 text-base leading-none" role="img" aria-hidden>
                          {portal.emoji}
                        </span>
                        <span className="min-w-0 flex-1 truncate">{portal.label}</span>
                        <ExternalLink
                          className="ml-auto size-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover/menu-button:opacity-100"
                          aria-hidden
                        />
                      </Link>
                    </SidebarMenuButton>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="text-xs">
                    {portal.description}
                  </TooltipContent>
                </Tooltip>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
NavPortals.displayName = 'NavPortals';
