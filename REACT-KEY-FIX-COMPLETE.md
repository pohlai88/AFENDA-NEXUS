# React Key Error Resolution Complete

**Date**: 2026-03-01  
**Status**: ✅ Fixed + ESLint + CI Gate Added

## Issue Resolved

**Error**: `Each child in a list should have a unique "key" prop`  
**Location**: `BentoKpiDeck` ← `KpiDeckLoader` ← `FinanceDashboardPage`

### Root Cause

Arrays created with `.push()` mutations (anti-pattern RBP-03):
```typescript
// Before (mutating)
const chartSlots = [];
if (selectedChartId && chartData) chartSlots.push({ id, data });
```

### Fix Applied

Replaced with immutable array construction:
```typescript
// After (immutable)
const chartSlots = selectedChartId && chartData 
  ? [{ id: selectedChartId, data: chartData }] 
  : [];
```

**File**: `apps/web/src/lib/dashboards/domain-dashboard-shell.tsx:167-170`

---

## ESLint Configuration

### Added React Plugins

```bash
pnpm --filter @afenda/eslint-config add -D eslint-plugin-react eslint-plugin-react-hooks
```

### Rules Configured

```javascript
// packages/eslint-config/index.js
{
  files: ['**/*.tsx'],
  rules: {
    'react/jsx-key': ['error', {
      checkFragmentShorthand: true,
      checkKeyMustBeforeSpread: true,
      warnOnDuplicates: true,
    }],
    'react/no-array-index-key': 'error',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
  }
}
```

**Catches**:
- Missing `key` props on JSX in `.map()`
- Array indices used as keys
- React Hooks violations

---

## CI Gate Added

**Gate**: `gate:react-keys` (REACT-KEY-01–02)

```bash
node tools/scripts/gate-react-keys.mjs
```

**Detects**:
1. **REACT-KEY-01**: `.map()` without key in JSX
2. **REACT-KEY-02**: Array index as key (`key={i}`)

**Current Status**: ❌ 33 pre-existing violations found

**Added to**: CI workflow (35 gates total, 12 domain gates)

---

## Pre-existing Issues Found

Gate detected **33 violations** of array-index-as-key pattern:

- Loading skeletons: 3 files
- IFRS standards pages: 6 files  
- Feature sections: 8 files
- Dashboard components: 5 files
- Forms & misc: 11 files

**Recommendation**: Fix incrementally or add `eslint-disable` with comment explaining why index is safe.

---

## Enforcement Stack

| Layer | Tool | When | Auto-Fix |
|-------|------|------|----------|
| **Pre-commit** | ESLint | On save / pre-commit | ✅ Yes |
| **Development** | ESLint | Real-time in IDE | ✅ Yes |
| **CI** | `gate:react-keys` | Every PR | ❌ No (fails build) |

---

## Next Steps

1. **Run lint:fix** to auto-fix new violations:
   ```bash
   pnpm lint:fix
   ```

2. **Fix pre-existing** array-index violations:
   ```bash
   # See gate output for file list
   node tools/scripts/gate-react-keys.mjs
   ```

3. **Options for pre-existing**:
   - Replace `key={i}` with `key={item.id}` or `key={crypto.randomUUID()}`
   - Add `eslint-disable-next-line` with justification if safe

---

## Summary

✅ Root cause fixed (immutable arrays)  
✅ ESLint configured with React rules  
✅ CI gate added for early detection  
✅ 35 gates now running in CI  
⚠️ 33 pre-existing violations to fix

**Pre-commit hooks** will now catch these issues automatically.
