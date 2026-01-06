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
const login = ({ adminUrl, email, password, shouldContain }) => {
  cy.session(
    [email, password],
    () => {
      cy.visit(adminUrl)
      cy.get('form').should('be.visible')
      cy.get('input[name="email"]').type(email)
      cy.get('input[name="password"]').type(password)
      cy.get('button[role="checkbox"]').click()
      cy.get('button[type="submit"]').click()
    },
    {
      validate() {
        cy.visit(adminUrl)
        cy.contains(shouldContain).should('be.visible')
      },
    },
  )
}

const confirmDialog = () => {
  cy.get('div[role="alertdialog"]').contains('button', 'Confirm').click()
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
    `${adminUrl}/content-manager/collection-types/api::restaurant.restaurant`,
  )
}

const openUsers = adminUrl => {
  cy.visit(`${adminUrl}/settings/users`)
}

const openRoles = adminUrl => {
  cy.visit(`${adminUrl}/settings/roles`)
}

/**
 *
 * @param {string} adminUrl
 * @param {string} roleName
 * @param {string[]} permissions
 */
const createRole = ({ adminUrl, roleName, permissions }) => {
  cy.openRoles(adminUrl)
  cy.contains('button', 'Add new role').click()

  cy.get('input[name="name"]').type(roleName)

  cy.get('div[role="tablist"]')
    .contains('button[role="tab"]', 'Plugins')
    .click()

  cy.get('main').contains('Meilisearch').click()

  cy.get('main')
    .get('div[role="region"][data-state="open"]')
    .should('be.visible')

  cy.wait(100)
  cy.get('main')
    .get('div[role="region"][data-state="open"]')
    .within(() => {
      permissions.forEach(permission => {
        cy.contains('label', permission).should('be.visible')
        cy.contains('label', permission).click()
      })
    })

  cy.get('form').submit()

  cy.contains('Edit a role').should('be.visible')
}

/**
 * @param {string} adminUrl
 * @param {string} roleName
 */
const removeRole = ({ adminUrl, roleName }) => {
  cy.openRoles(adminUrl)

  cy.contains('table[role="grid"] tbody tr', roleName)
    .contains('button', 'Delete')
    .click()

  cy.confirm()
}

/**
 *
 * @param {string} adminUrl
 * @param {string} roleName
 */
const createUser = ({ adminUrl, email, password, roleName }) => {
  cy.openUsers(adminUrl)

  cy.contains('button', 'Invite new user').click()

  cy.get('div[role="dialog"]').within(() => {
    cy.get('input[name="firstname"]').type('e2e')
    cy.get('input[name="lastname"]').type('test')
    cy.get('input[name="email"]').type(email)

    cy.get('div[role="combobox"][name="roles"]').click()
  })

  cy.get('div[role="listbox"]').contains('div[role="option"]', roleName).click()

  cy.get('div[role="dialog"]').within(() => {
    cy.get('button[type="submit"]').click({ force: true })

    cy.contains('button[type="button"]', 'Finish').click()
  })

  cy.contains('tr', email, { timeout: 10000 }).should('be.visible')
  cy.contains('tr', email, { timeout: 10000 }).contains('a', /^Edit/).click()

  cy.get('form').within(() => {
    cy.get('input[type="checkbox"][name="isActive"]').click()
    cy.get('input[type="checkbox"][name="isActive"]').should('be.checked')

    cy.get('input[name="password"]').type(password)
    cy.get('input[name="confirmPassword"]').type(password)

    cy.root().submit()
  })

  cy.contains('div[role="status"]', 'Saved').should('be.visible')
}

const removeUser = ({ adminUrl, email }) => {
  cy.openUsers(adminUrl)

  cy.contains('tr', email, { timeout: 10000 }).should('be.visible')
  cy.contains('tr', email, { timeout: 10000 })
    .contains('button', /^Delete/)
    .click()

  cy.confirm()

  cy.root().should('not.contain', email)
}

const removeNotifications = () => {
  cy.get('button:contains("Close")').click()
}

const clickCollection = ({ rowNb }) => {
  const row = `table[role='grid'] tbody tr:nth-child(${rowNb})`
  cy.get(`${row} button[role="checkbox"]`, { timeout: 10000 }).click({
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
  // Intercept the reload request
  cy.intercept('GET', '**/meilisearch/reload').as('reloadServer')

  cy.get('button').contains('Reload server').click({ force: true })

  // Wait for the reload request to complete
  cy.wait('@reloadServer')

  // After reload, the server may take time to restart; poll the plugin page until it responds
  // by checking that Collections and Settings tabs are visible
  cy.contains('Collections', { timeout: 15000 }).should('be.visible')
  cy.contains('Settings', { timeout: 15000 }).should('be.visible')
}
const clickAndCheckRowContent = ({ rowNb, contains }) => {
  clickCollection({ rowNb })
  checkCollectionContent({ rowNb, contains })
}

Cypress.Commands.add('login', login)
Cypress.Commands.add('confirm', confirmDialog)
Cypress.Commands.add('openPluginPage', openPluginPage)
Cypress.Commands.add('openPluginSettings', openPluginSettings)
Cypress.Commands.add('openContentManager', openContentManager)
Cypress.Commands.add('openRestaurants', openRestaurants)
Cypress.Commands.add('openUsers', openUsers)
Cypress.Commands.add('openRoles', openRoles)
Cypress.Commands.add('createUser', createUser)
Cypress.Commands.add('removeUser', removeUser)
Cypress.Commands.add('createRole', createRole)
Cypress.Commands.add('removeRole', removeRole)

Cypress.Commands.add('clickCollection', clickCollection)
Cypress.Commands.add('clickAndCheckRowContent', clickAndCheckRowContent)
Cypress.Commands.add('checkCollectionContent', checkCollectionContent)
Cypress.Commands.add('reloadServer', reloadServer)
Cypress.Commands.add('removeNotifications', removeNotifications)

const clearMeilisearchIndexes = () => {
  const {
    apiKey,
    host,
  } = Cypress.env()

  // List all indexes
  cy.request({
    method: 'GET',
    url: `${host}/indexes`,
    headers: { Authorization: `Bearer ${apiKey}` },
  }).then(response => {
    const indexes = response.body.results || []
    // Delete each index sequentially using cy.wrap().each() to ensure proper awaiting
    cy.wrap(indexes).each(index => {
      cy.request({
        method: 'DELETE',
        url: `${host}/indexes/${index.uid}`,
        headers: { Authorization: `Bearer ${apiKey}` },
      })
    })
  })
}

Cypress.Commands.add('clearMeilisearchIndexes', clearMeilisearchIndexes)
