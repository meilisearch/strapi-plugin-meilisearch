'use strict'

module.exports = ({ strapi }) => ({
  getContentTypes() {
    return strapi.contentTypes
  },
})
