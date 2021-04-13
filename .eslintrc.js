module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2020: true,
    node: true,
  },
  globals: {
    strapi: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:cypress/recommended',
    'plugin:prettier/recommended',
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 11,
  },
  ignorePatterns: ['playground'],
  plugins: ['react', 'prettier'],
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    'cypress/no-unnecessary-waiting': 'off',
    'react/prop-types': 'off',
    'react/jsx-closing-bracket-location': [2, 'tag-aligned'],
    'no-unused-vars': ['error', { varsIgnorePattern: '^omit.*$' }],
    'array-callback-return': 'off',
    'arrow-parens': ['error', 'as-needed'],
    'prettier/prettier': [
      'error',
      {
        quoteProps: 'consistent',
        semi: false,
        arrowParens: 'avoid',
      },
    ],
  },
}
