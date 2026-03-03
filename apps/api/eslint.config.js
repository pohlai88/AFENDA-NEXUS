import baseConfig from '@afenda/eslint-config';

export default [
  { ignores: ['dist/**', '*.config.*', '**/*.test.*', '**/*.spec.*', '**/__tests__/**'] },
  ...baseConfig,
  {
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
];
