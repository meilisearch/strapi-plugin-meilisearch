'use strict'

const bootstrap = require('./server/bootstrap')
const services = require('./server/services')
const controllers = require('./server/controllers')
const routes = require('./server/routes')
const policies = require('./server/policies')
const { validateConfiguration } = require('./server/configuration-validation')

module.exports = {
  bootstrap,
  controllers,
  services,
  routes,
  policies,
  config: {
    validator: validateConfiguration,
  },
}
