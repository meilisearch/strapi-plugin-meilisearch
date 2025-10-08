const {
  env,
  [env]: { adminUrl },
} = Cypress.env()

const USER_WITH_ACCESS_CREDENTIALS = {
  email: 'can-access@meilisearch.com',
  password: 'Password1234',
}

const USER_WITHOUT_ACCESS_CREDENTIALS = {
  email: 'cannot-access@meilisearch.com',
  password: 'Password1234',
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
        USER_WITHOUT_ACCESS_CREDENTIALS.email,
        () => {
          loginUser({
            email: USER_WITHOUT_ACCESS_CREDENTIALS.email,
            password: USER_WITHOUT_ACCESS_CREDENTIALS.password,
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
        USER_WITH_ACCESS_CREDENTIALS.email,
        () => {
          loginUser({
            email: USER_WITH_ACCESS_CREDENTIALS.email,
            password: USER_WITH_ACCESS_CREDENTIALS.password,
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
      cy.root().should('not.contain', 'button[role="checkbox"]')
    })

    it.only('cannot change settings', () => {
      visitPluginPage()
      cy.root().should('not.contain', 'button:contains("Save")')
    })
  })
})
