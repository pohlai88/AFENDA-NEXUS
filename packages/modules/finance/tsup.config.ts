import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/public.ts", "src/infra.ts"],
  format: ["esm"],
  dts: false,
  sourcemap: true,
  clean: true,
  tsconfig: "./tsconfig.build.json",
  external: [
    "@afenda/core",
    "@afenda/contracts",
    "@afenda/authz",
    "@afenda/db",
    "@afenda/platform",
  ],
});
