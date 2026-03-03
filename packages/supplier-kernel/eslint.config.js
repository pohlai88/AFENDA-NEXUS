import baseConfig from '@afenda/eslint-config';

export default [
  {
    ignores: ['dist/**', '*.config.*', '**/*.test.*', '**/*.spec.*', '**/__tests__/**'],
  },
  ...baseConfig,
  {
    languageOptions: {
      parserOptions: {
        project: './tsconfig.eslint.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  // ESLINT-PORTAL-03: Kernel cannot import from AP module or other domain modules
  {
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@afenda/modules/*', '@afenda/modules/finance', '@afenda/modules/finance/*'],
              message:
                'SP-IMPORT-01: Kernel must not import from module packages. Use ports/contracts only.',
            },
            {
              group: ['@afenda/db', '@afenda/db/*'],
              message:
                'SP-IMPORT-02: Kernel must not import from @afenda/db directly. Define ports in kernel, implement adapters in modules.',
            },
          ],
        },
      ],
    },
  },
];
