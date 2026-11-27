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
      // Written by the CLI when the framework tests run.
      'examples/*/src/components/ui/**',
      'examples/*/src/bootcn/**',
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
    // React components ignore a missing declaration for bootstrap's modal: with
    // @types/bootstrap installed, @ts-expect-error would break the build instead.
    files: ['packages/registry/react/**/*.tsx'],
    rules: {
      '@typescript-eslint/ban-ts-comment': ['error', { 'ts-ignore': 'allow-with-description' }],
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
