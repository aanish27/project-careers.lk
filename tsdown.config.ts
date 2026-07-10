import { defineConfig } from 'tsdown';

export default defineConfig({
  workspace: 'packages/*',
  dts: true,
  clean: true,
  sourcemap: true,
});
