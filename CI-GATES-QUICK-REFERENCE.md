# CI Gates Quick Reference

## 🚀 Quick Commands

### Run All Gates
```bash
pnpm ci:gates:parallel              # All 37 gates in parallel
```

### Run by Group
```bash
pnpm ci:gates:parallel:arch         # Architecture (7 gates)
pnpm ci:gates:parallel:compliance   # Compliance (6 gates)
pnpm ci:gates:parallel:module       # Modules (10 gates)
pnpm ci:gates:parallel:domain       # Domain (14 gates)
pnpm ci:gates:parallel:security     # Security (2 gates) ⭐ NEW
```

### Run Individual New Gates
```bash
pnpm gate:a11y                      # Accessibility check
pnpm gate:a11y:fix                  # Auto-fix a11y issues ⭐
pnpm gate:security-headers          # Security validation
pnpm gate:performance-budget        # Bundle size check
pnpm gate:contract-drift-improved   # Enhanced contract check
```

### Auto-fix Commands
```bash
pnpm lint:fix                       # ESLint auto-fixes
pnpm gate:a11y:fix                  # Accessibility auto-fixes
pnpm format                         # Prettier formatting
```

---

## 📋 Gate Checklist (New & Improved)

### ✅ Accessibility (A11Y)
- [ ] All images have alt text
- [ ] Icon-only buttons have aria-label
- [ ] Form inputs have labels
- [ ] Links are descriptive
- [ ] Decorative icons hidden from screen readers

**Fix**: `pnpm gate:a11y:fix`

### ✅ Security (SEC)
- [ ] API routes verify auth
- [ ] Server actions check authorization
- [ ] No exposed env vars in client
- [ ] No sensitive data in logs
- [ ] Parameterized SQL queries
- [ ] Security headers configured

**Check**: `pnpm gate:security-headers`

### ✅ Performance (PERF)
- [ ] Total bundle < 500 KB
- [ ] Route bundles < 250 KB
- [ ] Large libs lazy-loaded
- [ ] Large components code-split
- [ ] No duplicate dependencies

**Check**: `pnpm build && pnpm gate:performance-budget`

### ✅ React Keys (Improved)
- [ ] No array indices as keys (dynamic lists)
- [ ] Stable IDs used for keys
- [ ] Loading/skeleton components OK with indices

**Check**: Included in `pnpm ci:gates:parallel:domain`

### ✅ Contract Drift (Improved)
- [ ] Input schemas use @afenda/contracts
- [ ] Response DTOs not flagged
- [ ] Proper validation applied

**Check**: `pnpm gate:contract-drift-improved`

---

## 🔥 Common Issues & Fixes

### Issue: Accessibility violations
**Fix**:
```bash
pnpm gate:a11y:fix
# Review changes, commit
```

### Issue: React keys using indices
**Fix**: Replace with stable IDs
```tsx
// ❌ Bad
items.map((item, i) => <Card key={i} {...item} />)

// ✅ Good
items.map(item => <Card key={item.id} {...item} />)

// ✅ OK in skeletons
Array.from({ length: 5 }).map((_, i) => <Skeleton key={`skeleton-${i}`} />)
```

### Issue: Bundle too large
**Fix**: Lazy-load components
```tsx
// ❌ Bad
import HeavyChart from './heavy-chart';

// ✅ Good
const HeavyChart = dynamic(() => import('./heavy-chart'), {
  loading: () => <Skeleton />,
  ssr: false
});
```

### Issue: Missing auth check
**Fix**: Add to route handler
```typescript
export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  // ... rest of handler
}
```

---

## 📊 Gate Groups Matrix

| Group | Gates | Purpose | Avg Runtime |
|-------|-------|---------|-------------|
| **arch** | 7 | Architecture & dependencies | ~15s |
| **compliance** | 6 | Audits & conventions | ~20s |
| **module** | 10 | Boundary enforcement | ~25s |
| **domain** | 14 | Business rules & UI | ~30s |
| **security** | 2 | Security & performance | ~10s |

**Total**: 37 gates, ~100s (parallel), ~5 minutes (sequential)

---

## 🎯 Pre-Commit Checklist

Before committing code:
1. ✅ Run `pnpm lint:fix` (auto-fixes ESLint)
2. ✅ Run `pnpm gate:a11y:fix` if UI changes
3. ✅ Run `pnpm format` (format all files)
4. ✅ Run `pnpm ci:gates:fast` (quick gates)

**Tip**: Husky pre-commit hook does steps 1 & 3 automatically!

---

## 📖 When to Run What

### During Development
```bash
pnpm lint:fix              # After writing code
pnpm gate:a11y            # After UI changes
```

### Before Committing
```bash
pnpm ci:gates:fast        # Quick validation
```

### Before PR
```bash
pnpm ci:gates:parallel    # Full gate suite
pnpm build                # Verify build works
pnpm gate:performance-budget  # Check bundle size
```

### In CI/CD
```bash
pnpm ci:gates:parallel    # All gates (GitHub Actions)
```

---

## 💡 Pro Tips

1. **Parallel > Sequential**: Always use `ci:gates:parallel` for speed
2. **Group Filtering**: Use `--group` to test specific areas
3. **Auto-fix First**: Run fix commands before manual fixes
4. **Cache Builds**: Performance gate needs `.next` directory
5. **Incremental**: Fix violations incrementally, not all at once

---

## 🆘 Troubleshooting

### Gate fails but no clear error
```bash
# Run individual gate for detailed output
pnpm gate:<gate-name>
```

### Performance gate skipped
```bash
# Build first
pnpm build
pnpm gate:performance-budget
```

### ESLint auto-fix not working
```bash
# Check for syntax errors first
pnpm typecheck
# Then fix
pnpm lint:fix
```

### False positive in gate
```bash
# Add exemption comment to file:
// @gate-allow-unvalidated: Reason here
```

---

## 📚 Learn More

- Full enhancement details: `CI-GATES-ENHANCEMENT-SUMMARY.md`
- Gate implementations: `tools/scripts/gate-*.mjs`
- ESLint config: `apps/web/eslint.config.js`
- Gate runner: `tools/scripts/run-gates-parallel.mjs`

---

**Last Updated**: 2026-03-02  
**Version**: 2.0 (Enhanced with a11y, security, performance gates)
