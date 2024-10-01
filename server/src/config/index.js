const { validatePluginConfig } = require('./configuration-validation')

module.exports = {
  default: {},
  validator: validatePluginConfig,
}
