const path = require('path');

module.exports = ({ env }) => ({
  'meilisearch': {
    enabled: true,
    resolve: path.resolve(__dirname, '../src/plugins/meilisearch'),
    config: {
      // additional config goes here
    }
  },

  'testouille': {
    enabled: true,
    resolve: path.resolve(__dirname, '../src/plugins/testouille'),
  },
});
