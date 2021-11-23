'use strict'

module.exports = async (ctx, next) => {
  if (!ctx.state.user) {
    ctx.unauthorized('Access refused : Please be logged in.')
  }
  if (ctx.state.user.roles) {
    for (let i = 0; ctx.state.user.roles[i]; i++) {
      if (ctx.state.user.roles[i].code === 'strapi-super-admin') {
        return await next()
      }
    }
  }

  return ctx.unauthorized('Access refused : You are not and administrator.')
}
