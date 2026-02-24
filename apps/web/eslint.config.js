import baseConfig from "@afenda/eslint-config";

export default [
  { ignores: ["dist/**", ".next/**", "*.config.*", "src/__tests__/**"] },
  ...baseConfig,
  {
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
];
