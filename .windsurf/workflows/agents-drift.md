---
description: Run drift guard to validate .agents and monorepo structure against PROJECT.md
---

# Agents Drift Guard

This workflow validates that the `.agents` directory and monorepo structure match what PROJECT.md declares.

## Steps

1. Run the full drift check:
// turbo
```bash
node .agents/tools/agents-drift.mjs
```

2. Review the report:
   - **FAILURES** must be fixed before merging
   - **WARNINGS** are advisory (features not yet built)

3. To check a specific PROJECT.md section only:
```bash
node .agents/tools/agents-drift.mjs --section 12
```

Available sections: 1 (Tech Stack), 2 (Conventions), 3 (Deployment Units), 12 (Monorepo Structure), 13 (Automation Commands), 14 (Health Endpoints), 17 (Skills Alignment), 99 (.agents Internal)

4. To auto-fix what can be fixed (regenerate docs):
```bash
node .agents/tools/agents-drift.mjs --fix
```
