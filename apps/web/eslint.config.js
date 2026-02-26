import baseConfig from '@afenda/eslint-config';
import jsxA11y from 'eslint-plugin-jsx-a11y';

export default [
  { ignores: ['dist/**', '.next/**', '*.config.*', 'src/__tests__/**'] },
  ...baseConfig,
  jsxA11y.flatConfigs.recommended,
  {
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // autoFocus is intentional UX in dialogs, OTP inputs, and onboarding forms
      'jsx-a11y/no-autofocus': ['error', { ignoreNonDOM: true }],
    },
  },
];
