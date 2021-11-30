'use strict';

/**
 * movie service.
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::movie.movie');
