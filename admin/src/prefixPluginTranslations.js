export const prefixPluginTranslations = (trad, pluginId) => {
  if (!pluginId) {
    throw new Error("pluginId can't be empty")
  }
  return Object.keys(trad).reduce((acc, current) => {
    acc[`${pluginId}.${current}`] = trad[current]
    return acc
  }, {})
}
