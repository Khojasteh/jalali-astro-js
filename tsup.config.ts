import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs', 'iife'],
  globalName: 'JalaliAstro',
  dts: true,
  clean: true,
  sourcemap: true,
  target: 'es2020',
  outDir: 'dist',
});
