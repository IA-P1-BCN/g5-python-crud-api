import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  {
    files: ['**/*.test.{js,jsx}', 'src/test/**/*.{js,jsx}'],
    languageOptions: { globals: { ...globals.vitest } },
  },
  // Architecture boundaries: app -> features -> shared (see README.md).
  // Cross-folder imports use the "@" alias; inside a feature use relative paths.
  {
    files: ['src/shared/**/*.{js,jsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/features/**', '@/app/**'],
              message: 'shared must not import features or app.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/features/**/*.{js,jsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['@/app/**'], message: 'features must not import app.' },
            {
              group: ['@/features/*/*'],
              message: 'Import another feature only through its index.js: @/features/<name>.',
            },
            {
              group: ['../../**'],
              message:
                'Do not leave your feature with relative paths: use @/shared/... or @/features/<name>.',
            },
          ],
        },
      ],
    },
  },
  {
    // files at the root of a feature (e.g. corridor/Corridor.jsx): ../ already leaves the feature
    files: ['src/features/*/*.{js,jsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['@/app/**'], message: 'features must not import app.' },
            {
              group: ['@/features/*/*'],
              message: 'Import another feature only through its index.js: @/features/<name>.',
            },
            {
              group: ['../**'],
              message:
                'Do not leave your feature with relative paths: use @/shared/... or @/features/<name>.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/app/**/*.{js,jsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/features/*/*'],
              message: 'app imports a feature only through its index.js.',
            },
          ],
        },
      ],
    },
  },
])
