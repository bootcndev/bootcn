import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      '**/playwright-report/**',
      '**/test-results/**',
      '_site/**',
      '**/.vitepress/cache/**',
      'apps/docs/public/previews/**',
    ],
  },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ['packages/registry/{components,blocks,templates}/**/*.js', 'examples/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },
  {
    files: ['tests/**/*.mjs', 'scripts/**/*.mjs'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
);
