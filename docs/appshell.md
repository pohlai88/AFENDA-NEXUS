
---

## Plan: Enterprise App Shell v2 — "Command Center" (Revised)

**TL;DR:** Transform the app shell into an intelligent command center — but with production-grade guards: a 3-primary header that clusters secondary controls (not 9 buttons), real entity search from day one (not a placeholder), shortcut engine with scope arbitration and input safety, notification schema with `dedupeKey`/`severity`/`companyId`, explainable attention items, auto-breadcrumbs with safe `[id]` fallback, density toggle with FOUC prevention via inline script, a unified `ShellPreferences` persistence layer (cookie vs localStorage boundary made explicit), and charts deferred behind feature flag. Single milestone, 8 workstreams in dependency order.

### Why this beats the giants

| ERP Pain Point | Afenda's Answer |
|---|---|
| SAP/Oracle: Search requires knowing transaction codes | **Real omni-search**: multi-entity `ilike()` across journals, invoices, suppliers, accounts — tenant-scoped via RLS |
| QuickBooks/Zoho: No keyboard power-user flow | **Scoped shortcut engine** with `g j` sequences, `j/k` table nav, `?` shortcut map — with input safety + modal awareness |
| All: Notifications = email-only, no in-app queue | **Notification center** (outbox-driven) + **Needs Attention** (explainable items with reason/evidence/lastComputedAt) |
| Odoo/ERPNext: Dense UI with no density control | **4 density profiles** (Default/Compact/Ultra/Touch) already in CSS, now exposed via toggle + FOUC-free inline script |
| SAP Fiori: Header is rigid, doesn't adapt | **3-primary header** (breadcrumbs + search + user) with **Status** and **Display** clusters — never overflows at 1280px |
| All: Shell state resets on refresh/navigation | **`ShellPreferences`** with versioned persistence — cookie for SSR-critical, localStorage for convenience |
| All: Breadcrumbs are wrong for dynamic routes | **Auto-breadcrumbs** with safe `[id]` handling — generic label unless page provides `export const breadcrumbLabel` |

---

### Steps

#### Workstream 1 — `ShellPreferences` + Persistence Layer (Files: 3 new, 2 modified)

_Foundation for everything else — defines where each piece of shell state lives._

1. Create a preferences types file at src/lib/shell/shell-preferences.types.ts — define `ShellPreferences` object with explicit version field:
   - `{ v: 1, density: 'default'|'compact'|'ultra'|'touch', leftCollapsed: boolean, rightOpen: boolean }`
   - Document the persistence boundary: `density`, `leftCollapsed`, `rightOpen` → **cookie** (needed by SSR to avoid FOUC/layout shift). `theme` stays with `next-themes` (already cookie-backed). Everything else → **`localStorage`**
   - Define `ShellConveniencePrefs`: `{ favorites: FavoriteItem[], recents: RecentItem[], dashboardLayout: WidgetVisibility }` — localStorage-only

2. Create a persistence utility at src/lib/shell/shell-persistence.ts:
   - `readShellCookie(): ShellPreferences` — parse from cookie string (with version migration), fallback to defaults
   - `writeShellCookie(prefs: Partial<ShellPreferences>)` — client-side `document.cookie` write (same pattern as `sidebar_left` in sidebar.tsx), max-age 30 days, `sameSite=lax`, `path=/`
   - `readConveniencePrefs(key): T` / `writeConveniencePrefs(key, value)` — localStorage wrapper with JSON parse/stringify + error handling
   - Cookie name: `shell_prefs` (single cookie, JSON-encoded, ~100 bytes)

3. Create a preferences provider at src/providers/shell-preferences-provider.tsx:
   - `useShellPreferences()` hook returning `{ prefs, setPref(key, value) }` — merges cookie reads with React state
   - On `setPref`: immediately update React state + write cookie (SSR-critical fields) or localStorage (convenience fields)
   - Initialize from cookie value passed as `defaultPrefs` prop from server layout (read via `cookies().get('shell_prefs')`)

4. Modify src/components/erp/app-shell.tsx — wrap children in `ShellPreferencesProvider`. Replace the existing `useState(true)` for `rightOpen` with the preference value. Remove standalone `rightOpen` state — it's now managed by `ShellPreferences`

5. Modify src/app/(shell)/layout.tsx/layout.tsx) — read `shell_prefs` cookie server-side via `const cookieStore = await cookies()`, parse with `readShellCookie()`, pass `defaultPrefs` to `AppShell` for SSR-correct initial render

#### Workstream 2 — Header Restructure + Auto-Breadcrumbs (Files: 3 new, 4 modified)

_Scalable header that doesn't overflow at 1280px with real tenant/company names._

6. Create auto-breadcrumb utility at src/lib/breadcrumbs/auto-breadcrumbs.ts:
   - `deriveBreadcrumbs(pathname: string, modules: ClientModuleWithNav[]): Breadcrumb[]`
   - Parse pathname segments, strip `(shell)` route group
   - Map first segment to module label from `ModuleSpec` (e.g. `finance` → "Finance")
   - Map known entity segments via a static label registry: `{ journals: 'Journal Entries', accounts: 'Chart of Accounts', payables: 'Accounts Payable', ... }` — approximately 40 entries derived from `constants.ts` `NavGroup` data
   - **For `[id]` segments**: skip entirely (don't show UUID). The breadcrumb trail becomes "Finance > Journal Entries" not "Finance > Journal Entries > 8f3a..."
   - **Page-level override**: if a page exports `export const breadcrumbLabel = 'Invoice #INV-2024-001'`, the header reads it via a lightweight `usePageBreadcrumb()` context. This lets detail pages show human-readable labels without a separate data fetch
   - Limit trail to 4 visible items; use `BreadcrumbEllipsis` for deeper routes

7. Create `usePageBreadcrumb` context at src/providers/page-breadcrumb-provider.tsx — lightweight context that detail pages can call `setPageBreadcrumb('Invoice #INV-001')` to override the last breadcrumb segment. Resets on pathname change

8. Create display cluster component at src/components/erp/display-cluster.tsx — single `DropdownMenu` triggered by a `SlidersHorizontal` icon. Contains: **Density** sub-group (4 radio options: Default/Compact/Ultra/Touch, with current density checked, persists via `useShellPreferences().setPref('density', ...)`) + **Theme** sub-group (Light/Dark/System, replacing the standalone `ThemeToggle`). Separator between groups. This collapses 2 header buttons into 1

9. **Redesign** src/components/erp/shell-header.tsx — new 3-primary layout:

   **Desktop (≥ md):**
   ```
   [☰ Left] [Breadcrumbs...] ── gap ── [+] [⌘K Search...] [StatusCluster] [DisplayCluster] [👤 User] [≡ Right]
   ```

   **Mobile (< md):**
   ```
   [☰ Left] [Current Page Title] ── gap ── [⌘K] [👤 User] [≡ Right]
   ```

   - **3 always-visible primaries**: Breadcrumbs (or page title on mobile), `⌘K` search button, User menu
   - **Status cluster** (Step 17+22 — added later in workstreams 5+6): `Popover` with combined attention + notification count badge. Hidden when zero. This is a **slot** that workstreams 5+6 fill
   - **Display cluster**: density + theme merged (Step 8)
   - **Quick Actions `+`**: visible on `md:` and up. On small widths, "New..." actions are accessible via the `⌘K` palette instead (action registry)
   - Remove standalone `ThemeToggle` component usage from header
   - Keep sidebar triggers at the edges

10. Add density FOUC prevention — modify src/app/layout.tsx: add an inline `<script dangerouslySetInnerHTML>` before `<body>` children that reads the `shell_prefs` cookie, extracts `density`, and sets `document.documentElement.dataset.density = density` (using `data-density` attribute). The `_density.css` selectors already use CSS classes — add matching `[data-density="compact"]` selectors as aliases. This runs before React hydrates, preventing FOUC. Pattern mirrors how `next-themes` handles theme flash

11. Modify src/components/erp/page-header.tsx — when `breadcrumbs` prop is empty/undefined and auto-breadcrumbs are rendering in the shell header, hide the PageHeader breadcrumb section to avoid duplication. Add a `hideShellBreadcrumbs?: boolean` prop for pages that want explicit control

#### Workstream 3 — Command Palette v2 with Real Entity Search (Files: 4 new, 2 modified)

_Real omni-search from day one — not a placeholder._

12. Create search types at src/lib/search/search.types.ts:
    - `SearchCategory`: `'recent' | 'favorite' | 'action' | 'navigation' | 'entity'`
    - `SearchResult`: `{ id, category, title, subtitle?, icon?, href, moduleId?, shortcut? }`
    - `SearchAction`: `{ id, title, icon, shortcut?, handler: () => void }` — for theme toggle, density change, etc.
    - `RecentItem`: `{ href, title, moduleId, ts }` — no PII (no tenant/user name)

13. Create recent-items hook at src/hooks/use-recent-items.ts:
    - Track in client component only — `usePathname()` + `useEffect()` (never during server render)
    - **Debounce**: 1000ms after last pathname change before writing (handles parallel route / searchParam rapid changes)
    - **Dedupe**: Skip if `href` matches the most recent entry
    - Store max 20 items in `localStorage` via `writeConveniencePrefs('recents', items)`
    - `addRecent(href, title, moduleId)`, `getRecent(): RecentItem[]`, `clearRecent()`

14. Create action registry at src/lib/search/action-registry.ts:
    - `ActionRegistry` — register quick actions with `{ id, title, icon, shortcut?, scope?, handler }` 
    - Pre-registered actions: "New Journal Entry" (`g finance/journals/new`), "New Invoice", "New Supplier", "Switch Theme Light/Dark/System", "Toggle Compact Mode", "Open Keyboard Shortcuts"
    - Context-aware: filter by active module when rendering in palette
    - `searchActions(query): SearchAction[]` — fuzzy match against title

15. Create global search server action at src/features/platform/search/actions/global-search.action.ts:
    - `'use server'` action: `searchGlobal(q: string, scope?: { moduleId?: string }): Promise<SearchResult[]>`
    - Gets `RequestContext` via `getRequestContext()` — tenant-scoped
    - Queries **4 entity types** with `ilike()` (case-insensitive), top 5 each:
      - Journals: `gl_journal` by `reference` / `memo` → "Journal #REF-001"
      - Accounts: `account` by `code` / `name` → "1000 - Cash at Bank"
      - Suppliers: `supplier` by `name` / `code` → "Acme Corp (SUP-001)"
      - Invoices: `ap_invoice` by `invoiceNumber` / `memo` → "INV-2024-001"
    - Uses `Promise.all()` for parallel queries (same pattern as admin.service.ts)
    - All queries go through `withTenant()` for RLS enforcement
    - Returns unified `SearchResult[]` sorted by relevance (exact match first, then prefix, then contains)
    - Guard: query must be ≥2 chars, max 100 chars

16. Rewrite src/components/erp/command-palette.tsx:
    - **No search query (empty)**: Show Favorites → Recent → Quick Actions (grouped by `CommandGroup`)
    - **With search query**: Show Actions (filtered) → Navigation (filtered from modules) → Entities (from `searchGlobal()` debounced at 300ms via `useDebounce`)
    - Entity results show in a "Results" group with entity type badges (Journal / Account / Supplier / Invoice)
    - Loading state for entity search: `CommandLoading` spinner
    - Keyboard shortcut badges on action items (e.g. `⌘N` next to "New Journal")
    - Keep `Cmd/Ctrl+K` trigger + header button integration

17. Modify src/components/erp/app-shell.tsx — integrate `useRecent()` with `usePathname()` to auto-track visited pages. Pass favorites to `CommandPalette`

#### Workstream 4 — Shortcut Engine with Scope Arbitration (Files: 3 new, 3 modified)

_Input-safe, scope-aware, sequence-capable._

18. Create shortcut engine at src/lib/shortcuts/shortcut-engine.ts:
    - **Input safety**: Ignore all shortcuts when `event.target` is `input | textarea | select | [contenteditable]`. Exception: `Escape` always fires (for clearing search, closing dialogs)
    - **Modal awareness**: Before dispatching, check `document.querySelector('[role="dialog"]:not([hidden]), [role="alertdialog"]:not([hidden])')` — if any open dialog exists, only process shortcuts registered at `dialog` scope
    - **Scope priority** (highest → lowest): `dialog > cmdk > sheet > table > page > global`. Only the highest active scope receives the shortcut. Scope activation is tracked via a stack (push on mount, pop on unmount)
    - **Multi-key sequences**: Buffer system — first key starts a 500ms timer. If second key arrives in time, match the sequence (`g` + `j` → "Go to Journals"). If timer expires, reset buffer and treat as single key
    - **Buffer reset on**: `Escape`, timeout (500ms), `focusin` event (focus moved), any modifier key press
    - `registerShortcut(id, keys, handler, scope?)`, `unregisterShortcut(id)`, `getRegistered(): ShortcutRegistration[]`
    - Global `addEventListener('keydown')` on `document` — single listener, engine dispatches internally

19. Create shortcut provider at src/providers/shortcut-provider.tsx:
    - `ShortcutProvider` — wraps the engine in React context
    - `useRegisterShortcut(id, keys, handler, scope?)` — registers on mount, unregisters on unmount via `useEffect` cleanup
    - `useShortcutScope(scope)` — pushes scope onto the stack when the component mounts, pops on unmount. Used by `Dialog`, `Sheet`, `CommandDialog` wrappers
    - `useRegisteredShortcuts(): ShortcutRegistration[]` — for the shortcut dialog to list all shortcuts

20. Create shortcut dialog at src/components/erp/shortcut-dialog.tsx:
    - `Dialog` triggered by `?` shortcut (global scope)
    - Shows all registered shortcuts grouped by scope (Global → Navigation → Table → Page)
    - Each row: description + key combo badge (rendered with `<kbd>` elements)
    - Scrollable, searchable via a filter input at the top

21. Register global shortcuts in src/components/erp/app-shell.tsx:
    - Navigation: `g j` → journals, `g a` → accounts, `g p` → periods, `g l` → ledgers, `g b` → banking, `g x` → expenses, `g s` → settings, `g d` → dashboard
    - Shell: `?` → shortcut dialog, `Cmd+\` → focus mode (collapse both sidebars, show restore FAB), `Cmd+K` → command palette (already exists, alias in engine)
    - All at `global` scope

22. Add table-scoped shortcuts in src/components/erp/data-table.tsx:
    - `j` / `k` → row down/up (track `focusedRowIndex` state), `Enter` → navigate to row href, `/` → focus search input, `Escape` → blur search
    - Only active when DataTable is focused (use `useShortcutScope('table')` inside DataTable)

23. Add shortcut hint badges to src/components/erp/sidebar-nav.tsx — show hint for nav items that have a registered shortcut (e.g. `g j` on Journals). Hints shown only when sidebar is expanded, styled as `muted-foreground text-xs` badges

#### Workstream 5 — Notifications (Files: 5 new, 3 modified)

_Outbox-driven, ERP-grade, not chat-like._

24. Create notification DB schema at packages/db/src/schema/notification.ts:
    - `notification` table (inside `erpSchema`):
      - `...pkId()`, `...tenantCol()`, `...timestamps()`
      - `userId` uuid not null (FK to user)
      - `companyId` uuid nullable (scopes to company when relevant — e.g., overdue invoice alert for company X)
      - `type` enum: `approval_request | overdue_invoice | period_close | reconciliation_alert | budget_breach | system | announcement`
      - `severity` enum: `info | warning | critical`
      - `title` text not null
      - `body` text nullable
      - `href` text nullable (deep link to relevant page)
      - `metadata` jsonb default `{}`
      - `read` boolean default false
      - `dismissedAt` timestamp nullable
      - `dedupeKey` text nullable — prevents spam (e.g. `overdue:INV-001` so the same invoice doesn't generate multiple alerts)
      - `.enableRLS()`
    - `notification_preference` table: `userId`, `tenantId`, `channel` enum (`in_app | email`), `type` (same notification type enum), `enabled` boolean
    - **Indexes**:
      - `(tenantId, userId, read, createdAt desc)` — unread-first inbox query
      - `(tenantId, userId, dismissedAt)` — cleanup query
      - `(tenantId, dedupeKey)` unique partial where `dismissedAt IS NULL` — dedupe constraint

25. Create notification types at src/lib/notifications/notification.types.ts:
    - `NotificationType`, `NotificationSeverity`, `Notification`, `NotificationPreferences`

26. Create notification server actions at src/features/platform/notifications/actions/notification.actions.ts:
    - `getNotifications(opts?: { unreadOnly?: boolean, limit?: number }): Promise<Notification[]>` — tenant+user scoped, ordered by `createdAt desc`
    - `getUnreadCount(): Promise<number>` — count of `read=false` for current user
    - `markRead(id: string)`, `markAllRead()`, `dismissNotification(id: string)`
    - All follow Pattern A: `getRequestContext()` → query via `withTenant()`

27. Create notification center component at src/components/erp/notification-center.tsx:
    - `Sheet` (right side), triggered by bell icon in header status cluster
    - Groups notifications by date: "Today" / "Yesterday" / "Earlier"
    - Each notification: severity-colored icon by type, title, body, relative timestamp (`date-fns` `formatDistanceToNow`), "Mark read" button
    - Header: "Notifications" title + "Mark all read" button + "Preferences" link → `/settings/preferences#notifications`
    - Empty state: `<EmptyState contentKey="platform.notifications" size="sm" />`
    - **Client polling ONLY when sheet is open** — 60s interval via `setInterval` in a `useEffect` guarded by `isOpen`

28. Add status cluster to src/components/erp/shell-header.tsx:
    - Single `Popover` trigger with combined badge count (attention items + unread notifications)
    - Trigger icon: `Bell` when only notifications, `AlertTriangle` when attention items exist
    - Badge: amber for warnings, red if any critical, hidden when zero
    - Popover content: two tabs — "Attention" (from workstream 6) and "Notifications" (opens notification sheet on "View all")
    - **Header unread count**: use `revalidatePath('/(shell)', 'layout')` from server actions that create notifications — no polling needed for the badge count. The layout re-renders on navigation, picking up fresh count via a Suspense-wrapped server component

29. Wire notifications into src/components/erp/app-shell.tsx — render notification `Sheet`, pass open state

#### Workstream 6 — Needs Attention Registry (Files: 3 new, 1 modified)

_Explainable, auditable, testable._

30. Create attention types at src/lib/attention/attention.types.ts:
    - `AttentionSeverity`: `'critical' | 'warning' | 'info'`
    - `AttentionItem`: `{ id, severity, title, count, href, reason: string, evidence: string | Record<string, unknown>, lastComputedAt: Date }`
      - `reason` — user-facing explanation: "3 AP invoices are past due date"
      - `evidence` — query summary or IDs: `{ overdueIds: ['INV-001', 'INV-003', 'INV-007'], oldestDueDate: '2026-01-15' }`
      - `lastComputedAt` — when this resolver last ran (for staleness detection)
    - `AttentionSummary`: `{ total: number, critical: number, warning: number, info: number, items: AttentionItem[] }`

31. Create attention registry at src/lib/attention/attention-registry.server.ts:
    - Server-only registry (same architecture as kpi-registry.server.ts — error-isolated resolvers, failing resolver produces a stub, never crashes the shell)
    - **Initial resolvers** (6):
      - `pendingApprovals` — count of `approval_request` where `status=PENDING` for current user
      - `overduePayables` — count of `ap_invoice` where `dueDate < now()` and `status=POSTED`
      - `overdueReceivables` — count of `ar_invoice` where `dueDate < now()` and `status=POSTED`
      - `unreconciled` — count of `bank_statement_line` where `matchStatus=UNMATCHED`
      - `unclosedPeriods` — count of `fiscal_period` where `endDate < now()` and `status != CLOSED`
      - `budgetBreaches` — count of accounts exceeding budget threshold
    - Each resolver returns `AttentionItem` with `reason` and `evidence`
    - **Deterministic + testable**: resolvers are pure functions of DB state. Each has a corresponding fixture test with known input → expected output
    - `resolveAttentionSummary(ctx: RequestContext): Promise<AttentionSummary>` — runs all resolvers via `Promise.allSettled()`, aggregates, sorts by severity

32. Create attention component at src/components/erp/needs-attention.tsx:
    - Renders inside the status cluster popover's "Attention" tab (Step 28)
    - List of attention items: severity icon (red `AlertOctagon` / amber `AlertTriangle` / blue `Info`), title, count badge, "reason" text, "View →" link
    - Each item expandable to show `evidence` details and `lastComputedAt` timestamp ("Computed 2 minutes ago")
    - Empty state: green `CheckCircle` + "Everything looks good"
    - Data loaded via Suspense-wrapped async server component in the shell layout

33. Wire attention into src/app/(shell)/layout.tsx/layout.tsx) — call `resolveAttentionSummary(ctx)` and pass result to `AppShell`. Wrapped in error boundary so a failing resolver never breaks navigation

#### Workstream 7 — Favorites + Quick Actions (Files: 3 new, 3 modified)

_Wired into palette and sidebar, not standalone._

34. Create favorites hook at src/hooks/use-favorites.ts:
    - `useFavorites()` — CRUD for starred pages in localStorage via `writeConveniencePrefs('favorites', items)`
    - `FavoriteItem`: `{ href, title, icon?, moduleId, addedAt }`
    - Max 20 items. `toggle(item)`, `isFavorite(href): boolean`, `getFavorites(): FavoriteItem[]`
    - No PII stored

35. Add favorites section to src/components/erp/module-sidebar.tsx:
    - `SidebarGroup` at top of sidebar (below header, above module list) labeled "Favorites" with `Star` icon
    - Renders pinned links as `SidebarMenuButton` items
    - Collapsible — shows "Pin pages with ⭐" `SidebarGroupAction` tooltip when empty
    - Only visible when sidebar is expanded (not in icon-only rail mode)

36. Add star toggle to src/components/erp/page-header.tsx:
    - `Star` / `StarOff` icon button next to page title
    - Calls `useFavorites().toggle({ href: pathname, title, moduleId })`
    - Only renders on pages (not on index/list pages — avoids clutter)

37. Create quick-actions integration — instead of a standalone `+` button component, register all "New..." actions in the action registry (Step 14). The `+` button in the header (visible on `md:` and up) opens the command palette pre-filtered to the "Actions" category. On small screens, users access the same actions via `⌘K` → type "new". This avoids a separate component and leverages the existing palette

38. Pass favorites to src/components/erp/command-palette.tsx — show "Favorites" group above "Recent" when no search query is active. Favorites are already available via `useFavorites()` hook

#### Workstream 8 — Dashboard v2 + Charts (Conditional) (Files: 3 new, 1 modified)

_Charts behind feature flag. KPIs and attention are real._

39. Add shadcn chart wrapper — run `npx shadcn@latest add chart` to install src/components/ui/chart.tsx. This provides `ChartContainer`, `ChartTooltip`, `ChartLegend` themed with `--chart-1` through `--chart-5` tokens already defined in the design system

40. Create chart components at src/components/erp/dashboard-charts.tsx — 3 charts: `CashFlowTrendChart` (area, 6-month), `AgingDistributionChart` (stacked bar, AR+AP), `RevenueExpenseChart` (bar, monthly). Each uses `ChartContainer` + Suspense. **All gated by `featureFlags().isEnabled('dashboard_charts')` — only rendered when `FEATURE_DASHBOARD_CHARTS=1`**. When flag is off, the dashboard shows no charts (KPIs + Attention + Activity only)

41. Create chart resolvers at src/lib/kpis/chart-resolvers.server.ts — server-only async resolvers. Initially return stub data shaped like real domain data. **Each chart displays a "Preview" badge** (`Badge variant="outline"` in the chart card header) until the resolver is wired to real DB queries. This is honest: users see "Preview" rather than fake-real numbers

42. Redesign src/app/(shell)/page.tsx/page.tsx) — new dashboard layout:
    - **Row 1:** 4 KPI cards (refactored to use `KPICard` component instead of inline cards)
    - **Row 2:** Needs Attention widget (left 1/3, real data from workstream 6) + Recent Activity (right 2/3, existing)
    - **Row 3 (flag-gated):** Charts (only when `FEATURE_DASHBOARD_CHARTS` is enabled)
    - **Row 4:** Shortcut grid (collapsed to top 6 items)
    - All sections Suspense-wrapped with shimmer skeletons

---

### New Header Anatomy (responsive)

**Desktop (≥ 1280px):**
```
[☰] Finance > General Ledger > Journals    [+] [⌘K Search...264px] [⚠3🔔2] [⚙] [👤] [≡]
 ↑   ↑ auto-breadcrumbs (up to 4)           ↑     ↑ search          ↑ status ↑    ↑    ↑
 left                                      quick  palette         cluster  disp  user right
 sb                                        acts                   (popover) clstr menu  sb
```

**Tablet (768–1279px):**
```
[☰] Finance > Journals    [+] [⌘K...] [⚠🔔] [⚙] [👤] [≡]
     ↑ ellipsis breadcrumbs
```

**Mobile (< 768px):**
```
[☰] Journals    [🔍] [👤] [≡]
     ↑ current page only
```

**3 primary** always visible. Status + Display clusters collapse to icon-only. Quick Actions collapses into palette.

---

### File Inventory (actual)

| Workstream | New | Modified | Total |
|---|---|---|---|
| 1. ShellPreferences | 3 | 2 | 5 |
| 2. Header + Breadcrumbs | 3 | 4 | 7 |
| 3. Command Palette v2 | 4 | 2 | 6 |
| 4. Shortcut Engine | 3 | 3 | 6 |
| 5. Notifications | 5 | 3 | 8 |
| 6. Needs Attention | 3 | 1 | 4 |
| 7. Favorites + Quick Actions | 2 | 3 | 5 |
| 8. Dashboard v2 | 3 | 1 | 4 |
| **Total** | **~26 new** | **~12 unique modified** | **~38** |

### DB Schema Additions

- `notification` table with `tenantId, userId, companyId?, type, severity, title, body, href, metadata, read, dismissedAt, dedupeKey` + 3 indexes (unread inbox, dismissed cleanup, dedupe unique partial)
- `notification_preference` table with `userId, tenantId, channel, type, enabled`

### Implementation Order (dependency-respecting)

```
1. ShellPreferences ──→ 2. Header + Breadcrumbs ──→ 3. ⌘K Palette v2
                                                          │
                                                          ├──→ 4. Shortcut Engine
                                                          │
                                                    5. Notifications ──→ 6. Needs Attention
                                                                              │
                                                          7. Favorites ←──────┘
                                                          │
                                                    8. Dashboard (conditional)
```

### Verification

- **TypeScript**: `npx tsc --noEmit` — zero new errors
- **Tests**: New test suites for: `deriveBreadcrumbs()` (segment mapping, `[id]` fallback, ellipsis), shortcut engine (sequence detection, input safety, modal suppression, scope priority, buffer reset), `useRecent()` (debounce, dedupe, max 20), `useFavorites()` (CRUD, max 20), attention resolvers (fixtures → deterministic output), `searchGlobal()` (tenant scoping, result format, min 2 chars guard)
- **Vitest**: `npx vitest run` — all existing + new tests pass
- **Drift gate**: Add W28 for shortcut registration patterns, W29 for notification import boundaries
- **Responsive**: Manual check at 1280px, 1440px, 1920px — header never overflows. Check 768px — breadcrumbs truncate to page title
- **Accessibility**: `jest-axe` on notification center, shortcut dialog, status cluster popover, display cluster dropdown
- **Keyboard**: Verify `g j` works on page, doesn't fire in search input, doesn't fire with command palette open
- **FOUC**: Hard-refresh with density=compact cookie → page renders compact immediately, no flash of default density

### Decisions

- **3-primary header over 9-button toolbar**: Breadcrumbs, ⌘K, User always visible. Status (attention + notifications) and Display (density + theme) are clusters. Quick Actions collapses into palette on mobile. Scales to 1280px
- **Real entity search at launch**: `searchGlobal()` queries 4 entity types with `ilike()` through `withTenant()` RLS. Not a placeholder
- **`document.querySelector('[role="dialog"]')` for modal detection**: Simpler than a global overlay context. Standard approach. No new provider needed
- **revalidatePath for notification count** (not polling): Shell layout re-fetches attention + notification count on every navigation. Client polling only when notification sheet is actually open (60s). No 30s everywhere polling
- **Density via `data-density` attribute + inline script**: Mirrors `next-themes` pattern. Inline script reads cookie before paint. CSS selectors match `[data-density="compact"]`
- **Charts behind `FEATURE_DASHBOARD_CHARTS` flag**: Shipped with "Preview" badge. No fake-real numbers in the shell milestone
- **Outbox pattern for notification creation**: Business events write to `outbox` table → worker drains → creates notification rows. Deduplication via `dedupeKey` unique partial index
- **No auto-resolve `[id]` labels**: Breadcrumbs show "Journal Entries" not "Journal #8f3a...". Pages can opt-in with `setPageBreadcrumb()` context call for human-readable detail labels