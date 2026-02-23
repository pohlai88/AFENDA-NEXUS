---
description: Add a new AI agent skill to .agents/skills with proper registry integration
---

# Add a New Skill

This workflow adds a new skill to the `.agents` directory with proper registry integration.

## Steps

1. Create the skill directory and SKILL.md:
   - Copy `.agents/skills/SKILL-TEMPLATE.md` to `.agents/skills/<skill-name>/SKILL.md`
   - Fill in the frontmatter: `name`, `description`, `category`, `priority`
   - Write the skill content

2. Add the skill to `.agents/skills-registry.json`:
   - Add an entry to the `skills` array with: `name`, `category`, `priority`, `description`, `path`, `source`
   - Valid categories: `nextjs`, `monorepo`, `database`, `validation`, `ui`, `tools`, `security`
   - Valid priorities: `high`, `medium`, `low`

3. Regenerate the auto-generated docs:
// turbo
```bash
node .agents/tools/agents-gen.mjs
```

4. Validate everything is consistent:
// turbo
```bash
node .agents/tools/agents-drift.mjs
```
