import pluginPkg from '../../package.json' with { type: "json" }
const pluginId = pluginPkg.name.replace(/^strapi-plugin-/i, '')

export default pluginId
