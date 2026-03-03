const { defineConfig, globalIgnores } = require('eslint/config')
const js = require('@eslint/js')
const globals = require('globals')
const react = require('eslint-plugin-react')
const prettier = require('eslint-plugin-prettier')
const prettierConfig = require('eslint-config-prettier/flat')
const cypressPlugin = require('eslint-plugin-cypress')

module.exports = defineConfig([
  globalIgnores([
    '**/playground',
    '**/.cache',
    '**/build',
    '**/node_modules/**',
    '**/dist',
  ]),
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 11,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.commonjs,
        ...globals.node,
        ...globals.jest,
        strapi: 'readonly',
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      react,
      prettier,
    },
    settings: {
      // Explicit version avoids eslint-plugin-react's getFilename() path (incompatible with ESLint 10)
      react: { version: '18.0' },
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...prettierConfig.rules,
      'cypress/no-unnecessary-waiting': 'off',
      'react/prop-types': 'off',
      'react/jsx-closing-bracket-location': [2, 'tag-aligned'],
      'array-callback-return': 'off',
      'arrow-parens': ['error', 'as-needed'],
      'no-unused-vars': [
        'error',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      'prettier/prettier': [
        'error',
        {
          quoteProps: 'consistent',
          semi: false,
          arrowParens: 'avoid',
          singleQuote: true,
        },
      ],
    },
  },
  {
    files: ['cypress/**/*.js', 'cypress.config.js'],
    plugins: { cypress: cypressPlugin },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.mocha,
        cy: 'readonly',
        Cypress: 'readonly',
        expect: 'readonly',
        assert: 'readonly',
        chai: 'readonly',
      },
    },
    rules: {
      ...cypressPlugin.configs.recommended.rules,
      'cypress/no-unnecessary-waiting': 'off',
    },
  },
])
