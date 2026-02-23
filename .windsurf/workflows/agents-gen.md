---
description: Regenerate .agents INDEX.md and INSTALLED-SKILLS.md from skills-registry.json
---

# Regenerate Agent Docs

This workflow regenerates the auto-generated documentation files from the skills registry.

## Steps

1. Run the generator script:
// turbo
```bash
node .agents/tools/agents-gen.mjs
```

2. Review the output for any validation errors (registry orphans, missing SKILL.md files, etc.)

3. If errors are reported, fix them:
   - **REGISTRY_ORPHAN**: Remove the entry from `.agents/skills-registry.json`
   - **DISK_ORPHAN**: Add the skill to `.agents/skills-registry.json`
   - **MISSING_SKILL_MD**: Create a `SKILL.md` in the skill directory using `.agents/skills/SKILL-TEMPLATE.md`

4. Re-run the generator if fixes were made:
// turbo
```bash
node .agents/tools/agents-gen.mjs
```
