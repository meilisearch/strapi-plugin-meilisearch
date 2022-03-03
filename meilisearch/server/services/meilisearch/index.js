const configurations = require('./config')

module.exports = ({ strapi }) => {
  return {
    ...configurations({ strapi }),
  }
}
