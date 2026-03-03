import type { NavGroup } from '@/lib/constants';

// ─── Shortcut Card Types ────────────────────────────────────────────────────

export type FeatureStatus = 'active' | 'setup-required' | 'beta' | 'planned';

export interface ShortcutCard {
  featureId: string;
  title: string;
  description?: string;
  icon: string;
  items: Array<{ title: string; href: string }>;
  viewAllHref?: string;
  order?: number;
  status?: FeatureStatus;
}

// ─── Derivation ─────────────────────────────────────────────────────────────

const MAX_ITEMS_PER_CARD = 6;

/**
 * Derive dashboard shortcut cards from NavGroup[].
 * Constraints: max items per card, skip empty groups, optional shortcut metadata.
 */
export function deriveShortcuts(navGroups: NavGroup[]): ShortcutCard[] {
  const result = navGroups
    .filter((g) => g.items.length > 0)
    .map((g) => {
      const maxItems = g.shortcut?.maxItems ?? MAX_ITEMS_PER_CARD;
      return {
        featureId: g.featureId ?? g.title.toLowerCase().replace(/\s+/g, '-'),
        title: g.shortcut?.title ?? g.title,
        description: g.shortcut?.description,
        icon: g.shortcut?.icon ?? g.icon,
        items: g.items.slice(0, maxItems).map((item) => ({
          title: item.title,
          href: item.href,
        })),
        viewAllHref: g.href ?? (g.items.length > maxItems ? g.items[0]?.href : undefined),
      };
    });

  return result;
}
