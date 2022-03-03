'use strict'
const contentTypes = require('./content-types')

module.exports = ({ strapi }) => ({
  ...contentTypes({ strapi }),
})
