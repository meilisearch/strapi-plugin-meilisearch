'use strict'

const bootstrap = require('./server/bootstrap')
const services = require('./server/services')
const controllers = require('./server/controllers')
const routes = require('./server/routes')
const { validateConfiguration } = require('./server/configuration-validation')

module.exports = {
  bootstrap,
  controllers,
  services,
  routes,
  config: {
    validator: validateConfiguration,
  },
}
