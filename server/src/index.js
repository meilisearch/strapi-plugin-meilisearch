'use strict'

/**
 * Application methods
 */
const bootstrap = require('./bootstrap')
const destroy = require('./destroy')
const register = require('./register')

/**
 * Plugin server methods
 */
const config = require('./config')
const controllers = require('./controllers')
const policies = require('./policies')
const routes = require('./routes')
const services = require('./services')

module.exports = {
  bootstrap,
  destroy,
  register,

  config,
  controllers,
  policies,
  routes,
  services,
}
