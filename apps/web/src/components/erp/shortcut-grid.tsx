import * as React from 'react';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  CreditCard,
  Landmark,
  FileCheck,
  Users,
  Banknote,
  Star,
  TrendingUp,
  Sparkles,
  MessageSquare,
  FolderKanban,
  Building2,
  Settings,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { ShortcutCard } from '@/lib/modules/derive-shortcuts';

// ─── Icon Map ───────────────────────────────────────────────────────────────

const shortcutIconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  BookOpen,
  FileText,
  CreditCard,
  Landmark,
  FileCheck,
  Users,
  Banknote,
  Star,
  TrendingUp,
  Sparkles,
  MessageSquare,
  FolderKanban,
  Building2,
  Settings,
  ShieldCheck,
  CheckCircle,
};

// ─── Shortcut Grid ──────────────────────────────────────────────────────────

interface ShortcutGridProps {
  shortcuts: ShortcutCard[];
}

function ShortcutGrid({ shortcuts }: ShortcutGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {shortcuts.map((card) => (
        <ShortcutCardComponent key={card.title} card={card} />
      ))}
    </div>
  );
}

function ShortcutCardComponent({ card }: { card: ShortcutCard }) {
  const Icon = shortcutIconMap[card.icon] ?? FileText;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm">{card.title}</CardTitle>
        </div>
        {card.description && (
          <CardDescription className="text-xs">{card.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-1">
          {card.items.map((item, i) => (
            <Link
              key={`${item.href}-${i}`}
              href={item.href}
              className={cn(
                'rounded-md px-2 py-1.5 text-sm transition-colors',
                'hover:bg-accent hover:text-accent-foreground',
              )}
            >
              {item.title}
            </Link>
          ))}
          {card.viewAllHref && (
            <Link
              href={card.viewAllHref}
              className="mt-1 text-xs text-muted-foreground hover:text-foreground"
            >
              View all →
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
ShortcutCardComponent.displayName = 'ShortcutCardComponent';

export { ShortcutGrid };
export type { ShortcutGridProps };
