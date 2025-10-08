const {
  env,
  [env]: { adminUrl },
} = Cypress.env()

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
}

describe('Roles', () => {
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

  describe('User without plugin access', () => {
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

    it('should not see the plugin in sidepanel', () => {
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

  describe('User with `read` access', () => {
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

  describe('User with `create` access', () => {
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

    it.only('can index the user collection', () => {
      visitPluginPage()

      cy.get('tr:contains("user") button[role="checkbox"]').first().click()

      cy.get('tr:contains("user")').contains('Yes').should('be.visible')
      cy.get('tr:contains("user")').contains('1 / 1').should('be.visible')
      cy.get('tr:contains("user")').contains('Hooked').should('be.visible')
    })
  })
})
