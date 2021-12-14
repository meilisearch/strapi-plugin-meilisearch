'use strict'

module.exports = ({ strapi }) => ({
  /**
   * Get all API names existing in Strapi instance.
   *
   * Api names are formatted like this: `apiName`
   *
   * @returns {string[]} - list of all `api's` in Strapi.
   */
  getApisName() {
    const { contentTypes } = strapi

    const apis = Object.keys(contentTypes)
      .filter(contentType => contentType.startsWith('api::'))
      .reduce((apiNames, api) => {
        apiNames.push(contentTypes[api].apiName)
        return apiNames
      }, [])

    return apis
  },

  /**
   * Get all content types name being API's existing in Strapi instance.
   *
   * Content Types are formated like this: `api:apiName.apiName`
   *
   * @returns {string[]} - list of all `content types` in Strapi in format "api:apiName.apiName"
   */
  getContentTypesName() {
    const contentTypes = Object.keys(strapi.contentTypes).filter(contentType =>
      contentType.startsWith('api::')
    )
    return contentTypes
  },

  /**
   * Get all content types being API's existing in Strapi instance.
   *
   * Content Types are formated like this: `api:apiName.apiName`
   *
   * @returns {string[]} - list of all `content types` in Strapi in format "api:apiName.apiName"
   */
  getContentTypes() {
    const contenTypes = Object.keys(strapi.contentTypes).reduce(
      (contentApis, contentName) => {
        if (contentName.startsWith('api::')) {
          contentApis[contentName] = strapi.contentTypes[contentName]
        }
        return contentApis
      },
      {}
    )
    return contenTypes
  },
})
