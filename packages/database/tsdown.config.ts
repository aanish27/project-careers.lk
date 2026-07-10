import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/**/*.ts'],
  format: ['cjs'],
  unbundle: true,
  inputOptions: {
    resolve: {
      extensionAlias: {
        '.js': ['.ts', '.js'],
      },
    },
  },
});
