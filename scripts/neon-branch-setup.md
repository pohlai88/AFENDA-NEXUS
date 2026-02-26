# Neon Branch Setup (CI / Preview)

Minimal automation for Neon database branches per
[NEON-DRIZZLE-BEST-PRACTICES.md](../packages/db/docs/NEON-DRIZZLE-BEST-PRACTICES.md)
§10.

## Quick setup

```bash
npx neonctl@latest init
```

Configures Neon MCP, API key, and agent skills. Use for one-time project setup.

## Branch lifecycle

| Branch         | Lifecycle | Use         |
| -------------- | --------- | ----------- |
| `production`   | Permanent | Live        |
| `preview/pr-N` | 1 day     | PR preview  |
| `ci/run-id`    | 1 hour    | CI tests    |
| `dev/user`     | Manual    | Feature dev |

## Create branch (CLI)

```bash
# Create preview branch for PR
neonctl branches create --name "preview/pr-123" --parent main

# Create CI branch
neonctl branches create --name "ci/run-$(uuidgen)" --parent main
```

## CI integration

Set `DATABASE_URL` and `DATABASE_URL_DIRECT` from the branch's connection
strings:

```bash
# After creating branch, get connection strings
BRANCH_URL=$(neonctl connection-string main --database neondb)
export DATABASE_URL="$BRANCH_URL"
export DATABASE_URL_DIRECT="${BRANCH_URL/-pooler/}"  # Remove -pooler for direct
```

## GitHub Actions example

```yaml
- name: Create Neon branch
  run: |
    neonctl branches create --name "ci/${{ github.run_id }}" --parent main
    # Export DATABASE_URL from branch
```

See [Neon branching](https://neon.com/docs/introduction/branching) and
[Neon CLI](https://neon.com/docs/reference/neon-cli).
