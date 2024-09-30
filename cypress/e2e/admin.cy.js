/// <reference types="cypress" />

import MeiliSearch from 'meilisearch'

// Welcome to Cypress!
//
// This spec file contains a variety of sample tests
// for a todo list app that are designed to demonstrate
// the power of writing tests in Cypress.
//
// To learn more about how Cypress works and
// what makes it such an awesome testing tool,
// please read our getting started guide:
// https://on.cypress.io/introduction-to-cypress

const {
  user: { email, password },
  apiKey,
  env,
  [env]: { host, adminUrl },
} = Cypress.env()

const removeCollectionsFromMeiliSearch = async () => {
  const client = new MeiliSearch({ apiKey, host })
  const collections = ['restaurant', 'category', 'project', 'reviews']
  const { results } = await client.getIndexes()

  const allUids = results.map(index => index.uid)
  const collectionInMs = collections.filter(col => allUids.includes(col))
  for (const index of collectionInMs) {
    await client.deleteIndex(index)
  }
}

describe('Strapi meilisearch plugin - administrator', () => {
  before(() => {
    cy.clearCookies()
    cy.clearAllSessionStorage()
    cy.viewport('macbook-16')
    cy.wait(2000)
    cy.request(
      {
        url: adminUrl,
      },
      { timeout: 10000 },
    )
  })

  beforeEach(() => {
    cy.login({ adminUrl, email, password })
  })

  after(async () => {
    await removeCollectionsFromMeiliSearch()
  })

  it('Enter to the plugin Home Page', () => {
    cy.visit(adminUrl)
    cy.contains('Meilisearch', { timeout: 10000 }).click()
    cy.url().should('include', '/plugins/meilisearch', { timeout: 10000 })
  })

  it('Add credentials', () => {
    cy.openPluginSettings(adminUrl)

    cy.contains('Strapi Dashboard', { timeout: 10000 }).should('be.visible')

    cy.get('input[name="host"]').clear()
    cy.get('input[name="host"]').type(host)
    cy.get('input[name="apiKey"]').clear()
    cy.get('input[name="apiKey"]').type(apiKey)
    cy.get('button[type="button"]').contains('Save').click({ force: true })

    cy.get('div[role="status').contains('success').should('be.visible')
    cy.get('div[role="status')
      .contains('Credentials sucessfully updated')
      .should('be.visible')
    cy.removeNotifications()
  })

  it('Credentials should be displayed', () => {
    cy.openPluginSettings(adminUrl)

    cy.get('input[name="host"]').should('have.value', host)
    cy.get('input[name="apiKey"]').should('have.value', apiKey)
  })

  it('Collections should be displayed', () => {
    cy.openPluginPage(adminUrl)

    cy.contains('user', { timeout: 10000 })
    cy.contains('about-us', { timeout: 10000 })
    cy.contains('category', { timeout: 10000 })
    cy.contains('homepage', { timeout: 10000 })
    cy.contains('restaurant', { timeout: 10000 })
  })

  it('Add Collections to Meilisearch', () => {
    cy.openPluginPage(adminUrl)

    cy.clickAndCheckRowContent({
      rowNb: 1,
      contains: ['user', 'Yes', 'Hooked'],
    })

    cy.clickAndCheckRowContent({
      rowNb: 2,
      contains: ['about-us', 'Yes', 'Hooked'],
    })

    cy.clickAndCheckRowContent({
      rowNb: 3,
      contains: ['category', 'Yes', 'Hooked'],
    })

    cy.clickAndCheckRowContent({
      rowNb: 4,
      contains: ['homepage', 'Yes', 'Hooked'],
    })

    cy.clickAndCheckRowContent({
      rowNb: 5,
      contains: ['restaurant', 'Yes', 'Hooked'],
    })
  })

  it('Check for right number of documents indexed', () => {
    cy.openPluginPage(adminUrl)

    cy.checkCollectionContent({ rowNb: 1, contains: ['1 / 2'] })
    cy.checkCollectionContent({ rowNb: 2, contains: ['2 / 2'] })
    cy.checkCollectionContent({ rowNb: 3, contains: ['3 / 3'] })
    cy.checkCollectionContent({ rowNb: 4, contains: ['2 / 2'] })
    cy.checkCollectionContent({
      rowNb: 5,
      contains: ['6200 / 6200'],
    })
  })

  // HOOKS CHECKS

  it('Add new restaurant', () => {
    cy.openRestaurants(adminUrl)
    cy.get('a[type="button"]').should('have.text', 'Create new entry').click()
    cy.url().should('include', '/create')

    cy.get('input[name="title').type('The slimy snail')

    cy.get('form').contains('button[type="submit"]', 'Save').click()

    cy.removeNotifications()
  })

  it('Check that the document is indexed', () => {
    cy.openPluginPage(adminUrl)

    cy.checkCollectionContent({
      rowNb: 5,
      contains: ['6201 / 6201'],
    })
  })

  it('Remove restaurant', () => {
    cy.openRestaurants(adminUrl)

    cy.get('main').contains('button[type="button"]', 'Search').click()
    cy.get('main').get('input[name="search"]').type('The slimy snail{enter}')
    cy.get('main').contains('tr', 'The slimy snail').should('be.visible')
    cy.get('main')
      .contains('tr', 'The slimy snail')
      .contains('button[type="button"]', 'Delete')
      .click()
    cy.get('div[role="dialog"]')
      .contains('button[type="button"]', 'Confirm')
      .click()
    cy.contains('No content found').should('be.visible')
  })

  it('Check that the document is removed from Meilisearch', () => {
    cy.openPluginPage(adminUrl)

    cy.checkCollectionContent({
      rowNb: 5,
      contains: ['6200 / 6200'],
    })
  })

  it('Remove one collection from Meilisearch', () => {
    cy.openPluginPage(adminUrl)

    cy.clickAndCheckRowContent({
      rowNb: 1,
      contains: ['No', 'Reload needed'],
    })

    cy.reloadServer()
  })

  it('should show that first collection is not indexed', () => {
    cy.openPluginPage(adminUrl)

    cy.checkCollectionContent({ rowNb: 1, contains: ['0 / 2'] })
    cy.checkCollectionContent({ rowNb: 2, contains: ['2 / 2'] })
    cy.checkCollectionContent({ rowNb: 3, contains: ['3 / 3'] })
    cy.checkCollectionContent({ rowNb: 4, contains: ['2 / 2'] })
    cy.checkCollectionContent({
      rowNb: 5,
      contains: ['6200 / 6200'],
    })
  })

  it('Add first collection back to Meilisearch', () => {
    cy.openPluginPage(adminUrl)

    cy.clickAndCheckRowContent({
      rowNb: 1,
      contains: ['user', 'Yes', 'Hooked'],
    })
  })

  it('Remove Collections from Meilisearch', () => {
    cy.openPluginPage(adminUrl)

    for (let i = 1; i <= 5; i++) {
      cy.clickAndCheckRowContent({
        rowNb: i,
        contains: ['No', 'Reload needed'],
      })
    }

    cy.reloadServer()
  })

  it('Check that collections are not in Meilisearch anymore', () => {
    cy.openPluginPage(adminUrl)

    cy.checkCollectionContent({ rowNb: 1, contains: ['0 / 2'] })
    cy.checkCollectionContent({ rowNb: 2, contains: ['0 / 2'] })
    cy.checkCollectionContent({ rowNb: 3, contains: ['0 / 3'] })
    cy.checkCollectionContent({ rowNb: 4, contains: ['0 / 2'] })
    cy.checkCollectionContent({
      rowNb: 5,
      contains: ['0 / 6200'],
    })
  })

  it('Change host to wrong host', () => {
    const wrongHost = 'http://localhost:1234'

    cy.openPluginSettings(adminUrl)

    cy.get('input[name="host"]').clear()
    cy.get('input[name="host"').type(wrongHost)

    cy.contains('button[type="button"]', 'Save').click()

    cy.contains('Credentials sucessfully updated').should('be.visible')

    cy.removeNotifications()

    cy.openPluginPage(adminUrl)
    const row = `table[role='grid'] tbody tr:nth-child(1) input[type="checkbox"]`

    cy.get(row).click()
    cy.removeNotifications()

    cy.get(row).should('not.be.checked')

    cy.openPluginSettings(adminUrl)
    cy.get('input[name="host"]').should('have.value', wrongHost)
    cy.get('input[name="host"]').clear()
    cy.get('input[name="host"]').type(host)
    cy.contains('button[type="button"]', 'Save').click()
    cy.removeNotifications()
  })

  it('Change to empty host', () => {
    cy.openPluginSettings(adminUrl)

    cy.get('input[name="host"]').clear()

    cy.contains('button[type="button"]', 'Save').click()

    cy.contains('Credentials sucessfully updated').should('be.visible')
    cy.removeNotifications()

    cy.openPluginPage(adminUrl)
    const row = `table[role='grid'] tbody tr:nth-child(1) input[type="checkbox"]`

    cy.get(row).click()
    cy.contains('The provided host is not valid.').should('be.visible')
    cy.removeNotifications()

    cy.get(row).should('not.be.checked')

    cy.openPluginSettings(adminUrl)
    cy.get('input[name="host"]').should('have.value', '')
    cy.get('input[name="host"]').clear()
    cy.get('input[name="host"]').type(host)
    cy.contains('button[type="button"]', 'Save').click()
    cy.removeNotifications()
  })
})
