module.exports = ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET', '1eb9a218d26dc77bd39c11b0ab64b291'),
  },
  apiToken: {
    salt: env('API_TOKEN_SALT', '1eb9a218d26dc77bd39c11b0ab64b291')
  },
  transfer: {
    token: {
      salt: env('TRANSFER_TOKEN_SALT'),
    },
  },
  flags: {
    nps: env.bool('FLAG_NPS', true),
    promoteEE: env.bool('FLAG_PROMOTE_EE', true),
  },
});
