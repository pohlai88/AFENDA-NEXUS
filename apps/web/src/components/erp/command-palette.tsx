"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
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
} from "lucide-react";

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

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const navigate = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router],
  );

  const flatItems = navigationConfig.flatMap((item) =>
    item.children
      ? item.children.map((child) => ({
          ...child,
          group: item.title,
          groupIcon: item.icon,
        }))
      : [{ ...item, group: "General", groupIcon: item.icon }],
  );

  const groups = Array.from(new Set(flatItems.map((i) => i.group)));

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {groups.map((group, idx) => (
          <div key={group}>
            {idx > 0 && <CommandSeparator />}
            <CommandGroup heading={group}>
              {flatItems
                .filter((i) => i.group === group)
                .map((item) => {
                  const Icon = iconMap[item.icon] ?? FileText;
                  return (
                    <CommandItem
                      key={item.href}
                      onSelect={() => navigate(item.href)}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      <span>{item.title}</span>
                    </CommandItem>
                  );
                })}
            </CommandGroup>
          </div>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
