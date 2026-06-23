const path = require('path')

/**
 * Build database configuration for the i18n fixture app.
 *
 * @param {{ env: (name: string, defaultValue?: string) => string }} options - Strapi config utilities.
 * @returns {object} Database configuration.
 */
module.exports = ({ env }) => ({
  connection: {
    client: 'sqlite',
    connection: {
      filename: path.join(
        __dirname,
        '..',
        env('DATABASE_FILENAME', '.tmp/test-data.db'),
      ),
    },
    useNullAsDefault: true,
  },
})
