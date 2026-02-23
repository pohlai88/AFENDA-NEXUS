"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { navigationConfig } from "@/lib/constants";
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Scale,
  List,
  Calendar,
  BarChart3,
  Settings,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard,
  BookOpen,
  FileText,
  Scale,
  List,
  Calendar,
  BarChart3,
  Settings,
};

export function SidebarNav({ collapsed = false }: { collapsed?: boolean }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Main navigation" className="flex flex-col gap-1 px-2 py-4">
      {navigationConfig.map((item) =>
        item.children ? (
          <NavGroup
            key={item.title}
            item={item}
            pathname={pathname}
            collapsed={collapsed}
          />
        ) : (
          <NavLink
            key={item.title}
            href={item.href}
            icon={item.icon}
            label={item.title}
            active={pathname === item.href}
            collapsed={collapsed}
          />
        ),
      )}
    </nav>
  );
}

function NavGroup({
  item,
  pathname,
  collapsed,
}: {
  item: (typeof navigationConfig)[number];
  pathname: string;
  collapsed: boolean;
}) {
  const isActive = item.children?.some((c) => pathname.startsWith(c.href)) ?? false;
  const [open, setOpen] = useState(isActive);
  const Icon = iconMap[item.icon] ?? BookOpen;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          isActive
            ? "bg-accent text-accent-foreground"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        )}
        aria-expanded={open}
      >
        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
        {!collapsed && (
          <>
            <span className="flex-1 text-left">{item.title}</span>
            <ChevronDown
              className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
              aria-hidden="true"
            />
          </>
        )}
      </button>
      {open && !collapsed && item.children && (
        <div className="ml-4 mt-1 flex flex-col gap-0.5 border-l pl-3">
          {item.children.map((child) => (
            <NavLink
              key={child.title}
              href={child.href}
              icon={child.icon}
              label={child.title}
              active={pathname === child.href}
              collapsed={false}
              compact
            />
          ))}
        </div>
      )}
    </div>
  );
}

function NavLink({
  href,
  icon,
  label,
  active,
  collapsed,
  compact = false,
}: {
  href: string;
  icon: string;
  label: string;
  active: boolean;
  collapsed: boolean;
  compact?: boolean;
}) {
  const Icon = iconMap[icon] ?? FileText;

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-md transition-colors",
        compact ? "px-2 py-1.5 text-xs" : "px-3 py-2 text-sm font-medium",
        active
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
      )}
      aria-current={active ? "page" : undefined}
    >
      <Icon className={cn("shrink-0", compact ? "h-3.5 w-3.5" : "h-4 w-4")} aria-hidden="true" />
      {!collapsed && <span>{label}</span>}
    </Link>
  );
}
