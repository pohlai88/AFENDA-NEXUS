# Formatter Configuration

## VS Code Setup

### Default Formatters Configured
- **YAML files (`.yaml`, `.yml`)**: Prettier with format-on-save
- **Markdown files (`.md`, `.markdown`)**: Prettier with format-on-save and word-wrap
- **All other files**: Prettier as default formatter

### Files Created
- `.vscode/settings.json` - VS Code formatter settings
- `.vscode/extensions.json` - Recommended extensions
- `.prettierrc.json` - Prettier configuration
- `.prettierignore` - Files to exclude from formatting

### Prettier Configuration
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "overrides": [
    {
      "files": "*.md",
      "options": {
        "printWidth": 80,
        "proseWrap": "always"
      }
    },
    {
      "files": "*.{yaml,yml}",
      "options": {
        "printWidth": 100,
        "tabWidth": 2
      }
    }
  ]
}
```

### Scripts Added
- `pnpm format` - Format all files
- `pnpm format:check` - Check formatting without changes
- `pnpm format:yaml` - Format only YAML files
- `pnpm format:md` - Format only Markdown files

### Usage
1. Install VS Code extension: `esbenp.prettier-vscode`
2. Files will auto-format on save
3. Run `pnpm format` to format all files manually
4. Run `pnpm format:check` in CI to verify formatting

### Notes
- YAML files use 2-space indentation with 100 character line width
- Markdown files use 80 character line width with prose wrapping
- Excludes: node_modules, build outputs, generated files, migrations, git files
