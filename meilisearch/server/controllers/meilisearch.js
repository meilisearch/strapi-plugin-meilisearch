// Since v4, they created a global API containing all the functions I defined everywhere in my code.  Well, if you call the function in which you are … it creates an infinite loop
'use strict'

module.exports = ({ strapi }) => {
  const meilisearch = strapi.plugin('meilisearch').service('meilisearch')
  const error = strapi.plugin('meilisearch').service('error')
  return {
    /**
     * Wait for one contentType to be completely indexed in Meilisearch.
     *
     * @param  {object} ctx - Http request object.
     *
     */
    async waitForTasks(ctx) {
      const { contentType } = ctx.params
      const { taskUids } = ctx.request.body
      await meilisearch
        .waitForTasks({
          taskUids,
          contentType,
        })
        .then(tasks => {
          ctx.body = { data: tasks }
        })
        .catch(async e => {
          ctx.body = await error.createError(e)
        })
    },

    /**
     * Get all the tasks with an enqueued status of the contentTypes that
     * are indexed in Meilisearch.
     */
    async getEnqueuedTaskUids(ctx) {
      await meilisearch
        .getEnqueuedTaskUids()
        .then(taskUids => {
          ctx.body = { data: taskUids }
        })
        .catch(async e => {
          ctx.body = await error.createError(e)
        })
    },
  }
}
