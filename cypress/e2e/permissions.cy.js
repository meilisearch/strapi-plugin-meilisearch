const { apiKey, host, adminUrl } = Cypress.env()

const USER_CREDENTIALS = {
  NO_ACCESS: {
    email: 'cannot-access@meilisearch.com',
    password: 'Password1234',
  },
  CAN_ACCESS: {
    email: 'can-access@meilisearch.com',
    password: 'Password1234',
  },
  CAN_CREATE: {
    email: 'can-create@meilisearch.com',
    password: 'Password1234',
  },
  CAN_UPDATE: {
    email: 'can-update@meilisearch.com',
    password: 'Password1234',
  },
  CAN_DELETE: {
    email: 'can-delete@meilisearch.com',
    password: 'Password1234',
  },
  CAN_EDIT_SETTINGS: {
    email: 'can-edit-settings@meilisearch.com',
    password: 'Password1234',
  },
}

describe('Permissions', () => {
  before(() => {
    cy.clearMeilisearchIndexes()
  })

  // TODO: refactor as Cypress command
  const loginUser = ({ email, password }) => {
    cy.visit(`${adminUrl}`)
    cy.get('form').should('be.visible')
    cy.get('input[name="email"]').type(email)
    cy.get('input[name="password"]').type(password)
    cy.get('button[role="checkbox"]').click()
    cy.get('button[type="submit"]').click()
  }

  // TODO: refactor as Cypress command
  const visitPluginPage = () => {
    cy.visit(`${adminUrl}/plugins/meilisearch`)
    cy.contains('Collections').should('be.visible')
    cy.contains('Settings').should('be.visible')
  }

  describe('User without permission', () => {
    beforeEach(() => {
      cy.session(
        USER_CREDENTIALS.NO_ACCESS.email,
        () => {
          loginUser({
            email: USER_CREDENTIALS.NO_ACCESS.email,
            password: USER_CREDENTIALS.NO_ACCESS.password,
          })
        },
        {
          validate() {
            cy.wait(1000)
            cy.contains('Hello User without access').should('be.visible')
          },
        },
      )
    })

    it('cannot see the plugin in the sidepanel', () => {
      cy.visit(`${adminUrl}`)
      cy.get('nav').should('not.contain', 'a[aria-label="Meilisearch"]')
    })

    it('cannot access the plugin page', () => {
      cy.visit(`${adminUrl}/plugins/meilisearch`)
      cy.contains(
        "You don't have the permissions to access that content",
      ).should('be.visible')
    })
  })

  describe('User with `read` permission', () => {
    beforeEach(() => {
      cy.session(
        USER_CREDENTIALS.CAN_ACCESS.email,
        () => {
          loginUser({
            email: USER_CREDENTIALS.CAN_ACCESS.email,
            password: USER_CREDENTIALS.CAN_ACCESS.password,
          })
        },
        {
          validate() {
            cy.wait(1000)
            cy.contains('Hello User with access').should('be.visible')
          },
        },
      )
    })

    it('can access the plugin page', () => {
      cy.visit(`${adminUrl}`)
      cy.get('nav')
        .get('a[aria-label="Meilisearch"]', { timeout: 10000 })
        .should('be.visible')
      cy.get('nav')
        .get('a[aria-label="Meilisearch"]', { timeout: 10000 })
        .click()

      cy.url().should('eq', `${adminUrl}/plugins/meilisearch`)
    })

    it('cannot create an index', () => {
      visitPluginPage()
      // There are checkboxes in front of each collection
      cy.root().should('not.contain', 'button[role="checkbox"]')
    })

    it('cannot change settings', () => {
      visitPluginPage()
      cy.root().should('not.contain', 'button:contains("Save")')
    })
  })

  describe('User with `collections.create` permission', () => {
    beforeEach(() => {
      cy.session(
        USER_CREDENTIALS.CAN_CREATE.email,
        () => {
          loginUser({
            email: USER_CREDENTIALS.CAN_CREATE.email,
            password: USER_CREDENTIALS.CAN_CREATE.password,
          })
        },
        {
          validate() {
            cy.wait(1000)
            cy.contains('Hello User who can create').should('be.visible')
          },
        },
      )
    })

    it('can create an index', () => {
      visitPluginPage()

      // There are checkboxes in front of each collection
      cy.get('button[role="checkbox"]').should('be.visible')
    })

    it('can index a collection', () => {
      visitPluginPage()

      // Intercept API requests to wait for completion
      cy.intercept('POST', '**/meilisearch/content-type').as('addCollection')
      cy.intercept('GET', '**/meilisearch/content-type/**').as(
        'fetchCollections',
      )

      cy.get('tr:contains("user") button[role="checkbox"]').first().click()

      cy.wait('@addCollection')
      cy.wait('@fetchCollections')

      // Wait for "Yes" to appear (indexed)
      cy.get('tr:contains("user")').contains('Yes').should('be.visible')

      // Document counts may lag due to async task processing - use retryable assertion
      cy.get('tr:contains("user")', { timeout: 10000 }).contains('1 / 1')

      // Hooks column may show "Hooked" or "Reload needed" due to eventual consistency
      cy.get('tr:contains("user")').then($row => {
        if ($row.text().includes('Reload needed')) {
          // Trigger reload to reconcile state
          cy.reloadServer()
          visitPluginPage()
          cy.get('tr:contains("user")').contains('Hooked').should('be.visible')
        } else {
          cy.get('tr:contains("user")').contains('Hooked').should('be.visible')
        }
      })
    })

    it('cannot disable the collection indexing', () => {
      visitPluginPage()

      cy.get('tr:contains("user") button[role="checkbox"]').first().click()

      cy.get('div[role="status"]')
        .contains('You do not have permission to do this action')
        .should('be.visible')

      cy.reload()

      cy.get('tr:contains("user")').contains('Yes').should('be.visible')
      cy.get('tr:contains("user")').contains('1 / 1').should('be.visible')
      cy.get('tr:contains("user")').contains('Hooked').should('be.visible')
    })

    it('cannot update indexed data', () => {
      visitPluginPage()

      cy.get('tr:contains("user") button[role="checkbox"]')
        .first()
        .should('have.attr', 'data-state', 'checked')

      cy.root().should('not.contain', 'button:contains("Update")')
    })

    it('cannot update settings', () => {
      visitPluginPage()

      cy.root().should('not.contain', 'button:contains("Save")')
    })
  })

  describe('User with `collections.update` permission', () => {
    beforeEach(() => {
      cy.session(
        USER_CREDENTIALS.CAN_UPDATE.email,
        () => {
          loginUser({
            email: USER_CREDENTIALS.CAN_UPDATE.email,
            password: USER_CREDENTIALS.CAN_UPDATE.password,
          })
        },
        {
          validate() {
            cy.wait(1000)
            cy.contains('Hello User who can update').should('be.visible')
          },
        },
      )
    })

    it('cannot create/clear index', () => {
      visitPluginPage()
      cy.root().should('not.contain', 'button[role="checkbox"]')
    })

    it('can update indexed data', () => {
      visitPluginPage()

      cy.get('tr:contains(user)').first().contains('Yes').should('be.visible')
      cy.get('tr:contains(user)')
        .first()
        .contains('Hooked')
        .should('be.visible')

      cy.get('tr:contains(user)').first().contains('button', 'Update').click()

      cy.contains('div[role="status"]', 'success').should('be.visible')
    })

    it('cannot change settings', () => {
      visitPluginPage()
      cy.root().should('not.contain', 'button:contains("Save")')
    })
  })

  describe('User with `collections.delete` permission', () => {
    beforeEach(() => {
      cy.session(
        USER_CREDENTIALS.CAN_DELETE.email,
        () => {
          loginUser({
            email: USER_CREDENTIALS.CAN_DELETE.email,
            password: USER_CREDENTIALS.CAN_DELETE.password,
          })
        },
        {
          validate() {
            cy.wait(1000)
            cy.contains('Hello User who can delete').should('be.visible')
          },
        },
      )
    })

    it('cannot update indexed data', () => {
      visitPluginPage()

      cy.get('button[role="checkbox"]')
        .first()
        .should('have.attr', 'data-state', 'checked')
      cy.root().should('not.contain', 'button:contains("Update")')
    })

    it('can clear the collection index', () => {
      visitPluginPage()

      cy.get('tr:contains(user)').first().contains('Yes').should('be.visible')
      cy.get('tr:contains(user)')
        .first()
        .contains('Hooked')
        .should('be.visible')

      cy.get('tr:contains(user)')
        .first()
        .get('button[role="checkbox"]')
        .first()
        .click()

      cy.get('tr:contains(user)')
        .first()
        .contains('Reload needed')
        .should('be.visible')

      cy.reloadServer()
    })

    it('cannot index data', () => {
      visitPluginPage()

      cy.get('button[role="checkbox"]').should('be.visible')

      cy.get('button[role="checkbox"]').first().click()

      cy.get('div[role="status"]')
        .contains('You do not have permission to do this action')
        .should('be.visible')

      cy.reload()

      cy.get('button[role="checkbox"]').first().should('not.be.checked')
    })

    it('cannot update settings', () => {
      visitPluginPage()

      cy.root().should('not.contain', 'button:contains("Save")')
    })
  })

  describe('User with `settings.edit` permission', () => {
    beforeEach(() => {
      cy.session(
        USER_CREDENTIALS.CAN_EDIT_SETTINGS.email,
        () => {
          loginUser({
            email: USER_CREDENTIALS.CAN_EDIT_SETTINGS.email,
            password: USER_CREDENTIALS.CAN_EDIT_SETTINGS.password,
          })
        },
        {
          validate() {
            cy.wait(1000)
            cy.contains('Hello User who can edit settings').should('be.visible')
          },
        },
      )
    })

    it('cannot create/clear index', () => {
      visitPluginPage()
      cy.root().should('not.contain', 'button[role="checkbox"]')
    })

    it('cannot update indexed data', () => {
      visitPluginPage()
      cy.root().should('not.contain', 'button:contains("Update")')
    })

    it('can update settings', () => {
      visitPluginPage()
      cy.get('button:contains("Settings")').click()

      cy.contains('button', 'Save').should('be.visible')

      cy.get('input[name="host"]').clear()
      cy.get('input[name="host"]').type('http://localhost:7777')
      cy.get('input[name="apiKey"]').clear()
      cy.get('input[name="apiKey"]').type('test')

      cy.contains('button', 'Save').click()

      visitPluginPage()
      cy.get('button:contains("Settings")').click()

      cy.get('input[name="host"]').should('have.value', 'http://localhost:7777')
      cy.get('input[name="apiKey"]').should('have.value', 'test')

      cy.get('input[name="host"]').clear()
      cy.get('input[name="host"]').type(host)
      cy.get('input[name="apiKey"]').clear()
      cy.get('input[name="apiKey"]').type(apiKey)
      cy.contains('button', 'Save').click()

      visitPluginPage()
      cy.get('button:contains("Settings")').click()

      cy.get('input[name="host"]').should('have.value', host)
      cy.get('input[name="apiKey"]').should('have.value', apiKey)
    })
  })
})
