const {
  user: { email, password },
  apiKey,
  env,
  [env]: { host, adminUrl },
} = Cypress.env()
const { MeiliSearch } = require('meilisearch')

const wrongHost = 'http://localhost:1234'
const wrongApiKey = 'wrongApiKey'

const removeCollectionsFromMeiliSearch = async () => {
  const client = new MeiliSearch({ apiKey, host })
  const collections = ['restaurant', 'category', 'project', 'reviews']
  const { results } = await client.getIndexes()
  const indexes = results || []
  const allUids = indexes.map(index => index.uid)
  const collectionInMs = collections.filter(col => allUids.includes(col))
  for (const index of collectionInMs) {
    await client.deleteIndex(index)
  }
}

describe('Strapi Login flow', () => {
  before(() => {
    cy.clearCookies()
    cy.viewport('macbook-16')
    cy.request({
      url: adminUrl,
    })
    cy.visit(adminUrl)
  })

  beforeEach(() => {
    cy.viewport('macbook-16')
  })

  after(async function () {
    await removeCollectionsFromMeiliSearch()
  })

  it('visit the Strapi admin panel', () => {
    cy.url().should('match', /login/)
    cy.get('form', { timeout: 10000 }).should('be.visible')
  })

  it('Fill the login form', () => {
    cy.get('input[name="email"]').type(email).should('have.value', email)
    cy.get('input[name="password"]')
      .type(password)
      .should('have.value', password)
    cy.get('button[type="submit"]').click()
  })

  it('Enter to the plugin Home Page', () => {
    cy.contains('Meilisearch', { timeout: 10000 }).click()
    cy.wait(2000)
    cy.url().should('include', '/plugins/meilisearch')
  })

  it('Add credentials', () => {
    cy.removeNotifications()
    cy.get('input[name="MSHost"]').clear().type(host)
    cy.get('input[name="MSApiKey"]').clear().type(apiKey)
    cy.get('.credentials_button').click()
    cy.removeNotifications()
  })

  it('Credentials should be displayed', () => {
    cy.get('input[name="MSHost"]').should('have.value', host)
    cy.get('input[name="MSApiKey"]').should('have.value', apiKey)
  })

  it('Collections should be displayed', () => {
    cy.contains('category', { timeout: 10000 })
    cy.contains('project', { timeout: 10000 })
    cy.contains('category', { timeout: 10000 })
    cy.contains('review', { timeout: 10000 })
  })

  it('Add Collections to Meilisearch', () => {
    cy.clickAndCheckRowContent({
      rowNb: 1,
      contains: ['Yes'],
    })
    cy.contains('Reload needed', { timeout: 10000 })
    cy.clickAndCheckRowContent({
      rowNb: 2,
      contains: ['Yes'],
    })
    cy.contains('Reload needed', { timeout: 10000 })
    cy.clickAndCheckRowContent({
      rowNb: 3,
      contains: ['Yes'],
    })
    cy.contains('Reload needed', { timeout: 10000 })
    cy.clickAndCheckRowContent({
      rowNb: 4,
      contains: ['Yes'],
    })
    cy.contains('Reload needed', { timeout: 10000 })
    cy.reloadServer()
    cy.removeNotifications()
  })

  it('Check for successfull listened in develop mode', () => {
    if (['develop', 'watch', 'ci', 'prereleaseci'].includes(env)) {
      cy.checkCollectionContent({ rowNb: 1, contains: ['Yes', 'Active'] })
      cy.checkCollectionContent({ rowNb: 2, contains: ['Yes', 'Active'] })
      cy.checkCollectionContent({ rowNb: 3, contains: ['Yes', 'Active'] })
      cy.checkCollectionContent({ rowNb: 4, contains: ['Yes', 'Active'] })
    } else {
      cy.checkCollectionContent({ rowNb: 1, contains: ['Yes'] })
      cy.contains('Reload needed', { timeout: 10000 })
      cy.checkCollectionContent({ rowNb: 2, contains: ['Yes'] })
      cy.contains('Reload needed', { timeout: 10000 })
      cy.checkCollectionContent({ rowNb: 3, contains: ['Yes'] })
      cy.contains('Reload needed', { timeout: 10000 })
      cy.checkCollectionContent({ rowNb: 4, contains: ['Yes'] })
      cy.contains('Reload needed', { timeout: 10000 })
    }
  })

  it('Check for right number of documents indexed', () => {
    cy.checkCollectionContent({ rowNb: 1, contains: ['3 / 3'] })
    cy.checkCollectionContent({ rowNb: 2, contains: ['0 / 0'] })
    cy.checkCollectionContent({ rowNb: 3, contains: ['3 / 3'] })
    cy.checkCollectionContent({ rowNb: 4, contains: ['3 / 3'] })
  })

  // HOOKS CHECK

  it('Enter to restaurant collection page', () => {
    cy.contains('Restaurants', { timeout: 10000 }).click()
    cy.wait(2000)
    cy.url().should('include', '/admin/plugins/content-manager/collectionType/')
  })

  it('Add a new restaurant in the collection', () => {
    cy.contains('Add New Restaurants', { timeout: 10000 }).click()
  })

  it('Fill the creation form', () => {
    cy.get('#name')
      .type('The slimy snail')
      .should('have.value', 'The slimy snail')
    cy.contains('Save', { timeout: 10000 }).click()
  })

  it('Go back to the plugin Home Page', () => {
    cy.contains('Meilisearch', { timeout: 10000 }).click()
    cy.wait(2000)
    cy.url().should('include', '/plugins/meilisearch')
  })

  it('Restaurant should have one 4 entries', () => {
    cy.checkCollectionContent({ rowNb: 3, contains: ['4 / 4'] })
  })

  it('Enter to restaurant collection page', () => {
    cy.contains('Restaurants', { timeout: 10000 }).click()
    cy.wait(2000)
    cy.url().should('include', '/admin/plugins/content-manager/collectionType/')
  })

  it('Remove a restaurant', () => {
    cy.get('svg[data-icon="trash-alt"]').last().click()
    cy.wait(1000)
    cy.contains('Yes, confirm', { timeout: 10000 }).click()
    cy.wait(1000)
  })

  it('Go back to the plugin Home Page', () => {
    cy.contains('Meilisearch', { timeout: 10000 }).click()
    cy.wait(2000)
    cy.url().should('include', '/plugins/meilisearch')
  })

  it('Restaurant should have one 3 entries', () => {
    cy.checkCollectionContent({ rowNb: 3, contains: ['3 / 3'] })
  })

  it('Remove Collections from Meilisearch', () => {
    cy.clickAndCheckRowContent({
      rowNb: 1,
      contains: ['No'],
    })
    cy.clickAndCheckRowContent({
      rowNb: 2,
      contains: ['No'],
    })
    cy.clickAndCheckRowContent({
      rowNb: 3,
      contains: ['No'],
    })
    cy.clickAndCheckRowContent({
      rowNb: 4,
      contains: ['No'],
    })
    if (env === 'develop' || env === 'watch') {
      cy.checkCollectionContent({ rowNb: 1, contains: ['No'] })
      cy.contains('Reload needed', { timeout: 10000 })
      cy.checkCollectionContent({ rowNb: 2, contains: ['No'] })
      cy.contains('Reload needed', { timeout: 10000 })
      cy.checkCollectionContent({ rowNb: 3, contains: ['No'] })
      cy.contains('Reload needed', { timeout: 10000 })
      cy.checkCollectionContent({ rowNb: 4, contains: ['No'] })
      cy.contains('Reload needed', { timeout: 10000 })
    }
    cy.reloadServer()
    cy.removeNotifications()
  })

  it('Check that collections are not in Meilisearch anymore', () => {
    cy.checkCollectionContent({ rowNb: 1, contains: ['0 / 3'] })
    cy.checkCollectionContent({ rowNb: 2, contains: ['0 / 0'] })
    cy.checkCollectionContent({ rowNb: 3, contains: ['0 / 3'] })
    cy.checkCollectionContent({ rowNb: 4, contains: ['0 / 3'] })
  })

  it('Change Host to wrong host', () => {
    cy.get('input[name="MSHost"]').should('have.value', host)
    cy.get('input[name="MSHost"]')
      .clear()
      .type(wrongHost)
      .should('have.value', wrongHost)
    cy.get('.credentials_button').click()
    cy.removeNotifications()
    cy.get('input[name="MSHost"]').should('have.value', wrongHost)
    const row = '.collections tbody tr:nth-child(1) input[type="checkbox"]'
    cy.get(row).click()
    cy.removeNotifications()
    cy.get(row).should('not.be.checked')
    cy.get('input[name="MSHost"]').clear().type(host).should('have.value', host)
    cy.get('.credentials_button').click()
    cy.removeNotifications()
    cy.get('input[name="MSHost"]').should('have.value', host)
  })

  it('Check that collections are still showcased', () => {
    cy.checkCollectionContent({ rowNb: 1, contains: ['0 / 3'] })
    cy.checkCollectionContent({ rowNb: 2, contains: ['0 / 0'] })
    cy.checkCollectionContent({ rowNb: 3, contains: ['0 / 3'] })
    cy.checkCollectionContent({ rowNb: 4, contains: ['0 / 3'] })
  })
  it('Change Host to empty host', () => {
    cy.get('input[name="MSHost"]').should('have.value', host)
    cy.get('input[name="MSHost"]').clear().should('have.value', '')
    cy.get('.credentials_button').click()
    cy.removeNotifications()
    cy.get('input[name="MSHost"]').should('have.value', '')
    const row = '.collections tbody tr:nth-child(1) input[type="checkbox"]'
    cy.get(row).click()
    cy.removeNotifications()
    cy.get(row).should('not.be.checked')
    cy.get('input[name="MSHost"]').clear().type(host).should('have.value', host)
    cy.get('.credentials_button').click()
    cy.removeNotifications()
    cy.get('input[name="MSHost"]').should('have.value', host)
  })

  it('Change Api Key', () => {
    cy.get('input[name="MSApiKey"]').should('have.value', apiKey)
    cy.get('input[name="MSApiKey"]')
      .clear()
      .type(wrongApiKey)
      .should('have.value', wrongApiKey)
    cy.get('.credentials_button').click()
    cy.removeNotifications()
    cy.get('input[name="MSApiKey"]').should('have.value', wrongApiKey)
    cy.get('input[name="MSApiKey"]')
      .clear()
      .type(apiKey)
      .should('have.value', apiKey)
    cy.get('.credentials_button').click()
    cy.removeNotifications()
    cy.get('input[name="MSApiKey"]').should('have.value', apiKey)
  })
})
