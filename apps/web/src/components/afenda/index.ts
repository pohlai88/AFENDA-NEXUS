/**
 * @module afenda
 *
 * Afenda App Shell — the stable, production-grade application shell.
 *
 * All components use the `Afenda` prefix for clear namespacing.
 * Drop-in replacement for the old `AppShell` from `@/components/erp`.
 */

export { AfendaAppShell } from './afenda-app-shell';
export type { AfendaAppShellProps } from './afenda-app-shell';

export { AfendaShellHeader } from './afenda-shell-header';
export type { AfendaShellHeaderProps } from './afenda-shell-header';

export { AfendaSidebar } from './sidebar';
export type { AfendaSidebarProps } from './sidebar';

export { AfendaStatusCluster } from './afenda-status-cluster';

export { AfendaDisplayCluster } from './afenda-display-cluster';

export { AfendaCommandPalette } from './afenda-command-palette';
export type { AfendaCommandPaletteProps } from './afenda-command-palette';

export { AfendaShortcutDialog } from './afenda-shortcut-dialog';
export type { AfendaShortcutDialogProps } from './afenda-shortcut-dialog';
export { ShortcutPopover } from './shortcut-popover';

export { SHELL } from './shell.tokens';
export type * from './shell.tokens';

export type { EntityTypeConfig } from './afenda-command-palette';
