// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierRecommended from 'eslint-plugin-prettier/recommended';

export const ignores = {
  ignores: [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/.next/**',
    '**/out/**',
    '**/coverage/**',
    '**/generated/**',
    '**/*.config.{js,mjs,cjs}',
    'packages/database/prisma/migrations/**',
  ],
};

export default tseslint.config(
  ignores,
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  prettierRecommended,
);
