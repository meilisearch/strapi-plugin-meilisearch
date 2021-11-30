'use strict';

/**
 *  movie controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::movie.movie');
