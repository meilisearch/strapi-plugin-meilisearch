import configurationService from './config'
import connectorService from './connector'
import adapterService from './adapter'

export default ({ strapi }) => {
  const adapter = adapterService({ strapi })
  const config = configurationService({ strapi })
  return {
    ...configurationService({ strapi }),
    ...connectorService({ strapi, adapter, config }),
    ...adapterService({ strapi }),
  }
}
