const {
  env,
  apiKey,
  [env]: { adminUrl, host },
} = Cypress.env()

const USER_CREDENTIALS = {
  email: 'can-manage@meilisearch.com',
  password: 'Password1234',
}

describe('Meilisearch features', () => {
  const loginUser = ({ email, password }) => {
    cy.visit(`${adminUrl}`)
    cy.get('form').should('be.visible')
    cy.get('input[name="email"]').type(email)
    cy.get('input[name="password"]').type(password)
    cy.get('button[role="checkbox"]').click()
    cy.get('button[type="submit"]').click()
  }

  const visitPluginPage = () => {
    cy.visit(`${adminUrl}/plugins/meilisearch`)
    cy.contains('Collections').should('be.visible')
    cy.contains('Settings').should('be.visible')
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

  beforeEach(() => {
    cy.session(
      USER_CREDENTIALS.email,
      () => {
        loginUser({
          email: USER_CREDENTIALS.email,
          password: USER_CREDENTIALS.password,
        })
      },
      {
        validate() {
          cy.wait(1000)
          cy.contains('Hello User who can manage Meilisearch').should(
            'be.visible',
          )
        },
      },
    )
  })

  it('can update credentials', () => {
    visitPluginPage()
    cy.get('button:contains("Settings")').click()

    cy.get('input[name="host"]').clear()
    cy.get('input[name="host"]').type(host)
    cy.get('input[name="apiKey"]').clear()
    cy.get('input[name="apiKey"]').type(apiKey)
    cy.contains('button', 'Save').click({ force: true })

    cy.get('div[role="status').contains('success').should('be.visible')
    cy.get('div[role="status')
      .contains('Credentials successfully updated')
      .should('be.visible')
    cy.removeNotifications()
  })

  it('displays credentials', () => {
    visitPluginPage()
    cy.get('button:contains("Settings")').click()

    cy.get('input[name="host"]').should('have.value', host)
    cy.get('input[name="apiKey"]').should('have.value', apiKey)
  })

  it('displays all collections', () => {
    visitPluginPage()

    cy.contains('user')
    cy.contains('about-us')
    cy.contains('category')
    cy.contains('homepage')
    cy.contains('restaurant')
  })

  it('can add collections to index', () => {
    visitPluginPage()

    // Intercepts used to wait for the UI to refresh after toggles
    cy.intercept('POST', '**/meilisearch/content-type').as('addCollection')
    cy.intercept('GET', '**/meilisearch/content-type/**').as('fetchCollections')

    cy.get("table[role='grid'] tbody tr")
      .should('have.length.at.least', 1)
      .each((_row, idx) => {
        const rowIndex = idx + 1
        const rowSelector = `table[role='grid'] tbody tr:nth-child(${rowIndex})`
        const checkboxSelector = `${rowSelector} button[role="checkbox"]`

        // Click only if not already checked to avoid deleting the collection
        cy.get(checkboxSelector).then(checkbox => {
          const isChecked =
            checkbox.attr('aria-checked') === 'true' ||
            checkbox.attr('data-state') === 'checked'

          if (!isChecked) {
            cy.wrap(checkbox).click({ force: true })
            cy.wait('@addCollection')
            cy.wait('@fetchCollections') // wait for the refetch after the POST
          }
        })

        // Re-select the row after the network sync to avoid stale element references
        cy.get(rowSelector)
          .should('contain.text', 'Yes')
          .and('contain.text', 'Hooked')
      })
  })

  it('displays the number of inxed documents for each collection', () => {
    visitPluginPage()

    // 1 user in database -> 1 document in `user` index
    checkCollectionContent({ rowNb: 1, contains: ['1 / 1'] })
    // `about-us` is in the `content` index (2 documents)
    checkCollectionContent({ rowNb: 2, contains: ['2 / 2'] })
    // 2 categories in db -> 2 documents in `category` index
    checkCollectionContent({ rowNb: 3, contains: ['2 / 2'] })
    // `homepage` is in the `content` index (2 documents)
    checkCollectionContent({ rowNb: 4, contains: ['2 / 2'] })
    // 2 restaurants in db -> 2 documents in `restaurant` index
    checkCollectionContent({ rowNb: 5, contains: ['2 / 2'] })
  })
})
