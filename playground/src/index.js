module.exports = {
  async bootstrap({ strapi }) {
    try {
      console.log('🚀 Starting seeding...');

      // Check if admin user exists
      const adminUser = await strapi.query('admin::user').findOne({
        where: { email: 'superadmin@meilisearch.com' }
      });

      if (!adminUser) {
        // Create admin user using Strapi's admin service
        const adminUserService = strapi.service('admin::user');
        const superAdminRole = await strapi.query('admin::role').findOne({
          where: { code: 'strapi-super-admin' }
        });

        await adminUserService.create({
          firstname: 'Super Admin User',
          email: 'superadmin@meilisearch.com',
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

      console.log('🌱 Seeding completed!');
    } catch (error) {
      console.error('❌ Seeding failed:', error.message);
      console.error('Error details:', error);
    }
  },
};
