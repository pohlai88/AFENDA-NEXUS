import type { NavGroup } from '@/lib/constants';

// ─── Shortcut Card Types ────────────────────────────────────────────────────

export interface ShortcutCard {
  title: string;
  description?: string;
  icon: string;
  items: Array<{ title: string; href: string }>;
  viewAllHref?: string;
}

// ─── Derivation ─────────────────────────────────────────────────────────────

const MAX_ITEMS_PER_CARD = 6;

/**
 * Derive dashboard shortcut cards from NavGroup[].
 * Constraints: max items per card, skip empty groups, optional shortcut metadata.
 */
export function deriveShortcuts(navGroups: NavGroup[]): ShortcutCard[] {
  return navGroups
    .filter((g) => g.items.length > 0)
    .map((g) => {
      const maxItems = g.shortcut?.maxItems ?? MAX_ITEMS_PER_CARD;
      return {
        title: g.shortcut?.title ?? g.title,
        description: g.shortcut?.description,
        icon: g.shortcut?.icon ?? g.icon,
        items: g.items.slice(0, maxItems).map((item) => ({
          title: item.title,
          href: item.href,
        })),
        viewAllHref: g.items.length > maxItems ? g.items[0]?.href : undefined,
      };
    });
}
