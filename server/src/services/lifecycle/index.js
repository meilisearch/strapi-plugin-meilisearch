import lifecycleService from './lifecycle'

export default ({ strapi }) => {
  return {
    ...lifecycleService({ strapi }),
  }
}
