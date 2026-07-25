import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['index.ts', 'ssrf.ts'],
  format: ['cjs'],
});
