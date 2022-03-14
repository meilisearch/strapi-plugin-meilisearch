const error = require('./error')

module.exports = ({ strapi }) => {
  return {
    ...error({ strapi }),
  }
}
