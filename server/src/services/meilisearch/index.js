const configurationService = require('./config')
const connectorService = require('./connector')
const adapterService = require('./adapter')

module.exports = ({ strapi }) => {
  const adapter = adapterService({ strapi })
  const config = configurationService({ strapi })
  return {
    ...configurationService({ strapi }),
    ...connectorService({ strapi, adapter, config }),
    ...adapterService({ strapi }),
  }
}
