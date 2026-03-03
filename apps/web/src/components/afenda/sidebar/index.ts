/**
 * @module afenda/sidebar
 *
 * Afenda Sidebar — shadcn sidebar-10 pattern.
 * Categories, nav items, and secondary items are config-driven
 * via `@/lib/sidebar/sidebar-config`.
 */

export { AfendaSidebar } from './afenda-sidebar';
export type { AfendaSidebarProps } from './afenda-sidebar';

export { NavMain } from './nav-main';
export type { NavMainItem } from './nav-main';

export { NavFavorites } from './nav-favorites';

export { NavQuickActions } from './nav-quick-actions';

export { NavCategories } from './nav-categories';
export type { SidebarCategory, SidebarModuleEntry } from './nav-categories';

export { NavPortals } from './nav-portals';

export { NavSecondary } from './nav-secondary';
export type { NavSecondaryItem } from './nav-secondary';
