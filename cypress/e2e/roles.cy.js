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

      cy.get('nav')
        .get('a', { timeout: 10000 })
        .should('not.contain', 'Meilisearch')
    })

    it('should not access the plugin page', () => {
      cy.login({ adminUrl, email: 'e2e@meili.search', password: 'e2eTest1234' })

      cy.openPluginPage(adminUrl)

      cy.url().should('eq', `${adminUrl}/`)
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
        .get('a', { timeout: 10000 })
        .should('contain', 'Meilisearch')
      cy.contains('a', 'Meilisearch').click()

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

      cy.root().should('not.contain', 'input[type="checkbox"]')
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

      cy.openPluginPage(adminUrl)
      cy.get('input[type="checkbox"]').first().uncheck()
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

      cy.get('input[type="checkbox"]').should('be.visible')
    })

    it('should be able to index data', () => {
      cy.login({ adminUrl, email: userEmail, password: userPassword })

      cy.openPluginPage(adminUrl)

      cy.get('input[type="checkbox"]').first().click()

      cy.get('tr:contains("user")').contains('Yes').should('be.visible')
      cy.get('tr:contains("user")').contains('1 / 3').should('be.visible')
      cy.get('tr:contains("user")').contains('Hooked').should('be.visible')
    })

    it('should not be able to clear index', () => {
      cy.login({ adminUrl, email: userEmail, password: userPassword })

      cy.openPluginPage(adminUrl)

      cy.get('input[type="checkbox"]').first().click()

      cy.get('div[role="alert"]').contains('Forbidden').should('be.visible')

      cy.reload()

      cy.get('tr:contains("user")').contains('Yes').should('be.visible')
      cy.get('tr:contains("user")').contains('1 / 3').should('be.visible')
      cy.get('tr:contains("user")').contains('Hooked').should('be.visible')
    })

    it('should not be able to update indexed data', () => {
      cy.login({ adminUrl, email: userEmail, password: userPassword })

      cy.openPluginPage(adminUrl)

      cy.get('input[type="checkbox"]').first().should('be.checked')

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

      cy.openPluginPage(adminUrl)
      cy.get('input[type="checkbox"]').first().check()
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

      cy.root().should('not.contain', 'input[type="checkbox"]')
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

      cy.openPluginPage(adminUrl)
      cy.get('input[type="checkbox"]').first().check()
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

      cy.get('input[type="checkbox"]').first().should('be.checked')

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
        .get('input[type="checkbox"]')
        .uncheck()

      cy.get('tr:contains(user)')
        .first()
        .contains('Reload needed')
        .should('be.visible')

      cy.reloadServer()
    })

    it('should not be able to index data', () => {
      cy.login({ adminUrl, email: userEmail, password: userPassword })

      cy.openPluginPage(adminUrl)

      cy.get('input[type="checkbox"]').should('be.visible')

      cy.get('input[type="checkbox"]').first().click()

      cy.get('div[role="alert"]').contains('Forbidden').should('be.visible')

      cy.reload()

      cy.get('input[type="checkbox"]').first().should('not.be.checked')
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

      cy.root().should('not.contain', 'input[type="checkbox"]')
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
