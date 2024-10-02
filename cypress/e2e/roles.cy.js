const {
  user: { email, password },
  apiKey,
  env,
  [env]: { host, adminUrl },
} = Cypress.env()

describe('Strapi meilisearch - role based tests', () => {
  before(() => {
    cy.wait(2000)
    cy.request(
      {
        url: adminUrl,
      },
      { timeout: 10000 },
    )
  })

  describe('Without permission', () => {
    before(() => {
      cy.login({ adminUrl, email, password })
      cy.visit(adminUrl)

      cy.createRole({
        adminUrl,
        roleName: 'e2e-access-meilisearch',
        permissions: [],
      })

      cy.createUser({
        adminUrl,
        email: 'e2e@meili.search',
        password: 'e2eTest1234',
        roleName: 'e2e-access-meilisearch',
      })
    })

    after(() => {
      cy.login({ adminUrl, email, password })
      cy.visit(adminUrl)

      cy.removeUser({ adminUrl, email: 'e2e@meili.search' })
      cy.removeRole({ adminUrl, roleName: 'e2e-access-meilisearch' })

      Cypress.session.clearAllSavedSessions()
    })

    it('no plugin in sidepanel', () => {
      cy.login({ adminUrl, email: 'e2e@meili.search', password: 'e2eTest1234' })
      cy.visit(adminUrl)

      cy.get('nav').should('not.contain', 'a[aria-label="Meilisearch"]')
    })

    it('should not access the plugin page', () => {
      cy.login({ adminUrl, email: 'e2e@meili.search', password: 'e2eTest1234' })

      cy.openPluginPage(adminUrl)

      cy.contains(
        "You don't have the permissions to access that content",
      ).should('be.visible')
    })
  })

  describe('Access permission', () => {
    const userEmail = 'e2e@meili.search'
    const userPassword = 'e2eTest1234'
    const roleName = 'e2e-access-meilisearch'

    before(() => {
      cy.login({ adminUrl, email, password })
      cy.visit(adminUrl)

      cy.createRole({
        adminUrl,
        roleName,
        permissions: ['Access the Meilisearch'],
      })

      cy.createUser({
        adminUrl,
        email: userEmail,
        password: userPassword,
        roleName,
      })
    })

    after(() => {
      cy.login({ adminUrl, email, password })
      cy.visit(adminUrl)

      cy.removeUser({ adminUrl, email: userEmail })
      cy.removeRole({ adminUrl, roleName })

      Cypress.session.clearAllSavedSessions()
    })

    it('should have plugin listed in sidepanel', () => {
      cy.login({ adminUrl, email: userEmail, password: userPassword })
      cy.visit(adminUrl)

      cy.get('nav')
        .get('a[aria-label="Meilisearch"]', { timeout: 10000 })
        .should('be.visible')
      cy.get('nav')
        .get('a[aria-label="Meilisearch"]', { timeout: 10000 })
        .click()

      cy.url().should('eq', `${adminUrl}/plugins/meilisearch`)
    })

    it('should access the plugin page', () => {
      cy.login({ adminUrl, email: userEmail, password: userPassword })

      cy.openPluginPage(adminUrl)

      cy.url().should('eq', `${adminUrl}/plugins/meilisearch`)
    })

    it('should not have option to create index', () => {
      cy.login({ adminUrl, email: userEmail, password: userPassword })

      cy.openPluginPage(adminUrl)

      cy.root().should('not.contain', 'button[role="checkbox"]')
    })

    it('should not have option to change settings', () => {
      cy.login({ adminUrl, email: userEmail, password: userPassword })

      cy.openPluginSettings(adminUrl)

      cy.root().should('not.contain', 'button:contains("Save")')
    })
  })

  describe('Collection manipulation - create', () => {
    const userEmail = 'e2e@meili.search'
    const userPassword = 'e2eTest1234'
    const roleName = 'e2e-access-meilisearch'

    before(() => {
      cy.login({ adminUrl, email, password })
      cy.visit(adminUrl)

      cy.createRole({
        adminUrl,
        roleName,
        permissions: ['Access the Meilisearch', 'Create'],
      })

      cy.createUser({
        adminUrl,
        email: userEmail,
        password: userPassword,
        roleName,
      })
    })

    after(() => {
      cy.login({ adminUrl, email, password })
      cy.visit(adminUrl)

      cy.removeUser({ adminUrl, email: userEmail })
      cy.removeRole({ adminUrl, roleName })

      Cypress.session.clearAllSavedSessions()
    })

    it('can create index', () => {
      cy.login({ adminUrl, email: userEmail, password: userPassword })

      cy.openPluginPage(adminUrl)

      cy.get('button[role="checkbox"]').should('be.visible')
    })

    it('should be able to index data', () => {
      cy.login({ adminUrl, email: userEmail, password: userPassword })

      cy.openPluginPage(adminUrl)

      cy.get('button[role="checkbox"]').first().click()

      cy.get('tr:contains("user")').contains('Yes').should('be.visible')
      cy.get('tr:contains("user")').contains('1 / 1').should('be.visible')
      cy.get('tr:contains("user")').contains('Hooked').should('be.visible')
    })

    it('should not be able to clear index', () => {
      cy.login({ adminUrl, email: userEmail, password: userPassword })

      cy.openPluginPage(adminUrl)

      cy.get('button[role="checkbox"]').first().click()

      cy.get('div[role="status"]')
        .contains('You do not have permission to do this action')
        .should('be.visible')

      cy.reload()

      cy.get('tr:contains("user")').contains('Yes').should('be.visible')
      cy.get('tr:contains("user")').contains('1 / 1').should('be.visible')
      cy.get('tr:contains("user")').contains('Hooked').should('be.visible')
    })

    it('should not be able to update indexed data', () => {
      cy.login({ adminUrl, email: userEmail, password: userPassword })

      cy.openPluginPage(adminUrl)

      cy.get('button[role="checkbox"]')
        .first()
        .should('have.attr', 'data-state', 'checked')

      cy.root().should('not.contain', 'button:contains("Update")')
    })

    it('should not have option to change settings', () => {
      cy.login({ adminUrl, email: userEmail, password: userPassword })

      cy.openPluginSettings(adminUrl)

      cy.root().should('not.contain', 'button:contains("Save")')
    })
  })

  describe('Collection manipulation - update', () => {
    const userEmail = 'e2e@meili.search'
    const userPassword = 'e2eTest1234'
    const roleName = 'e2e-access-meilisearch'

    before(() => {
      cy.login({ adminUrl, email, password })
      cy.visit(adminUrl)

      cy.createRole({
        adminUrl,
        roleName,
        permissions: ['Access the Meilisearch', 'Update'],
      })

      cy.createUser({
        adminUrl,
        email: userEmail,
        password: userPassword,
        roleName,
      })
    })

    after(() => {
      cy.login({ adminUrl, email, password })
      cy.visit(adminUrl)

      cy.removeUser({ adminUrl, email: userEmail })
      cy.removeRole({ adminUrl, roleName })

      Cypress.session.clearAllSavedSessions()
    })

    it('should not have option to create/clear index', () => {
      cy.login({ adminUrl, email: userEmail, password: userPassword })

      cy.openPluginPage(adminUrl)

      cy.root().should('not.contain', 'button[role="checkbox"]')
    })

    it('should be able to update indexed data', () => {
      cy.login({ adminUrl, email: userEmail, password: userPassword })

      cy.openPluginPage(adminUrl)

      cy.get('tr:contains(user)').first().contains('Yes').should('be.visible')
      cy.get('tr:contains(user)')
        .first()
        .contains('Hooked')
        .should('be.visible')

      cy.get('tr:contains(user)').first().contains('button', 'Update').click()

      cy.contains('div[role="status"]', 'success').should('be.visible')
    })

    it('should not have option to change settings', () => {
      cy.login({ adminUrl, email: userEmail, password: userPassword })

      cy.openPluginSettings(adminUrl)

      cy.root().should('not.contain', 'button:contains("Save")')
    })
  })

  describe('Collection manipulation - delete', () => {
    const userEmail = 'e2e@meili.search'
    const userPassword = 'e2eTest1234'
    const roleName = 'e2e-access-meilisearch'

    before(() => {
      cy.login({ adminUrl, email, password })
      cy.visit(adminUrl)

      cy.createRole({
        adminUrl,
        roleName,
        permissions: ['Access the Meilisearch', 'Delete'],
      })

      cy.createUser({
        adminUrl,
        email: userEmail,
        password: userPassword,
        roleName,
      })

      // cy.openPluginPage(adminUrl)
      // cy.get('button[role="checkbox"]').first().check()
    })

    after(() => {
      cy.login({ adminUrl, email, password })
      cy.visit(adminUrl)

      cy.removeUser({ adminUrl, email: userEmail })
      cy.removeRole({ adminUrl, roleName })

      Cypress.session.clearAllSavedSessions()
    })

    it('should not be able to update indexed data', () => {
      cy.login({ adminUrl, email: userEmail, password: userPassword })

      cy.openPluginPage(adminUrl)

      cy.get('button[role="checkbox"]')
        .first()
        .should('have.attr', 'data-state', 'checked')

      cy.root().should('not.contain', 'button:contains("Update")')
    })

    it('should be able to clear index', () => {
      cy.login({ adminUrl, email: userEmail, password: userPassword })

      cy.openPluginPage(adminUrl)

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

    it('should not be able to index data', () => {
      cy.login({ adminUrl, email: userEmail, password: userPassword })

      cy.openPluginPage(adminUrl)

      cy.get('button[role="checkbox"]').should('be.visible')

      cy.get('button[role="checkbox"]').first().click()

      cy.get('div[role="status"]')
        .contains('You do not have permission to do this action')
        .should('be.visible')

      cy.reload()

      cy.get('button[role="checkbox"]').first().should('not.be.checked')
    })

    it('should not have option to change settings', () => {
      cy.login({ adminUrl, email: userEmail, password: userPassword })

      cy.openPluginSettings(adminUrl)

      cy.root().should('not.contain', 'button:contains("Save")')
    })
  })

  describe('Settings - edit', () => {
    const userEmail = 'e2e@meili.search'
    const userPassword = 'e2eTest1234'
    const roleName = 'e2e-access-meilisearch'

    before(() => {
      cy.login({ adminUrl, email, password })
      cy.visit(adminUrl)

      cy.createRole({
        adminUrl,
        roleName,
        permissions: ['Access the Meilisearch', 'Edit'],
      })

      cy.createUser({
        adminUrl,
        email: userEmail,
        password: userPassword,
        roleName,
      })
    })

    after(() => {
      cy.login({ adminUrl, email, password })
      cy.visit(adminUrl)

      cy.removeUser({ adminUrl, email: userEmail })
      cy.removeRole({ adminUrl, roleName })

      Cypress.session.clearAllSavedSessions()
    })

    it('should not have option to create/clear index', () => {
      cy.login({ adminUrl, email: userEmail, password: userPassword })

      cy.openPluginPage(adminUrl)

      cy.root().should('not.contain', 'button[role="checkbox"]')
    })

    it('should not be able to update indexed data', () => {
      cy.login({ adminUrl, email: userEmail, password: userPassword })

      cy.openPluginPage(adminUrl)

      cy.root().should('not.contain', 'button:contains("Update")')
    })

    it('should have option to change settings', () => {
      cy.login({ adminUrl, email: userEmail, password: userPassword })

      cy.openPluginSettings(adminUrl)

      cy.contains('button', 'Save').should('be.visible')

      cy.get('input[name="host"]').clear()
      cy.get('input[name="host"]').type('http://localhost:7777')
      cy.get('input[name="apiKey"]').clear()
      cy.get('input[name="apiKey"]').type('test')

      cy.contains('button', 'Save').click()

      cy.openPluginSettings(adminUrl)

      cy.get('input[name="host"]').should('have.value', 'http://localhost:7777')
      cy.get('input[name="apiKey"]').should('have.value', 'test')

      cy.get('input[name="host"]').clear()
      cy.get('input[name="host"]').type(host)
      cy.get('input[name="apiKey"]').clear()
      cy.get('input[name="apiKey"]').type(apiKey)
      cy.contains('button', 'Save').click()

      cy.openPluginSettings(adminUrl)

      cy.get('input[name="host"]').should('have.value', host)
      cy.get('input[name="apiKey"]').should('have.value', apiKey)
    })
  })
})
