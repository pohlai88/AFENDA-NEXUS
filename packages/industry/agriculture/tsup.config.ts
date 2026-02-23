import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/public.ts"],
  format: ["esm"],
  dts: false,
  sourcemap: true,
  clean: true,
  tsconfig: "./tsconfig.build.json",
  external: ["@afenda/core"],
});
