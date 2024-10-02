import contentTypeService from './content-types'

export default ({ strapi }) => {
  return {
    ...contentTypeService({ strapi }),
  }
}
