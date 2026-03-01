# Domain Dashboard Benchmark Specification

**Version:** 1.0  
**Reference:** Finance Dashboard (`/finance`)  
**Scope:** All domain dashboards (AP, AR, GL, Banking, etc.) and future modules (HRM, CRM).

---

## 1. Canonical Layout

```
Header (h1 + description)
  → HeaderBar (time range, comparison, plain language, saved view)
  → KPI Deck (bento grid: KPIs + charts + diagrams)
  → Separator
  → Feature Grid (Features & Functions)
  → [Domain-specific sections: Attention, Activity, Quick Actions]
```

---

## 2. Component Contracts

### DomainDashboardConfig

```ts
interface DomainDashboardConfig {
  domainId: string;
  title: string;
  description: string;
  defaultKpiIds: string[];
  defaultKpiIdsByRole?: Record<string, string[]>;
  availableKpiIds?: string[];
  maxWidgets?: number;
  chartSlotIds?: string[];
  diagramSlotIds?: string[];
  navGroups: NavGroup[];
  savedViewPresets?: SavedViewPreset[];
}
```

### DashboardPrefs

```ts
interface DashboardPrefs {
  selectedWidgetIds?: string[];
  heroWidgetId?: string;        // Opt-in only; set via "Feature as hero" action
  widgetOrder?: string[];
  widgetLayout?: WidgetLayoutItem[];
  topCollapsed?: boolean;
  timeRange?: 'mtd' | 'qtd' | 'ytd' | 'custom';
  plainLanguage?: boolean;
  selectedChartId?: string;
  selectedDiagramId?: string;
  savedViewId?: string;
  comparisonMode?: 'none' | 'vs_prior_period' | 'vs_budget' | 'vs_plan';
}
```

### WidgetLayoutItem

```ts
interface WidgetLayoutItem {
  i: string;  // widget ID
  x: number;
  y: number;
  w: number;
  h: number;
}
```

---

## 3. Variant Rules

### KpiCard

- **Explicit variant:** `variant: 'compact' | 'default' | 'hero'`
- **Fallback:** When `variant` not set, infer from `gridW`/`gridH` (1×1 → compact, else default)
- **Hero:** Only set via explicit user action ("Feature as hero" in card dropdown)
- **Styling:** Use `cva` for all variant styles; hero gets `ring-2 ring-primary/30 shadow-lg`

### Hero Opt-in Behavior

- Dragging/reordering **never** changes hero status
- Hero status persists across refresh
- If hero widget removed from config, hero resets gracefully (no crash)
- Empty hero slot shows placeholder: "Drag a KPI here to feature it" with `Badge variant="secondary"`

---

## 4. Chart Rules

- Use shadcn chart primitives when available: `ChartContainer`, `ChartConfig`, `ChartTooltipContent`
- Pipe finance formatting (`formatChartValue`, currency) through config
- `ResponsiveContainer` with `debounce={50}` inside RGL
- Responsive sizing: 1–2 cols → full width, no overflow; tooltips must remain usable

---

## 5. Layout Validation

On prefs load, validate persisted layout:

- Remove items whose `i` no longer exists in widget set
- Clamp `x` within `[0, cols - w]`, `w` within `[1, cols]`, `y >= 0`
- If collisions detected, fall back to `computeLayout` with defaults
- Hero widget ID: clear if not in current widget set

---

## 6. Accessibility Checklist

- **Landmarks:** Wrap sections in `<section aria-labelledby="...">` with matching `id` on heading
- **Headings:** Page title `h1`, major sections `h2`, subsections `h3`
- **Controls:** Every control has `aria-label` or `Label` + `id`
- **Groups:** Use `fieldset`/`legend` for related controls where it improves screen reader navigation
- **Focus:** Keyboard focus visible on feature cards; `focus-within:ring-2`
- **Reduced motion:** Respect `prefersReducedMotion` for animations

---

## 7. Reuse Checklist for Other Domains

To implement HRM, CRM, or another module using this pattern:

1. Create `DomainDashboardConfig` in `domain-configs.ts`
2. Add route page that renders `<DomainDashboardShell config={YOUR_CONFIG} />`
3. Register in `DOMAIN_DASHBOARD_CONFIGS` map
4. Provide `navGroups` filtered for the domain
5. Define `defaultKpiIds`, `chartSlotIds`, `diagramSlotIds` as needed
6. Add domain-specific sections (Attention, Activity, etc.) below the shell if required
7. Ensure each section uses `<section aria-labelledby="...">` and `EmptyState` for empty state

---

## 8. Benchmark Acceptance Checklist

- [x] `KpiCard` has explicit `variant` and uses `cva`
- [x] Hero can only be set/removed via explicit user action
- [x] Layout loads safely even when widget set/cols change
- [x] Charts use shadcn chart primitives
- [x] Dashboard usable on narrow viewports (filters in Popover)
- [x] All major sections are semantic + have headings + empty states
- [x] Benchmark doc exists and another domain can adopt the pattern
