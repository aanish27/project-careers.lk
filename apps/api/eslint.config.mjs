// @ts-check
import globals from 'globals';
import tseslint from 'typescript-eslint';
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
});
