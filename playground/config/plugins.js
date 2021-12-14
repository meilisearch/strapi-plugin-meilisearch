const path = require('path');

module.exports = ({ env }) => ({
  'meilisearch': {
    enabled: true,
    resolve: path.resolve(__dirname, '../src/plugins/meilisearch'),
    config: {
      // host: string
      // apiKey : string
      // Do not create a field with a function as parameter.
      // Strapi removes silently the field.
      // All other types are accepted (as far as I know).
    }
  },

  'testouille': {
    enabled: true,
    resolve: path.resolve(__dirname, '../src/plugins/testouille'),
  },
});
