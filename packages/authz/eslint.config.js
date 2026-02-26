import baseConfig from '@afenda/eslint-config';

export default [
  { ignores: ['dist/**', '*.config.*'] },
  ...baseConfig,
  {
    languageOptions: {
      parserOptions: {
        project: './tsconfig.eslint.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
];
