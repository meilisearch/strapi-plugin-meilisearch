const {
  user: { email, password },
  apiKey,
  env,
  [env]: { host, adminUrl }
} = Cypress.env()
const { MeiliSearch } = require('meilisearch')

const wrongHost = 'http://localhost:1234'
const wrongApiKey = 'wrongApiKey'

const removeTutorial = () => {
  cy.get('.videosContent').siblings('.openBtn').click()
}

const clickAndCheckRowContent = (rowNumber, contains) => {
  const row = `.collections tbody tr:nth-child(${rowNumber})`
  cy.get(`${row} input[type="checkbox"]`).click()
  removeNotifications()
  contains.map(content => cy.get(`${row}`).contains(content))
}

const removeNotifications = () => {
  cy.wait(1000)
  cy.get('.notification-enter-done > div > div > div:last-child').click({
    multiple: true
  })
  cy.get('.notification-enter-done > div > div > div:last-child').should('not.exist')
}

describe('Strapi Login flow', () => {
  before(() => {
    cy.clearCookies()
    cy.visit(adminUrl)
  })
  after(async function () {
    const client = new MeiliSearch({ apiKey, host })
    const collections = ['restaurant', 'category', 'project']
    const indexes = await client.listIndexes()
    const allUids = indexes.map(index => index.uid)
    const collectionInMs = collections.filter(col => allUids.includes(col))
    for (const index of collectionInMs) {
      await client.deleteIndex(index)
    }
  })

  it('visit the Strapi admin panel', () => {
    cy.url().should('match', /login/)
    cy.get('form', { timeout: 10000 }).should('be.visible')
  })

  it('Fill the login form', () => {
    cy.get('input[name="email"]').type(email).should('have.value', email)
    cy.get('input[name="password"]').type(password).should('have.value', password)
    cy.get('button[type="submit"]').click()
  })

  it('Enter to the plugin Home Page', () => {
    cy.contains('MeiliSearch', { timeout: 10000 }).click()
    removeTutorial()
    cy.wait(2000)
    cy.url().should('include', '/plugins/meilisearch')
  })

  it('Add credentials', () => {
    cy.get('input[name="MSHost"]').clear().type(host)
    cy.get('input[name="MSApiKey"]').clear().type(apiKey)
    cy.get('.credentials_button').click()
    removeNotifications()
  })

  it('Credentials should be displayed', () => {
    cy.get('input[name="MSHost"]').should('have.value', host)
    cy.get('input[name="MSApiKey"]').should('have.value', apiKey)
  })

  it('Collections should be displayed', () => {
    cy.contains('category', { timeout: 10000 })
    cy.contains('restaurant', { timeout: 10000 })
  })

  it('Add Collections to MeiliSearch', () => {
    clickAndCheckRowContent(1, ['Indexed In MeiliSearch', 'Reload needed'])
    clickAndCheckRowContent(2, ['Indexed In MeiliSearch', 'Reload needed'])
    clickAndCheckRowContent(3, ['Indexed In MeiliSearch', 'Reload needed'])
  })

  it('Reload Server', () => {
    const row = '.reload_button'
    cy.get(`${row}`).click()
    if (env === 'watch') {
      cy.wait(4000)
      cy.visit(adminUrl, { timeout: 4000 })
      cy.url().should('match', /login/)
      cy.get('form', { timeout: 10000 }).should('be.visible')
      cy.get('input[name="email"]').type(email).should('have.value', email)
      cy.get('input[name="password"]').type(password).should('have.value', password)
      cy.get('button[type="submit"]').click()
      cy.contains('MeiliSearch', { timeout: 10000 }).click()
      cy.url().should('include', '/plugins/meilisearch')
    }
    removeTutorial()
  })

  it('Remove Collections from MeiliSearch', () => {
    clickAndCheckRowContent(1, ['Not in MeiliSearch'])
    clickAndCheckRowContent(2, ['Not in MeiliSearch'])
    clickAndCheckRowContent(3, ['Not in MeiliSearch'])
  })

  it('Change Host to wrong host', () => {
    cy.get('input[name="MSHost"]').should('have.value', host)
    cy.get('input[name="MSHost"]').clear().type(wrongHost).should('have.value', wrongHost)
    cy.get('.credentials_button').click()
    removeNotifications()
    cy.get('input[name="MSHost"]').should('have.value', wrongHost)
    const row = '.collections tbody tr:nth-child(1) input[type="checkbox"]'
    cy.get(row).click()
    removeNotifications()
    cy.get(row).should('not.be.checked')
    cy.get('input[name="MSHost"]').clear().type(host).should('have.value', host)
    cy.get('.credentials_button').click()
    removeNotifications()
    cy.get('input[name="MSHost"]').should('have.value', host)
  })

  it('Change Host to empty host', () => {
    cy.get('input[name="MSHost"]').should('have.value', host)
    cy.get('input[name="MSHost"]').clear().should('have.value', '')
    cy.get('.credentials_button').click()
    removeNotifications()
    cy.get('input[name="MSHost"]').should('have.value', '')
    const row = '.collections tbody tr:nth-child(1) input[type="checkbox"]'
    cy.get(row).click()
    removeNotifications()
    cy.get(row).should('not.be.checked')
    cy.get('input[name="MSHost"]').clear().type(host).should('have.value', host)
    cy.get('.credentials_button').click()
    removeNotifications()
    cy.get('input[name="MSHost"]').should('have.value', host)
  })

  it('Change Api Key', () => {
    cy.get('input[name="MSApiKey"]').should('have.value', apiKey)
    cy.get('input[name="MSApiKey"]').clear().type(wrongApiKey).should('have.value', wrongApiKey)
    cy.get('.credentials_button').click()
    removeNotifications()
    cy.get('input[name="MSApiKey"]').should('have.value', wrongApiKey)
    cy.get('input[name="MSApiKey"]').clear().type(apiKey).should('have.value', apiKey)
    cy.get('.credentials_button').click()
    removeNotifications()
    cy.get('input[name="MSApiKey"]').should('have.value', apiKey)
  })
})
