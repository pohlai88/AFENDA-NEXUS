import baseConfig from "@afenda/eslint-config";

export default [
  { ignores: ["dist/**", ".next/**", "*.config.*"] },
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
