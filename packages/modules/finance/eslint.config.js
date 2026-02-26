import baseConfig from '@afenda/eslint-config';

export default [
  { ignores: ['dist/**', '*.config.*'] },
  ...baseConfig,
  // CIG-04: Test files MUST be inside __tests__ directories.
  // Files matching *.test.ts outside __tests__ are banned.
  {
    files: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
    ignores: ['src/**/__tests__/**'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Program',
          message:
            'CIG-04: Test files MUST be inside a __tests__/ directory. Move this file into the nearest __tests__/ folder.',
        },
      ],
    },
  },
  {
    languageOptions: {
      parserOptions: {
        project: './tsconfig.eslint.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // @see CIG-02 — FX precision CI gate: ban native float arithmetic on monetary/rate values
      // All FX conversion MUST use BigInt fixed-point (convertAmountPrecise) or Decimal.js
      'no-restricted-syntax': [
        'error',
        {
          selector: "BinaryExpression[operator='*'] > CallExpression[callee.name='Number']",
          message:
            'CIG-02: Do not use Number() in multiplication — use BigInt fixed-point (convertAmountPrecise) for FX conversion to avoid penny rounding errors.',
        },
        {
          selector: "BinaryExpression[operator='*'] > CallExpression[callee.name='parseFloat']",
          message:
            'CIG-02: Do not use parseFloat() in multiplication — use BigInt fixed-point (convertAmountPrecise) for FX conversion.',
        },
        {
          selector:
            "CallExpression[callee.object.name='Math'][callee.property.name='round'] > BinaryExpression[operator='*']",
          message:
            'CIG-02: Do not use Math.round(x * rate) — use BigInt fixed-point (convertAmountPrecise) for FX conversion.',
        },
        {
          selector:
            "TSAsExpression[typeAnnotation.type='TSTypeReference'][typeAnnotation.typeName.name='Record'] > MemberExpression[object.property.name='query']",
          message:
            'CIG-03: Do not cast req.query as Record<string, string> — use a Zod schema .parse() for type-safe input validation.',
        },
        {
          selector:
            "TSAsExpression[typeAnnotation.type='TSTypeLiteral'] > MemberExpression[object.property.name='query']",
          message:
            'CIG-03: Do not cast req.query with inline type — use a Zod schema .parse() for type-safe input validation.',
        },
        {
          selector:
            "TSAsExpression[typeAnnotation.type='TSTypeLiteral'] > MemberExpression[object.property.name='params']",
          message:
            'CIG-03: Do not cast req.params with inline type — use IdParamSchema.parse() or a Zod schema for type-safe input validation.',
        },
      ],
    },
  },
];
