const path = require('path');

module.exports = ({ env }) => ({
  'meilisearch': {
    enabled: true,
    resolve: './src/plugins/meilisearch', // path to plugin folder
    config: {
      // additional config goes here
    }
  },
    // created using the apparently outdated `strapi generate plugin`
  // Does not work
  'testouille': {
    enabled: true,
    resolve: './src/plugins/testouille' // path to plugin folder
  },
});
