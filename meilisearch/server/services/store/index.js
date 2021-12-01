const createStoreConnector = require('./store')
const credentials = require('./credentials')
const indexedCollections = require('./indexed-collections')
const listenedCollections = require('./listened-collections')

module.exports = ({ strapi }) => {
  const store = createStoreConnector({ strapi })
  return {
    ...credentials({ store }),
    ...indexedCollections({ store }),
    ...listenedCollections({ store }),
  }
}
