/**
 * @afenda/eslint-config — Shared ESLint flat config for the AFENDA-NEXUS monorepo.
 *
 * Enforces module boundary rules from PROJECT.md §2/§7.
 */
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  {
    ignores: ['dist/**', '.next/**', '*.config.*', 'node_modules/**'],
  },
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tseslint.parser,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': ['error', 'always'],
      'prefer-template': 'error',
      'prefer-arrow-callback': 'error',
    },
  },
  // React-specific rules for .tsx files
  {
    files: ['**/*.tsx'],
    plugins: {
      react,
      'react-hooks': reactHooks,
    },
    rules: {
      'react/jsx-key': ['error', {
        checkFragmentShorthand: true,
        checkKeyMustBeforeSpread: true,
        warnOnDuplicates: true,
      }],
      'react/no-array-index-key': 'error',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  // CIG-04: Module boundary — route/handler files must not import DB or ORM directly.
  // DB access goes through composition roots (e.g. createFinanceRuntime).
  {
    files: [
      '**/routes/**/*.ts',
      '**/route.ts',
      '**/route.tsx',
      '**/app/api/**/*.ts',
      '**/app/api/**/*.tsx',
      '**/page.ts',
      '**/page.tsx',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@afenda/db', '@afenda/db/*', 'drizzle-orm', 'drizzle-orm/*', 'drizzle-kit'],
              message:
                'Routes/handlers must not import DB or ORM directly. Use the app-layer composition root.',
            },
          ],
        },
      ],
    },
  },
];
