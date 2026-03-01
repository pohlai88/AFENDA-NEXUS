import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { getIcon } from '@/lib/modules/icon-map';
import type { ShortcutCard } from '@/lib/modules/derive-shortcuts';

// ─── Feature Card ────────────────────────────────────────────────────────────
// Renders a single nav group as a feature card in the domain dashboard
// bottom panel. Each card shows the group title, description, and a list
// of navigable items — identical shape to ShortcutCard but styled for the
// two-panel domain dashboard layout.

interface FeatureCardProps {
  card: ShortcutCard;
}

function FeatureCard({ card }: FeatureCardProps) {
  const Icon = getIcon(card.icon);

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-sm">{card.title}</CardTitle>
            {card.description && (
              <CardDescription className="text-xs">{card.description}</CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
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
FeatureCard.displayName = 'FeatureCard';

export { FeatureCard };
export type { FeatureCardProps };
