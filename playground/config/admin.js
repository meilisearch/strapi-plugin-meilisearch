module.exports = ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET', '1eb9a218d26dc77bd39c11b0ab64b291'),
  },
  apiToken: {
    salt: env('API_TOKEN_SALT', '1eb9a218d26dc77bd39c11b0ab64b291')
  }
});
