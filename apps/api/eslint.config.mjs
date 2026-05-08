// @ts-check
import tseslint from 'typescript-eslint';
import globals from 'globals';
import base from '../../eslint.config.base.mjs';

export default tseslint.config(...base, {
  files: ['**/*.ts'],
  extends: [...tseslint.configs.recommendedTypeChecked],
  languageOptions: {
    globals: {
      ...globals.node,
      ...globals.jest,
    },
    sourceType: 'commonjs',
    parserOptions: {
      projectService: true,
      tsconfigRootDir: import.meta.dirname,
    },
  },
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-floating-promises': 'warn',
    '@typescript-eslint/no-unsafe-argument': 'off',
    '@typescript-eslint/no-unsafe-call': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/no-unsafe-return': 'off',
    '@typescript-eslint/unbound-method': 'off',
  },
});
