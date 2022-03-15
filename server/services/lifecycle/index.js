const lifecycleService = require('./lifecycle')

module.exports = ({ strapi }) => {
  return {
    ...lifecycleService({ strapi }),
  }
}
