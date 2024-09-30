// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

/**
 *
 * @param {string} adminUrl
 * @param {string} email
 * @param {string} password
 */
const login = ({ adminUrl, email, password }) => {
  cy.session(
    [email, password],
    () => {
      cy.visit(adminUrl)
      cy.get('form', { timeout: 10000 }).should('be.visible')
      cy.get('input[name="email"]').type(email)
      cy.get('input[name="password"]').type(password)
      cy.get('button[type="submit"]').click()
    },
    {
      validate() {
        cy.visit(adminUrl)
        cy.contains('Strapi Dashboard', { timeout: 10000 }).should('be.visible')
      },
    },
  )
}

/**
 *
 * @param {string} adminUrl
 */
const openPluginPage = adminUrl => {
  cy.visit(`${adminUrl}/plugins/meilisearch`)
}

/**
 *
 * @param {string} adminUrl
 */
const openPluginSettings = adminUrl => {
  openPluginPage(adminUrl)
  cy.get('button').contains('Settings').click()
}

const openContentManager = adminUrl => {
  cy.visit(`${adminUrl}/content-manager/`)
}

const openRestaurants = adminUrl => {
  cy.visit(
    `${adminUrl}/content-manager/collectionType/api::restaurant.restaurant`,
  )
}

const removeNotifications = () => {
  cy.get('button[aria-label="Close"]').click()
}

const clickCollection = ({ rowNb }) => {
  const row = `table[role='grid'] tbody tr:nth-child(${rowNb})`
  cy.get(`${row} input[type="checkbox"]`, { timeout: 10000 }).click({
    timeout: 10000,
  })
}

const checkCollectionContent = ({ rowNb, contains }) => {
  const row = `table[role='grid'] tbody tr:nth-child(${rowNb})`
  contains.map(value =>
    cy
      .get(row, {
        timeout: 10000,
      })
      .contains(value, { timeout: 10000 }),
  )
}

const reloadServer = () => {
  cy.get(`button`).contains('Reload server').click({ force: true })
  cy.wait(2000)
}
const clickAndCheckRowContent = ({ rowNb, contains }) => {
  clickCollection({ rowNb })
  checkCollectionContent({ rowNb, contains })
}

Cypress.Commands.add('login', login)
Cypress.Commands.add('openPluginPage', openPluginPage)
Cypress.Commands.add('openPluginSettings', openPluginSettings)
Cypress.Commands.add('openContentManager', openContentManager)
Cypress.Commands.add('openRestaurants', openRestaurants)

Cypress.Commands.add('clickCollection', clickCollection)
Cypress.Commands.add('clickAndCheckRowContent', clickAndCheckRowContent)
Cypress.Commands.add('checkCollectionContent', checkCollectionContent)
Cypress.Commands.add('reloadServer', reloadServer)
Cypress.Commands.add('removeNotifications', removeNotifications)
