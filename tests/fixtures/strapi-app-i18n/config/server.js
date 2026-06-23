/**
 * Build server configuration for the i18n fixture app.
 *
 * @param {{ env: { int: (name: string, defaultValue?: number) => number, array: (name: string, defaultValue?: string[]) => string[], (name: string, defaultValue?: string): string } }} options - Strapi config utilities.
 * @returns {object} Server configuration.
 */
module.exports = ({ env }) => ({
  host: env('HOST', '127.0.0.1'),
  port: env.int('PORT', 0),
  app: {
    keys: env.array('APP_KEYS', ['testAppKey1', 'testAppKey2']),
  },
})
