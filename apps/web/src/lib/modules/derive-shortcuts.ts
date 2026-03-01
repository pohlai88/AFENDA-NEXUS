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
  // #region agent log
  // eslint-disable-next-line no-restricted-syntax
  fetch('http://127.0.0.1:7877/ingest/5572b893-09bf-4986-bb0f-a54b06329d22',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'b56243'},body:JSON.stringify({sessionId:'b56243',location:'derive-shortcuts.ts:26',message:'deriveShortcuts entry',data:{totalGroups:navGroups.length,groupsWithItems:navGroups.filter(g=>g.items.length>0).length,groupsSample:navGroups.slice(0,3).map(g=>({featureId:g.featureId,title:g.title,itemsLen:g.items.length}))},timestamp:Date.now(),hypothesisId:'H2'})}).catch(()=>{});
  // #endregion

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
        viewAllHref: g.items.length > maxItems ? g.items[0]?.href : undefined,
      };
    });

  // #region agent log
  // eslint-disable-next-line no-restricted-syntax
  fetch('http://127.0.0.1:7877/ingest/5572b893-09bf-4986-bb0f-a54b06329d22',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'b56243'},body:JSON.stringify({sessionId:'b56243',location:'derive-shortcuts.ts:47',message:'deriveShortcuts exit',data:{resultCount:result.length,resultSample:result.slice(0,2).map(r=>({featureId:r.featureId,title:r.title}))},timestamp:Date.now(),hypothesisId:'H2'})}).catch(()=>{});
  // #endregion

  return result;
}
