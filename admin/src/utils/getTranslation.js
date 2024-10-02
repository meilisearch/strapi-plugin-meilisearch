import pluginId from '../pluginId'

const getTranslation = translations => {
  return Object.keys(translations).reduce((acc, current) => {
    acc[`${pluginId}.${current}`] = translations[current]
    return acc
  }, {})
}

export { getTranslation }
