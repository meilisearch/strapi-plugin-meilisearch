// Since v4, they created a global API containing all the functions I defined everywhere in my code.  Well, if you call the function in which you are … it creates an infinite loop
'use strict'

module.exports = ({ strapi }) => ({
  getCollections(ctx) {
    ctx.body = { message: 'hello world ' }
  },
})
