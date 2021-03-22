'use strict'
const path = require('path')

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/concepts/models.html#lifecycle-hooks)
 * to customize this model
 */

const COLLECTION = path.basename(__filename, '.js')

module.exports = {
  lifecycles: {
    async meilisearchService (uid) {
      return await strapi.plugins.meilisearch.services.meilisearch_hooks_utils(uid)
    },
    async afterCreate (result) {
      try {
        await (await this.meilisearchService(COLLECTION)).addDocuments({
          indexUid: COLLECTION,
          data: [result]
        })
      } catch (e) {
        console.error(e)
      }
    },
    async afterDelete (result) {
      try {
        await (await this.meilisearchService(COLLECTION)).deleteDocuments({
          indexUid: COLLECTION,
          documentIds: [result.id]
        })
      } catch (e) {
        console.error(e)
      }
    },
    async afterUpdate (result) {
      try {
        await (await this.meilisearch()).addDocuments({
          indexUid: COLLECTION,
          data: [result]
        })
      } catch (e) {
        console.error(e)
      }
    }
  }
}
