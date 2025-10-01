module.exports = {
  async bootstrap({ strapi }) {
    console.log('🚀 Bootstrap function called!');
    // Only run seeding in development/test environments
    if (process.env.NODE_ENV !== 'production') {
      try {
        console.log('🌱 Starting bootstrap seeding...');

        // Check if admin user exists
        const adminUser = await strapi.query('admin::user').findOne({
          where: { email: 'admin@strapi.io' }
        });

        if (!adminUser) {
          // Create admin user using Strapi's admin service
          const adminUserService = strapi.service('admin::user');
          const superAdminRole = await strapi.query('admin::role').findOne({
            where: { code: 'strapi-super-admin' }
          });

          await adminUserService.create({
            firstname: 'Admin',
            lastname: 'User',
            email: 'admin@strapi.io',
            password: 'password',
            isActive: true,
            roles: [superAdminRole.id],
          });
          console.log('✅ Admin user created');
        } else {
          console.log('✅ Admin user already exists');
          // Update the password if it's not hashed (for existing users)
          if (adminUser.password === 'password') {
            const adminUserService = strapi.service('admin::user');
            await adminUserService.updateById(adminUser.id, {
              password: 'password'
            });
            console.log('✅ Admin user password updated with proper hash');
          }
        }

        // Check if test API token exists
        const existingToken = await strapi.query('admin::api-token').findOne({
          where: { name: 'cypress-test-token' }
        });

        if (!existingToken) {
          // Create API token for Cypress tests
          const tokenService = strapi.service('admin::api-token');
          const token = await tokenService.create({
            name: 'cypress-test-token',
            description: 'API token for Cypress tests',
            type: 'full-access',
          });
          console.log('✅ Cypress test token created:', token.accessKey);
        } else {
          console.log('✅ Cypress test token already exists');
        }

        console.log('🌱 Bootstrap seeding completed successfully');
      } catch (error) {
        console.error('❌ Bootstrap seeding failed:', error.message);
        console.error('Error details:', error);
      }
    }
  },
};
