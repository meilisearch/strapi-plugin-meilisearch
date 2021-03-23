'use strict'

/**
 * An asynchronous bootstrap function that runs before
 * your application gets started.
 *
 * This gives you an opportunity to set up your data model,
 * run jobs, or perform some special logic.
 *
 * See more details here: https://strapi.io/documentation/developer-docs/latest/concepts/configurations.html#bootstrap
 */

module.exports = () => {
  // const models = strapi.models
  // Object.keys(models).map(
  //   modelKey => {
  //     const model = strapi.models[modelKey]
  //     const lifecycles = model.lifecycles
  //     if (_.isEmpty(lifecycles)) {
  //       model.lifecycles = {} // Load them here
  //     } else {
  //       Object.keys(lifecycles).map(lifecycleKey => {
  //         const fn = model.lifecycles[lifecycleKey]
  //         model.lifecycles[lifecycleKey] = (data) => {
  //         // Execute the initial function
  //           fn(data)
  //         // Then, do what you want to override them
  //         // ...
  //         }
  //       })
  //     }
  //     return undefined
  //   })
}
