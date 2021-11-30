// strapi-server.js
'use strict'

const bootstrap = require('./server/bootstrap')
const services = require('./server/services')
const controllers = require('./server/controllers')

module.exports = {
  bootstrap,
  controllers,
  services,
}
