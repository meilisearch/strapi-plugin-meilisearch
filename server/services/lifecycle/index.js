const lifecycleService = require('./subscription')

module.exports = ({ strapi }) => {
  return {
    ...lifecycleService({ strapi }),
  }
}
