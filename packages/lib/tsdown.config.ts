import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['index.ts', 'ssrf.ts', 'slugify.ts', 'normalizers.ts'],
  format: ['cjs'],
});
