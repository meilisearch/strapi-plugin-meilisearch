'use strict'
const contentTypes = require('./content-types')
const configurations = require('./api-configs')

module.exports = ({ strapi }) => ({
  ...contentTypes({ strapi }),
  ...configurations({ strapi }),
})
