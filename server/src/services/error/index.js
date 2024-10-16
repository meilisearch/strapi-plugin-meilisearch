import error from './error'

export default ({ strapi }) => {
  return {
    ...error({ strapi }),
  }
}
