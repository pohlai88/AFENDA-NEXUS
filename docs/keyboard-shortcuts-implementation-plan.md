# Keyboard Shortcuts — Implementation Plan

Implementation plan for the [keyboard-shortcuts-benchmark-and-proposal.md](./keyboard-shortcuts-benchmark-and-proposal.md).

---

## Status Overview

| Phase | Scope | Status | Notes |
|-------|-------|--------|------|
| **Phase 1** | Go To: g i, g v, g r, g h | ✅ Done | In `SHELL_SHORTCUTS` |
| **Phase 2** | Create: c j, c i, c b, c x, c a | ✅ Done | In `SHELL_SHORTCUTS` |
| **Phase 3** | User preference persistence | ✅ Done | shortcutOverrides in cookie, Settings UI |
| **Phase 4** | Date field shortcuts | ✅ Done | t, y, m in date inputs |
| **Phase 5** | Table shortcuts | ✅ Done | mod+A in DataTable (F8 deferred) |
| **Phase 6** | Module-level actions | ✅ Done | n, useFormShortcut (mod+S, mod+Enter) |

---

## Phase 3: User Preference Persistence for Custom Shortcuts

### Goal
Allow users to remap shortcuts (g *, c *, mod+K, ?, mod+B) via Settings. Store overrides in shell preferences (cookie/localStorage).

### Tasks

1. **Extend shell preferences schema**
   - Add `shortcutOverrides: Record<string, string>` to `ShellPreferences`
   - Key = shortcut id (e.g. `nav-journals`), value = new keys (e.g. `g j` → `shift+j`)
   - File: `apps/web/src/lib/shell/shell-preferences.types.ts`

2. **Shortcut resolution layer**
   - Create `resolveShortcutKeys(id: string, defaultKeys: string): string`
   - Reads from `shortcutOverrides`; falls back to default
   - File: `apps/web/src/lib/shortcuts/resolve-shortcut.ts` (new)

3. **Settings UI**
   - Add "Keyboard Shortcuts" section in Settings
   - List shortcuts with Edit button → modal to capture new key combo
   - Persist via `ShellPreferencesProvider` / cookie
   - File: `apps/web/src/app/(shell)/settings/...` or `apps/web/src/features/settings/...`

4. **Wire resolution into shell**
   - `useAfendaNavigationShortcuts` and `QuickActionShortcuts` use resolved keys
   - Re-register when preferences change

### Dependencies
- Shell preferences cookie already exists (`buildShellCookieKey`)
- Need to add `shortcutOverrides` to `parseShellCookie` / `serializeShellCookie`

### Effort
~2–3 days

---

## Phase 4: Date Field Shortcuts (t, y, m)

### Goal
When focus is in a date input, pressing `t`, `y`, or `m` fills Today, Yesterday, or Month-end.

### Tasks

1. **Date shortcut hook**
   - Create `useDateFieldShortcuts(ref: RefObject<HTMLInputElement>)`
   - Listens for `t`, `y`, `m` only when ref has focus
   - Fills value and prevents default
   - File: `apps/web/src/hooks/use-date-field-shortcuts.ts` (new)

2. **Date input wrapper**
   - Create `DateInputWithShortcuts` or enhance existing date picker
   - Integrates `useDateFieldShortcuts`
   - File: `apps/web/src/components/ui/date-picker.tsx` or new wrapper

3. **WCAG 2.1.4**
   - Single-char shortcuts only when date field has focus ✅
   - Or: require modifier (e.g. `mod+t`) — less ergonomic

### Scope
- Apply to all date inputs (journal date, invoice date, expense date, etc.)
- May need to identify date fields by `type="date"` or `data-type="date"`

### Effort
~1 day

---

## Phase 5: Table Shortcuts (F8, mod+A)

### Goal
In data tables (e.g. journal lines, AP/AR lists), support:
- **mod+A** — Select all rows
- **F8** — Copy value from row above into current cell (Dynamics pattern)

### Tasks

1. **Table scope**
   - Push `table` scope when a table cell has focus
   - `useShortcutScope('table')` in table wrapper
   - File: Table component (e.g. `DataTable`, journal lines grid)

2. **mod+A — Select all**
   - Register `mod+a` with scope `table`
   - Handler: select all rows (call table's selection API)
   - Must not fire when focus is in an input (e.g. filter)

3. **F8 — Copy row above**
   - Register `F8` with scope `table`
   - Handler: copy value from previous row's same column into current cell
   - Only when a cell is focused (not header)

4. **F9 — Refresh**
   - Optional: refresh table data (SAP pattern)

### Dependencies
- Table components must expose selection and cell-focus APIs
- May need `DataTable` refactor for keyboard-driven editing

### Effort
~2–3 days

---

## Phase 6: Module-Level Actions (n, mod+S, mod+Enter)

### Goal
- **n** — New (contextual: new journal on journals page, new invoice on AR page)
- **mod+S** — Save current form
- **mod+Enter** — Save and close

### Tasks

1. **Contextual `n`**
   - Register `n` with scope `page`
   - Handler depends on current route: `/finance/journals` → `router.push(journalNew)`, etc.
   - Use route-to-action map
   - File: `apps/web/src/lib/shortcuts/page-context-actions.ts` (new)

2. **mod+S — Save**
   - Register `mod+s` with scope `page` or `dialog`
   - Handler: trigger form submit (need to wire to form context)
   - Challenge: forms are in various components; need a `useFormSubmit` or similar

3. **mod+Enter — Save and close**
   - Similar to mod+S but also navigates back or closes dialog
   - Depends on form/dialog structure

### Dependencies
- Form components must expose submit action (e.g. via ref or context)
- May require `FormShortcutProvider` that wraps forms and registers handlers

### Effort
~2–3 days

---

## Implementation Order

| Order | Phase | Rationale |
|-------|-------|-----------|
| 1 | Phase 4 (Date shortcuts) | Small scope, high value, no schema changes |
| 2 | Phase 5 (Table shortcuts) | Improves data-entry UX; table scope already in engine |
| 3 | Phase 6 (Module-level) | Requires form/context design decisions |
| 4 | Phase 3 (Customization) | Depends on stable shortcut set; UX polish |

---

## Files to Create/Modify

### New Files
- `apps/web/src/lib/shortcuts/resolve-shortcut.ts` — shortcut override resolution ✅
- `apps/web/src/hooks/use-date-field-shortcuts.ts` — date field t/y/m ✅
- `apps/web/src/lib/shortcuts/page-context-actions.ts` — contextual `n` handler ✅
- `apps/web/src/hooks/use-form-shortcut.ts` — mod+S / mod+Enter for forms ✅

### Modified Files
- `apps/web/src/lib/shell/shell-preferences.types.ts` — add `shortcutOverrides` ✅
- `apps/web/src/lib/shell/shell-persistence.ts` — serialize/parse overrides ✅
- `apps/web/src/components/afenda/afenda-app-shell.tsx` — use resolved shortcuts ✅
- `apps/web/src/components/ui/date-picker.tsx` (or equivalent) — date shortcuts
- Table components — F8, mod+A, scope push
- Settings — shortcut customization UI ✅ (`ShortcutPreferencesCard` in preferences page)

---

## Evaluation & Refinements (Post-Implementation)

### Bugs Fixed
- **ShortcutPreferencesCard**: Escape now closes dialog without capturing; Enter saves and closes
- **Modifier-only capture**: Rejected (e.g. "shift" alone); `isValidShortcutKeys()` requires at least one non-modifier key
- **Dialog focus**: `onOpenAutoFocus` on DialogContent for reliable input focus (replaces flaky `setTimeout`)
- **Conflict detection**: Blocks save when new keys are already used by another shortcut
- **DataTable**: `handleSelectAll` wrapped in `useCallback` for stable reference

### Edge Cases Handled
- Empty or modifier-only key combos show validation error
- Reset to default clears capture error
- Conflict message: "Already used by X. Change that shortcut first."

---

## Remaining Work

| Item | Priority | Notes |
|------|----------|-------|
| **F8 (copy row above)** | ✅ Done | JournalLinesEditor: copy row above into current row |
| **mod+B override** | ✅ Done | SidebarShortcutRegister + keyboardShortcut="external" |
| **Quick Action overrides** | ✅ Done | quick-action-picker, quick-action-1…9 in Settings |
| **useFormShortcut adoption** | ✅ Done | Journal + Account forms |
| **Date picker integration** | Done | `useDateFieldShortcuts` uses document listener; works for `type="date"` and `data-type="date"` |
| **Testing checklist** | Medium | Manual QA; unit tests for resolveShortcutKeys, eventToKeyString, isValidShortcutKeys ✅ |

---

## Best Practices & Resolution Guide

### 1. useFormShortcut Adoption (Medium priority)

**Best practice:**
- Add `useFormShortcut` to forms that have a primary submit action (create/edit).
- Use `scope: 'dialog'` when the form is inside a Dialog/Sheet; `scope: 'page'` for full-page forms.
- Ensure `onSave` triggers validation: `form.handleSubmit(onValid)()` — not raw submit.
- For `onSaveAndClose`, chain: validate → submit → on success → `router.back()` or `onOpenChange(false)`.

**Resolution approach:**
1. Identify high-traffic forms: journal entry, invoice, bill, expense claim, account.
2. Add `useFormShortcut` in each form component, after `useForm` and before render.
3. Use a stable `onSave` callback; avoid inline functions that change every render.
4. Test that mod+S does not conflict with browser Save (engine already prevents default when matched).

**Example pattern:**
```tsx
const form = useForm({ ... });
const onSubmit = useCallback(async (data) => { ... }, []);
useFormShortcut({
  onSave: () => form.handleSubmit(onSubmit)(),
  onSaveAndClose: () => form.handleSubmit((data) => onSubmit(data).then(() => router.back()))(),
  scope: isDialog ? 'dialog' : 'page',
});
```

---

### 2. mod+B Override (Low priority)

**Best practice:**
- Centralise keyboard handling in the shortcut engine for consistency and customisation.
- Avoid raw `window.addEventListener('keydown')` for user-customisable actions.

**Resolution approach:**
1. Move sidebar toggle from `sidebar.tsx` raw listener into the shortcut engine.
2. Register `mod+b` (or resolved key) in a component inside `SidebarProvider` that calls `useSidebar().toggleSidebar()`.
3. Add `afenda-sidebar` to `CUSTOMIZABLE_SHORTCUTS` in `ShortcutPreferencesCard`.
4. Remove the raw keydown listener from `SidebarProvider` (or make it conditional if engine is unavailable).

**Dependency:** Requires `SidebarProvider` to wrap the component that registers the shortcut, so the registration must happen in a child of `SidebarProvider` (e.g. `AfendaSidebar` or a dedicated `SidebarShortcutRegister`).

---

### 3. Quick Action Overrides (Low priority)

**Best practice:**
- Keep Quick Actions (Ctrl+Q, Ctrl+1…9) consistent; customisation adds complexity.
- If customised, use a separate override namespace (e.g. `quick-action-picker`, `quick-action-1`…`quick-action-9`).

**Resolution approach:**
1. Add `quick-action-picker` and `quick-action-1`…`quick-action-9` to `CUSTOMIZABLE_SHORTCUTS`.
2. Update `QuickActionShortcuts` to use `resolveShortcutKeys` with `prefs.shortcutOverrides`.
3. Dynamic slots (1–9) map to `ctrl+${slot}`; override would replace e.g. `ctrl+1` with `shift+1`.
4. Consider UX: remapping Ctrl+1 may confuse users who expect numbered slots. Document in the UI.

---

### 4. F8 Copy Row Above (Low priority)

**Best practice:**
- Implement only where there are editable cells (e.g. journal lines, invoice lines).
- Use a table/cell focus model: track focused cell (row, col) and copy from `row - 1, same col`.

**Resolution approach:**
1. Identify editable grids: journal lines editor, possibly invoice/bill line items.
2. Add `onKeyDown` handler for F8 when a cell is focused.
3. Handler: get current cell → get previous row’s same column → copy value into current cell.
4. Requires controlled cell focus (e.g. `data-focused-cell` or refs). Not applicable to read-only `DataTable`.

**Defer if:** No editable grid exists yet. Implement when journal lines or similar gets an inline editor.

---

### Enabling F8 (Copy Row Above) — Editable Grid Identification

**Current state:**
- **DataTable** — Read-only list. Renders cells via `accessorFn`; no editable cells. mod+A (select all) is implemented. F8 does not apply.
- **JournalLinesEditor** — Editable grid. Uses `useFieldArray` + Table + Input per cell. Has editable cells (accountCode, description, debit, credit). **This is where F8 belongs.**

**What’s needed to add F8 to JournalLinesEditor:**

| Requirement | Status | Notes |
|-------------|--------|-------|
| Editable cells | ✅ | Inputs in each cell; form.register binds to `lines.${index}.field` |
| Focus tracking | ✅ | `getFocusedRowIndex()` from `document.activeElement` + `data-row-index` |
| F8 handler | ✅ | `onKeyDown` on grid; `form.setValue` copies previous row |
| Scope | ✅ | Push/pop `table` scope on focusin/focusout |

**Implementation approach (minimal):**

1. **Focus tracking** — Use `onFocus` on the table container or each row; store `focusedRowIndex` in state. Or derive from `document.activeElement`: if it’s an input with `name="lines.N.accountCode"`, parse N.
2. **F8 handler** — Add `onKeyDown` on the table wrapper. When `e.key === 'F8'` and `focusedRowIndex > 0`:
   - Get `prevLine = lines[focusedRowIndex - 1]`
   - Call `form.setValue(\`lines.${focusedRowIndex}\`, { ...prevLine })` (or copy field-by-field)
3. **Scope** — Wrap the grid in a div with `tabIndex={0}` and `onFocus`/`onBlur` to push/pop `table` scope (or use a small `useEditableGridShortcuts` hook).

**Alternative: copy current cell only**

- Track `focusedRowIndex` and `focusedColKey` (e.g. `accountCode`, `debit`).
- On F8: copy `lines[focusedRowIndex-1][focusedColKey]` into `lines[focusedRowIndex][focusedColKey]`.
- Requires mapping DOM focus to column key.

**Recommended:** Start with “copy entire row above” — simpler, matches common ERP behavior. Add to `JournalLinesEditor` only; no DataTable changes.

---

### 5. Testing (Medium priority)

**Best practice:**
- Manual QA for happy paths; E2E for critical flows.
- Use Playwright or Cypress for shortcut tests; `page.keyboard.press('g')` then `page.keyboard.press('j')` for sequences.

**Resolution approach:**
1. **Manual checklist:** Run through the Testing Checklist in this doc; tick off each item.
2. **E2E (optional):** Add tests for: `?` opens shortcut dialog, `mod+k` opens command palette, `g j` navigates to journals.
3. **Unit tests:** `resolveShortcutKeys`, `eventToKeyString`, `isValidShortcutKeys` are pure; easy to unit test.

**Suggested order:** Manual QA first → unit tests for pure helpers → E2E for 2–3 critical shortcuts.

---

### 6. Sequence Capture (Deferred)

**Limitation:** The shortcut preferences UI only captures single key combos (e.g. `mod+k`). Multi-key sequences like `g j` cannot be recorded because each keydown overwrites the previous.

**Best practice (if implemented later):**
- Use a two-phase capture: first key → show "Press second key…" → second key → done.
- Or: allow typing/pasting the sequence string (e.g. `g j`) with validation against the engine format.

**Resolution:** Low priority; users can override sequences to modifier combos, but not the reverse. Document in the UI: "Modifier combos only (e.g. Ctrl+K). Sequences like g j cannot be set here."

---

### Recommended Implementation Order

| Order | Item | Effort | Rationale |
|-------|------|--------|-----------|
| 1 | useFormShortcut adoption | 1–2 days | High value; low risk; incremental (form by form) |
| 2 | mod+B override | 0.5 day | Completes customization parity; small change |
| 3 | Testing (manual + unit) | 0.5–1 day | Validates current work before adding more |
| 4 | Quick Action overrides | 0.5 day | Optional; only if users request it |
| 5 | F8 copy row above | 1–2 days | Defer until editable grid exists |

---

## Testing Checklist

- [ ] All g * and c * shortcuts work from any page
- [ ] Quick Actions (Ctrl+Q, Ctrl+1…9) work
- [ ] Date shortcuts (t, y, m) work in date fields only
- [ ] Table shortcuts (F8, mod+A) work only when table focused
- [ ] mod+S / mod+Enter do not conflict with browser (e.g. Cmd+S save page)
- [ ] Custom overrides persist across sessions
- [ ] Shortcut dialog shows correct keys (including overrides)
- [ ] WCAG 2.1.4: single-char shortcuts are focus-bound or remappable
