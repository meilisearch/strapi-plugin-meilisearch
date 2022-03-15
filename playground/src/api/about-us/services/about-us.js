'use strict';

/**
 * about-us service.
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::about-us.about-us');
