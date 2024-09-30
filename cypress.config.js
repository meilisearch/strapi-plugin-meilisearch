const { defineConfig } = require('cypress')

module.exports = defineConfig({
  env: {
    user: {
      email: 'jolene@doe.com',
      password: 'Qwertyuiop1',
    },
    env: 'develop',
    apiKey: 'masterKey',
    test: {
      adminUrl: 'http://localhost:1337/admin',
      host: 'http://localhost:7700',
    },
    watch: {
      adminUrl: 'http://localhost:8000/admin',
      host: 'http://localhost:7700',
    },
    develop: {
      adminUrl: 'http://localhost:1337/admin',
      host: 'http://localhost:7700',
    },
    ci: {
      adminUrl: 'http://localhost:1337/admin',
      host: 'http://meilisearch:7700',
    },
    prereleaseci: {
      adminUrl: 'http://localhost:1337/admin',
      host: 'http://localhost:7700',
    },
  },
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
})
