'use strict'
const contentTypeService = require('./content-types')

module.exports = ({ strapi }) => {
  return {
    ...contentTypeService({ strapi }),
  }
}
