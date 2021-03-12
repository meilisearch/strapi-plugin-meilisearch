module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2020: true,
    node: true
  },
  globals: {
    strapi: true
  },
  extends: [
    'plugin:react/recommended',
    'standard',
    'plugin:cypress/recommended'
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true
    },
    ecmaVersion: 11
  },
  ignorePatterns: ['playground/plugins'],
  plugins: [
    'react'
  ],
  settings: {
    react: {
      version: 'detect'
    }
  },
  rules: {
    'react/jsx-indent': 'error',
    'react/jsx-indent-props': [2, 2],
    'cypress/no-unnecessary-waiting': 'off',
    'react/prop-types': 'off',
    'react/jsx-closing-bracket-location': [2, 'tag-aligned']
  }
}
