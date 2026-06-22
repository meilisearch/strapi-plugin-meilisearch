/**
 * Build admin configuration for the i18n fixture app.
 *
 * @param {{ env: (name: string, defaultValue?: string) => string }} options - Strapi config utilities.
 * @returns {object} Admin plugin configuration.
 */
module.exports = ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET', 'test-admin-jwt-secret'),
  },
  apiToken: {
    salt: env('API_TOKEN_SALT', 'test-api-token-salt'),
  },
  transfer: {
    token: {
      salt: env('TRANSFER_TOKEN_SALT', 'test-transfer-token-salt'),
    },
  },
  flags: {
    nps: false,
    promoteEE: false,
  },
})
