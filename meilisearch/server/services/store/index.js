const createStoreConnector = require('./store')
const credential = require('./credential')
const indexedCollections = require('./indexed-collections')
const listenedCollections = require('./listened-collections')

module.exports = ({ strapi }) => {
  const store = createStoreConnector({ strapi })
  return {
    ...credential({ store, strapi }),
    ...indexedCollections({ store }),
    ...listenedCollections({ store }),
  }
}
