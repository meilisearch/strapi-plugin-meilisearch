import { STRAPI_ADMIN_ROLES } from './utils'

const ADMIN_CREDENTIALS = {
  email: 'admin@strapi.io',
  password: 'password',
}

const USER_WITH_ACCESS_CREDENTIALS = {
  email: 'can-access@meilisearch.com',
  password: 'Password1234',
}

const USER_WITHOUT_ACCESS_CREDENTIALS = {
  email: 'cannot-access@meilisearch.com',
  password: 'Password1234',
}

describe('wip test refactor', () => {
  // JWT token for admin panel operations (creating users, roles, permissions)
  let adminToken

  // Long-lived API token for content management and plugin endpoints
  let apiToken

  // Generate unique identifiers for this test run
  const timestamp = Date.now()
  const uniqueEmail = `test.user.${timestamp}@example.com`
  const uniqueRoleName = `Content Manager ${timestamp}`

  // TODO: refactor as Cypress command
  const loginAsAdmin = (email, password) => {
    return cy.request({
      method: 'POST',
      url: 'http://localhost:1337/admin/login',
      body: {
        email,
        password,
      },
    })
  }

  // TODO: refactor as Cypress command
  const createUser = ({ firstname, password, email, roleIds }) => {
    return cy
      .request({
        method: 'POST',
        url: 'http://localhost:1337/admin/users',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
        body: {
          firstname: firstname,
          email: email,
          roles: roleIds,
        },
      })
      .then(createdUser => {
        expect(createdUser.status).to.eq(201)

        return cy
          .request({
            method: 'PUT',
            url: `http://localhost:1337/admin/users/${createdUser.body.data.id}`,
            headers: { Authorization: `Bearer ${adminToken}` },
            body: {
              isActive: true,
              password: password,
            },
          })
          .then(updatedUser => {
            expect(updatedUser.status).to.eq(200)
            expect(updatedUser.body.data.isActive).to.be.true
            return updatedUser.body.data
          })
      })
  }

  // TODO: refactor as Cypress command
  const loginUser = ({ email, password }) => {
    cy.visit('http://localhost:1337/admin')
    cy.get('form').should('be.visible')
    cy.get('input[name="email"]').type(email)
    cy.get('input[name="password"]').type(password)
    cy.get('button[role="checkbox"]').click()
    cy.get('button[type="submit"]').click()
  }

  // before(() => {
  //   // Login as admin to get JWT token for admin panel operations
  //   loginAsAdmin(ADMIN_CREDENTIALS.email, ADMIN_CREDENTIALS.password)
  //     .then(response => {
  //       expect(response.status).to.eq(200)
  //       adminToken = response.body.data.token

  //       // Get the API token created during bootstrap for content/plugin operations
  //       return cy.request({
  //         method: 'GET',
  //         url: 'http://localhost:1337/admin/api-tokens',
  //         headers: {
  //           Authorization: `Bearer ${adminToken}`,
  //         },
  //       })
  //     })
  //     .then(response => {
  //       expect(response.status).to.eq(200)
  //       // console.log(
  //       //   'API Tokens response:',
  //       //   JSON.stringify(response.body, null, 2),
  //       // )
  //       // const cypressToken = response.body.data.find(
  //       //   token => token.name === 'cypress-test-token',
  //       // )
  //       // expect(cypressToken).to.exist
  //       // apiToken = cypressToken.accessKey
  //       // console.log('API Token set to:', apiToken)
  //     })
  // })

  describe('admin user without plugin access', () => {
    // before(() => {
    //   createUser({
    //     firstname: 'Admin No Access',
    //     email: userCredentials.email,
    //     password: userCredentials.password,
    //     roleIds: [STRAPI_ADMIN_ROLES.EDITOR],
    //   })
    // })

    beforeEach(() => {
      cy.session(
        USER_WITHOUT_ACCESS_CREDENTIALS.email,
        () => {
          loginUser({
            email: USER_WITHOUT_ACCESS_CREDENTIALS.email,
            password: USER_WITHOUT_ACCESS_CREDENTIALS.password,
          })

          // TODO: assert `strapi_admin_refresh` cookie exists
          // cy.wait('@adminLogin')
          //   .its('response.headers.set-cookie')
          //   .should(
          //     'satisfy',
          //     cookies =>
          //       Array.isArray(cookies) &&
          //       cookies.some(c => c.startsWith('strapi_admin_refresh=')),
          //   )
        },
        {
          validate() {
            // TODO: uses `strapi_admin_refresh` cookie to validate login
            // cy.getCookie('strapi_admin_refresh').should('exist')

            cy.wait(1000)
            cy.contains('Hello User without access').should('be.visible')
          },
        },
      )
    })

    // it('works', () => {
    //   expect(true).to.be.true

    //   // tests were green, so I added this to trigger hot reloading
    //   expect(false).to.be.false
    // })

    it('should not see the plugin in sidepanel', () => {
      cy.visit('http://localhost:1337/admin')
      cy.get('nav').should('not.contain', 'a[aria-label="Meilisearch"]')
    })

    it('cannot access the plugin page', () => {
      cy.visit('http://localhost:1337/admin/plugins/meilisearch')
      cy.contains(
        "You don't have the permissions to access that content",
      ).should('be.visible')
    })
  })

  describe('admin user with plugin access', () => {
    const userCredentials = {
      email: `with-access-${timestamp}@example.com`,
      password: 'strapiPassword1234',
      username: `with-access-${timestamp}`,
    }

    before(() => {
      createUser({
        firstname: 'Admin With Access',
        email: userCredentials.email,
        password: userCredentials.password,
        roleIds: [STRAPI_ADMIN_ROLES.EDITOR],
      })
    })
  })

  // it('should be able to create a new admin user with admin token', () => {
  //   // Create a new admin user using the admin JWT token
  //   cy.request({
  //     method: 'POST',
  //     url: 'http://localhost:1337/admin/users',
  //     headers: {
  //       Authorization: `Bearer ${adminToken}`,
  //     },
  //     body: {
  //       firstname: 'Test',
  //       lastname: 'User',
  //       email: uniqueEmail,
  //       roles: [2], // Editor role
  //     },
  //   }).then(response => {
  //     expect(response.status).to.eq(201)
  //     expect(response.body.data).to.have.property('id')
  //     expect(response.body.data.email).to.eq(uniqueEmail)
  //     expect(response.body.data.firstname).to.eq('Test')
  //     expect(response.body.data.lastname).to.eq('User')
  //     expect(response.body.data.roles).to.have.length(1)
  //     expect(response.body.data.roles[0].code).to.eq('strapi-editor')

  //     // Store the created user ID for cleanup
  //     Cypress.env('createdUserId', response.body.data.id)
  //   })
  // })

  // it('should be able to create a custom admin role with admin token', () => {
  //   // Create a new custom admin role using the admin JWT token
  //   cy.request({
  //     method: 'POST',
  //     url: 'http://localhost:1337/admin/roles',
  //     headers: {
  //       Authorization: `Bearer ${adminToken}`,
  //     },
  //     body: {
  //       name: uniqueRoleName,
  //       description: 'Can manage content but not system settings',
  //     },
  //   }).then(response => {
  //     expect(response.status).to.eq(201)
  //     expect(response.body.data).to.have.property('id')
  //     expect(response.body.data.name).to.eq(uniqueRoleName)
  //     expect(response.body.data.description).to.eq(
  //       'Can manage content but not system settings',
  //     )

  //     // Store the created role ID for cleanup
  //     Cypress.env('createdRoleId', response.body.data.id)
  //   })
  // })

  // it('should be able to list all admin users', () => {
  //   // List all admin users using the admin JWT token
  //   cy.request({
  //     method: 'GET',
  //     url: 'http://localhost:1337/admin/users',
  //     headers: {
  //       Authorization: `Bearer ${adminToken}`,
  //     },
  //   }).then(response => {
  //     expect(response.status).to.eq(200)
  //     expect(response.body.data).to.have.property('results')
  //     expect(response.body.data.results).to.be.an('array')
  //     expect(response.body.data.results.length).to.be.greaterThan(0)

  //     // Should include our original admin user
  //     const adminUser = response.body.data.results.find(
  //       user => user.email === 'admin@strapi.io',
  //     )
  //     expect(adminUser).to.exist
  //     expect(adminUser.roles[0].code).to.eq('strapi-super-admin')
  //   })
  // })

  // it('should be able to list all admin roles', () => {
  //   // List all admin roles using the admin JWT token
  //   cy.request({
  //     method: 'GET',
  //     url: 'http://localhost:1337/admin/roles',
  //     headers: {
  //       Authorization: `Bearer ${adminToken}`,
  //     },
  //   }).then(response => {
  //     expect(response.status).to.eq(200)
  //     expect(response.body.data).to.be.an('array')
  //     expect(response.body.data.length).to.be.greaterThan(2) // At least Super Admin, Editor, Author

  //     // Should include the default roles
  //     const roleNames = response.body.data.map(role => role.name)
  //     expect(roleNames).to.include('Super Admin')
  //     expect(roleNames).to.include('Editor')
  //     expect(roleNames).to.include('Author')
  //   })
  // })

  // Cleanup tests - run after the main tests
  // after(() => {
  //   // Clean up created user if it exists
  //   cy.window().then(win => {
  //     // Check if the alias exists before trying to get it
  //     if (Cypress.env('createdUserId')) {
  //       cy.request({
  //         method: 'DELETE',
  //         url: `http://localhost:1337/admin/users/${Cypress.env('createdUserId')}`,
  //         headers: {
  //           Authorization: `Bearer ${adminToken}`,
  //         },
  //         failOnStatusCode: false, // Don't fail if user doesn't exist
  //       })
  //     }
  //   })

  //   // Clean up created role if it exists
  //   cy.window().then(win => {
  //     // Check if the alias exists before trying to get it
  //     if (Cypress.env('createdRoleId')) {
  //       cy.request({
  //         method: 'DELETE',
  //         url: `http://localhost:1337/admin/roles/${Cypress.env('createdRoleId')}`,
  //         headers: {
  //           Authorization: `Bearer ${adminToken}`,
  //         },
  //         failOnStatusCode: false, // Don't fail if role doesn't exist
  //       })
  //     }
  //   })
  // })
})
