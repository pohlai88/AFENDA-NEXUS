import baseConfig from '@afenda/eslint-config';
import jsxA11y from 'eslint-plugin-jsx-a11y';

/**
 * React best practices (vercel-react-best-practices skill):
 * - RBP-03: Use .toSorted() not .sort() — gate-react-best-practices.mjs
 * - RBP-04: Use ternary for numeric conditionals — gate-react-best-practices.mjs
 * - RBP-CACHE: Server data fetchers must use React cache() — gate-react-cache.mjs
 * Run: node tools/scripts/gate-react-best-practices.mjs [--strict]
 * Run: node tools/scripts/gate-react-cache.mjs
 * Reference: .agents/skills/vercel-react-best-practices/SKILL.md
 *
 * Hydration: Avoid server/client mismatch. E2E error-monitor fails on hydration errors.
 * Gate: tools/scripts/gate-hydration.mjs. See .agents/skills/next-best-practices/hydration-error.md
 */
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
      // Temporarily disable problematic rule due to minimatch compatibility
      'jsx-a11y/label-has-associated-control': 'off',
      
      // ── Performance & Best Practices (Auto-fixable) ────────────────────────
      
      // RBP-03: Prefer .toSorted() over .sort() — immutable, avoids mutation
      'no-restricted-syntax': [
        'warn',
        {
          selector: "CallExpression[callee.property.name='sort']",
          message:
            'Use .toSorted() instead of .sort() to avoid mutating the array (RBP-03). Auto-fix: Run eslint --fix',
        },
        
        // Hydration risks
        {
          selector: "CallExpression[callee.object.name='Date'][callee.property.name='now']",
          message:
            'Date.now() in render causes hydration mismatch. Use useEffect + useState or suppressHydrationWarning',
        },
        {
          selector: "CallExpression[callee.object.name='Date'][callee.property.name='toLocaleString']",
          message:
            'new Date().toLocaleString() in render causes hydration mismatch. Use client-only or suppressHydrationWarning',
        },
        {
          selector: "CallExpression[callee.object.name='Math'][callee.property.name='random']",
          message:
            'Math.random() in render causes hydration mismatch. Use useId() or generate stable IDs on server',
        },
        
        // RBP-CACHE: Server data fetchers must use React cache()
        {
          selector: "ExportNamedDeclaration[declaration.type='FunctionDeclaration'][declaration.async=true][declaration.id.name=/^(fetch|resolve|build|get)/]",
          message:
            'Server data fetcher should use React cache() for request memoization (RBP-CACHE). Convert to: export const funcName = cache(async (ctx) => { ... })',
        },
        
        // Console.log in production
        {
          selector: "CallExpression[callee.object.name='console'][callee.property.name='log']",
          message:
            'Avoid console.log in production. Use proper logging (pino) or remove',
        },
        
        // Prefer optional chaining
        {
          selector: "LogicalExpression[operator='&&'][left.type='MemberExpression'][right.type='MemberExpression']",
          message:
            'Use optional chaining (?.) instead of && checks. Auto-fixable in many cases',
        },
      ],
      
      // ── Auto-fixable Rules ────────────────────────────────────────────────
      
      // Prefer const over let when variable is never reassigned
      'prefer-const': ['error', { destructuring: 'all' }],
      
      // Require === instead of ==
      'eqeqeq': ['error', 'always', { null: 'ignore' }],
      
      // No unused variables (auto-fixable imports)
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
        },
      ],
      
      // Enforce consistent array/object destructuring
      'prefer-destructuring': [
        'error',
        {
          VariableDeclarator: { array: false, object: true },
          AssignmentExpression: { array: false, object: false },
        },
        { enforceForRenamedProperties: false },
      ],
      
      // No unnecessary template literals
      'no-useless-template-literals': 'off', // Not standard ESLint
      
      // Prefer template literals over string concatenation
      'prefer-template': 'error',
      
      // No var declarations
      'no-var': 'error',
      
      // Prefer arrow functions for callbacks
      'prefer-arrow-callback': ['error', { allowNamedFunctions: false }],
      
      // Object shorthand
      'object-shorthand': ['error', 'always'],
      
      // No else return (simplify conditional logic)
      'no-else-return': ['error', { allowElseIf: false }],
    },
  },
];
