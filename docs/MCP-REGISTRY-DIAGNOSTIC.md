# MCP Registry Diagnostic — NEXUSCANON-AFENDA

**Date:** 2025-03-01  
**Scope:** Validate MCP configuration, diagnose shadcn MCP

---

## 1. Current MCP Configuration

### Config file locations

| File | Purpose | Contents |
|------|---------|----------|
| `.cursor/mcp.json` | **Project-level** (Cursor standard) | `next-devtools`, `shadcn` *(updated)* |
| `.cursor/.mcp.json` | Alternate/user-level | `Neon`, `next-devtools`, `shadcn` |

**Finding:** Two MCP config files exist. Cursor may merge or prefer one. shadcn has been added to `.cursor/mcp.json` so it is available in the project config regardless of which file Cursor loads.

### shadcn MCP config (from `.cursor/.mcp.json`)

```json
"shadcn": {
  "command": "npx",
  "args": ["shadcn@latest", "mcp"]
}
```

This matches the [shadcn MCP docs](https://ui.shadcn.com/docs/mcp) configuration.

---

## 2. components.json Validation

**Location:** `apps/web/components.json`

| Requirement | Status | Notes |
|-------------|--------|-------|
| Schema | ✅ | `$schema: https://ui.shadcn.com/schema.json` |
| Style | ✅ | `new-york` |
| Aliases | ✅ | `@/components`, `@/lib/utils`, etc. |
| `registries` | ⚠️ Optional | Not present; default shadcn registry works without it |

**Note:** The shadcn docs state: *"No configuration is needed to access the standard shadcn/ui registry."* Explicit `registries` is only required for custom/private registries.

---

## 3. Monorepo Consideration

- **components.json** is at `apps/web/components.json`
- **Project root** is `NEXUSCANON-AFENDA/`
- When Cursor launches the MCP, the working directory is typically the **project root**
- The shadcn MCP searches for `components.json` from cwd; it may not find `apps/web/components.json` if cwd is the repo root

**Mitigation:** Add `env` with a path hint if the shadcn MCP supports it, or run the MCP with `cwd` set to `apps/web`. (See Fix section.)

---

## 4. Registry Accessibility

- **Default shadcn registry:** Works without explicit config
- **Registry index:** `https://ui.shadcn.com/r/registries.json` — accessible (807 lines, 33.6 KB)
- **Individual items:** Use format `https://{registry}/r/{name}.json` per registry

---

## 5. Troubleshooting Checklist

If shadcn MCP is not responding:

1. **Enable in Cursor:** Cursor Settings → MCP → enable the shadcn server (green dot)
2. **Config location:** Ensure shadcn is in `.cursor/mcp.json` (project config)
3. **Restart Cursor** after config changes
4. **Logs:** View → Output → select `MCP: project-*` for errors
5. **Cache:** Run `npx clear-npx-cache` if npx is stale
6. **Monorepo:** If installs fail, run `npx shadcn add <component>` from `apps/web/` manually

---

## 6. Recommended Fixes (Applied)

1. **Add shadcn to `.cursor/mcp.json`** — Done. shadcn is now in the project MCP config.
2. **If MCP installs fail in monorepo:** Run `npx shadcn add <component>` manually from `apps/web/`.
3. **Optional:** Add explicit `registries` to `components.json` only if using custom/private registries.
