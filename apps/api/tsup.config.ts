import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/build-app.ts'],
  format: ['esm'],
  dts: false,
  sourcemap: true,
  clean: true,
  external: [
    '@afenda/core',
    '@afenda/contracts',
    '@afenda/authz',
    '@afenda/db',
    '@afenda/platform',
    '@afenda/finance',
    'fastify',
    'zod',
  ],
});
