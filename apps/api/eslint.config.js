import baseConfig from '@afenda/eslint-config';

export default [
  { ignores: ['dist/**', '**/*.test.*', '**/*.spec.*'] },
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
