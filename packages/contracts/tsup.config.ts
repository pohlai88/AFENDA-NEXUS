import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/portal/index.ts'],
  format: ['esm'],
  dts: false,
  sourcemap: true,
  clean: true,
  tsconfig: './tsconfig.build.json',
  external: ['@afenda/core', 'zod'],
});
