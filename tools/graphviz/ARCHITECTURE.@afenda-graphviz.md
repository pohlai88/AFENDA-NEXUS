---
package: "@afenda/graphviz"
root_dir: "tools/graphviz"
type: tool
layer: tool
composite: false
entrypoints: ["src/dep-graph.mjs"]
public_api: null
exports_map: null
dependency_kinds:
  allowed_runtime: []
  allowed_dev: []
  allowed_peer: []
enforced_structure:
  required_files: ["package.json", "src/dep-graph.mjs"]
  required_directories: ["src"]
boundary_rules:
  allowed_import_prefixes: ["node:"]
  forbidden_imports: []
  allow_imports_by_path: {}
  forbid_cross_layer_imports: []
---

# @afenda/graphviz

Dependency graph visualisation and lineage analysis tool for the @afenda monorepo.

## Purpose

Generates Graphviz DOT dependency graphs and performs static analysis to detect:

- **Orphan packages** — no inbound or outbound runtime dependencies
- **Standalone libraries** — libraries that nothing depends on
- **Phantom dependencies** — declared deps that don't exist in the manifest
- **Circular dependency chains** — DFS-based cycle detection
- **Layer violations** — lower-layer packages importing higher-layer packages
- **Unreachable packages** — libraries not reachable from any app via dependency walk
- **Broken file-level imports** — cross-package imports that aren't declared in `package.json`
- **Regression detection** — compare against a baseline JSON report to catch new issues

## Usage

```bash
# Basic graph with orphan + lineage analysis
pnpm graph

# Full analysis with SVG rendering + JSON report + import scan
pnpm graph:full

# Focus on a single package (shows deps + reverse dependents)
pnpm graph:pkg @afenda/finance

# File-level import scanning
pnpm graph:imports

# SVG rendering (requires graphviz installed)
pnpm graph:svg

# JSON report for CI integration
pnpm graph:json

# Regression check against a previous report
node tools/graphviz/src/dep-graph.mjs --diff tools/graphviz/output/dep-graph.json --fail
```

## Output

All output goes to `tools/graphviz/output/` (git-ignored):

| File | Description |
|------|-------------|
| `dep-graph.dot` | Graphviz DOT source |
| `dep-graph.svg` | Rendered SVG (with `--render`) |
| `dep-graph.png` | Rendered PNG (with `--render`) |
| `dep-graph.json` | Structured JSON report (with `--json`) |

## CLI Flags

| Flag | Description |
|------|-------------|
| `--orphans` | Detect orphan/standalone packages |
| `--lineage` | Detect phantom deps, cycles, layer violations, unreachable nodes |
| `--imports` | Scan file-level cross-package imports for undeclared deps |
| `--render` | Render DOT to SVG/PNG via `dot` CLI |
| `--json` | Emit structured JSON report |
| `--diff <file>` | Compare against a baseline JSON report (regression check) |
| `--pkg <name>` | Focus on a single package and its full neighbourhood (deps + dependents) |
| `--full` | Enable all analyses + rendering + JSON |
| `--fail` | Exit 1 if any issues found (for CI) |
| `--help`, `-h` | Show CLI help |

## Graph Conventions

- **Shapes**: Apps = house, Libraries = box, Modules = component, Config = note, Tools = hexagon
- **Colours**: Blue = app, Green = library, Purple = module, Grey = config, Yellow = tool
- **Problem highlights**: Red = orphan/cycle, Orange = phantom/unreachable
- **Edges**: Solid = runtime dep, Dashed = dev dep, Bold red = cycle/violation
- **Layers**: Grouped by `layer` from the manifest (top → bottom = app → domain-primitives)

## Instability Metric (JSON output)

The JSON report includes Robert C. Martin's instability metric for each package:

$$I = \frac{C_e}{C_e + C_a}$$

Where $C_e$ = fan-out (outgoing deps) and $C_a$ = fan-in (incoming dependents).

- $I = 0$ → maximally stable (many dependents, few deps)
- $I = 1$ → maximally unstable (many deps, few dependents)

## Installing Graphviz

Graphviz is required only for SVG/PNG rendering. The DOT file and analysis work without it.

```bash
# Windows
winget install Graphviz
# or: choco install graphviz

# macOS
brew install graphviz

# Ubuntu/Debian
sudo apt install graphviz
```

## Zero Dependencies

This tool uses only Node.js built-ins — no npm packages required.
