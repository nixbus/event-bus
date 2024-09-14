import js from '@eslint/js'
import noRelativeImportPaths from 'eslint-plugin-no-relative-import-paths'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import unusedImports from 'eslint-plugin-unused-imports'
import globals from 'globals'
import ts from 'typescript-eslint'

export default [
  js.configs.recommended,
  ...ts.configs.recommended,
  {
    plugins: {
      'no-relative-import-paths': noRelativeImportPaths,
      'simple-import-sort': simpleImportSort,
      'unused-imports': unusedImports,
    },

    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        project: true,
      },
      sourceType: 'module',
    },

    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-empty-function': 'warn',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '__',
          caughtErrorsIgnorePattern: '__',
        },
      ],
      '@typescript-eslint/no-var-requires': 'off',
      'no-relative-import-paths/no-relative-import-paths': 'error',
      'no-unused-vars': 'off',
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            ['^\\u0000'],
            ['^node:.*\\u0000$', '^node:'],
            ['^(?!src)@?\\w.*\\u0000$', '^(?!src)@?\\w'],
            ['^src.*\\u0000$', '^src'],
            ['(?<=\\u0000)$', '^'],
            ['^\\..*\\u0000$', '^\\.'],
          ],
        },
      ],
      'unused-imports/no-unused-imports': 'error',
    },
  },
]
