// strapi-server.js
'use strict'

const bootstrap = require('./server/bootstrap')
const services = require('./server/services')
const controllers = require('./server/controllers')
const routes = require('./server/routes')

module.exports = {
  bootstrap,
  controllers,
  services,
  routes,
}
