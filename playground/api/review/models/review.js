'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#lifecycle-hooks)
 * to customize this model
 */

// TODO remove example
module.exports = {
  // if searchIndexName is same with others
  isUsingCompositeIndex: true,
  // should not crash the whole server?, why the `$` ?
  // searchIndexTypeId: 'restaurant',
  // searchIndexName: 'restaurant'
};
