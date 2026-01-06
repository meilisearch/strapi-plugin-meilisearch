const { defineConfig } = require('cypress')

module.exports = defineConfig({
  projectId: 'vu3oo5',
  viewportWidth: 1080,
  env: {
    user: {
      email: 'jolene@doe.com',
      password: 'Qwertyuiop1',
    },
    host: process.env.MEILISEARCH_HOST || 'http://localhost:7700',
    apiKey: process.env.MEILISEARCH_API_KEY || 'masterKey',
    adminUrl: 'http://localhost:1337/admin',
  },
  e2e: {
    setupNodeEvents() {
      // implement node event listeners here
    },
  },
})
