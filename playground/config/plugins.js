const path = require('path');

module.exports = ({ env }) => ({
  'meilisearch': {
    enabled: true,
    resolve: path.resolve(__dirname, '../../meilisearch'),
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
