'use strict';

module.exports = {
  index(ctx) {
    ctx.body = strapi
      .plugin('testouille')
      .service('myService')
      .getWelcomeMessage();
  },
};
