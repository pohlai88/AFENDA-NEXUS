/**
 * @afenda/eslint-config — Shared ESLint flat config for the AFENDA-NEXUS monorepo.
 *
 * Enforces module boundary rules from PROJECT.md §2/§7.
 */
import tseslint from "typescript-eslint";

export default [
  {
    ignores: ["dist/**", ".next/**", "*.config.*", "node_modules/**"],
  },
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tseslint.parser,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },
  // CIG-04: Module boundary — route/handler files must not import DB or ORM directly.
  // DB access goes through composition roots (e.g. createFinanceRuntime).
  {
    files: [
      "**/routes/**/*.ts",
      "**/route.ts",
      "**/route.tsx",
      "**/app/api/**/*.ts",
      "**/app/api/**/*.tsx",
      "**/page.ts",
      "**/page.tsx",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@afenda/db", "@afenda/db/*", "drizzle-orm", "drizzle-orm/*", "drizzle-kit"],
              message:
                "Routes/handlers must not import DB or ORM directly. Use the app-layer composition root.",
            },
          ],
        },
      ],
    },
  },
];
