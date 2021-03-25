const {
  user: { email, password },
  apiKey,
  env,
  [env]: { host, adminUrl }
} = Cypress.env()

const wrongHost = 'http://localhost:1234'
const wrongApiKey = 'wrongApiKey'

const removeNotifications = () => {
  cy.wait(1000)
  cy.get('.notification-enter-done > div > div > div:last-child').click({
    multiple: true
  })
  cy.get('.notification-enter-done > div > div > div:last-child').should('not.exist')
}

describe('Strapi Login flow', () => {
  before(() => {
    cy.visit(adminUrl)
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
    const category = '.collections tbody tr:first-child'
    cy.get(`${category} input[type="checkbox"]`).click()
    removeNotifications()
    cy.get(`${category}`).contains('Indexed In MeiliSearch')
    const restaurant = '.collections tbody tr:nth-child(2)'
    cy.get(`${restaurant} input[type="checkbox"]`).click()
    removeNotifications()
    cy.get(`${restaurant}`).contains('Indexed In MeiliSearch')
  })

  it('Remove Collections from MeiliSearch', () => {
    const category = '.collections tbody tr:first-child'
    cy.get(`${category} input[type="checkbox"]`).click()
    removeNotifications()
    cy.get(`${category}`).contains('Not in MeiliSearch')
    const restaurant = '.collections tbody tr:nth-child(2)'
    cy.get(`${restaurant} input[type="checkbox"]`).click()
    removeNotifications()
    cy.get(`${restaurant}`).contains('Not in MeiliSearch')
  })

  it('Change Host', () => {
    cy.get('input[name="MSHost"]').should('have.value', host)
    cy.get('input[name="MSHost"]').clear().type(wrongHost).should('have.value', wrongHost)
    cy.get('.credentials_button').click()
    removeNotifications()
    cy.get('input[name="MSHost"]').should('have.value', wrongHost)
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
