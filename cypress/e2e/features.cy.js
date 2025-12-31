const {
  env,
  apiKey,
  [env]: { adminUrl, host },
} = Cypress.env()

const USER_CREDENTIALS = {
  email: 'can-manage@meilisearch.com',
  password: 'Password1234',
}

const TIMEOUT_MS = 15000

// Collection names in the plugin UI
const COLLECTIONS = ['user', 'about-us', 'category', 'homepage', 'restaurant']

describe('Meilisearch features', () => {
  before(() => {
    cy.clearMeilisearchIndexes()
  })

  // ─────────────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────────

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

  /**
   * Get a row by collection name (row-by-name selection).
   * @param {string} name - Collection name (e.g., 'restaurant')
   * @param {object} options - Cypress options (e.g., { timeout: 15000 })
   * @returns Cypress chainable for the row element
   */
  const getRow = (name, options = {}) => {
    return cy.contains("table[role='grid'] tbody tr", name, options)
  }

  /**
   * Set up intercepts for content-type API calls.
   * Must be called before any toggle action.
   */
  const setupContentTypeIntercepts = () => {
    cy.intercept('POST', '**/meilisearch/content-type').as('addCollection')
    cy.intercept('DELETE', '**/meilisearch/content-type/**').as(
      'deleteCollection',
    )
    cy.intercept('GET', '**/meilisearch/content-type').as('fetchCollections')
  }

  /**
   * Poll by refreshing the page until a collection shows the expected indexed state.
   * This handles Meilisearch's eventual consistency.
   * @param {string} collectionName - Collection name
   * @param {string} expectedText - Expected text in the row ('Yes' or 'No')
   * @param {number} maxAttempts - Max polling attempts
   * @param {number} intervalMs - Interval between polls in ms
   */
  const pollUntilState = (
    collectionName,
    expectedText,
    maxAttempts = 15,
    intervalMs = 2000,
  ) => {
    const poll = attempt => {
      if (attempt >= maxAttempts) {
        throw new Error(
          `Timed out waiting for "${collectionName}" to contain "${expectedText}"`,
        )
      }

      // Use getRow helper and check the row text
      return getRow(collectionName, { timeout: 10000 }).then($row => {
        const rowText = $row.text()

        // Check if row contains the expected text
        if (rowText.includes(expectedText)) {
          // Found expected state
          return
        }

        // Not yet in expected state, wait then refresh
        cy.wait(intervalMs)
        cy.reload()
        cy.contains('Collections', { timeout: 10000 }).should('be.visible')
        return poll(attempt + 1)
      })
    }

    return poll(0)
  }

  /**
   * Ensure a collection is indexed (checkbox checked).
   * Uses network intercepts to wait for backend sync.
   * @param {string} name - Collection name
   */
  const ensureIndexed = name => {
    setupContentTypeIntercepts()

    getRow(name)
      .find('button[role="checkbox"]')
      .then($checkbox => {
        const isChecked =
          $checkbox.attr('aria-checked') === 'true' ||
          $checkbox.attr('data-state') === 'checked'

        if (!isChecked) {
          cy.wrap($checkbox).click({ force: true })
          cy.wait('@addCollection')
          cy.wait('@fetchCollections')
        }
      })

    // Assert indexed state with retry (longer timeout for eventual consistency)
    getRow(name, { timeout: TIMEOUT_MS }).should('contain.text', 'Yes')
  }

  /**
   * Ensure a collection is NOT indexed (checkbox unchecked).
   * Uses network intercepts to wait for backend sync.
   * @param {string} name - Collection name
   */
  const ensureUnindexed = name => {
    setupContentTypeIntercepts()

    getRow(name)
      .find('button[role="checkbox"]')
      .then($checkbox => {
        const isChecked =
          $checkbox.attr('aria-checked') === 'true' ||
          $checkbox.attr('data-state') === 'checked'

        if (isChecked) {
          cy.wrap($checkbox).click({ force: true })
          cy.wait('@deleteCollection')
          cy.wait('@fetchCollections')
        }
      })

    // Assert unindexed state with retry (longer timeout for eventual consistency)
    getRow(name, { timeout: TIMEOUT_MS }).should('contain.text', 'No')
  }

  /**
   * Ensure a collection is hooked (lifecycle listeners attached).
   * Tolerates "Reload needed" by triggering a server reload.
   * @param {string} name - Collection name
   */
  const ensureHooked = name => {
    getRow(name).then($row => {
      if ($row.text().includes('Reload needed')) {
        cy.reloadServer()
        visitPluginPage()
      }
      getRow(name).should('contain.text', 'Hooked')
    })
  }

  /**
   * Ensure a collection is indexed AND hooked.
   * @param {string} name - Collection name
   */
  const ensureIndexedAndHooked = name => {
    ensureIndexed(name)
    ensureHooked(name)
  }

  /**
   * Parse document counts from a row.
   * @param {string} name - Collection name
   * @returns {Cypress.Chainable<{indexed: number, total: number}>}
   */
  const getCounts = name => {
    return getRow(name).then($row => {
      const text = $row.text()
      // Match pattern like "2 / 3" for indexed/total counts
      const match = text.match(/(\d+)\s*\/\s*(\d+)/)
      if (match) {
        return {
          indexed: parseInt(match[1], 10),
          total: parseInt(match[2], 10),
        }
      }
      return { indexed: 0, total: 0 }
    })
  }

  /**
   * Assert that a row contains specific count text (with retry).
   * Uses a longer timeout to account for Meilisearch eventual consistency.
   * @param {string} name - Collection name
   * @param {string} countText - Expected count text (e.g., "2 / 2")
   */
  const assertCounts = (name, countText) => {
    getRow(name).should('contain.text', countText)
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Session setup
  // ─────────────────────────────────────────────────────────────────────────────

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

  // ─────────────────────────────────────────────────────────────────────────────
  // Settings panel tests
  // ─────────────────────────────────────────────────────────────────────────────

  describe('Settings panel', () => {
    it('allows to update credentials', () => {
      visitPluginPage()
      cy.get('button:contains("Settings")').click()

      cy.get('input[name="host"]').clear()
      cy.get('input[name="host"]').type(host)
      cy.get('input[name="apiKey"]').clear()
      cy.get('input[name="apiKey"]').type(apiKey)
      cy.contains('button', 'Save').click({ force: true })

      cy.get('div[role="status"]').contains('success').should('be.visible')
      cy.get('div[role="status"]')
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

    it('shows an error when setting an empty host', () => {
      visitPluginPage()
      cy.get('button:contains("Settings")').click()

      cy.get('input[name="host"]').clear()
      cy.contains('button', 'Save').click()

      cy.removeNotifications()
      cy.get('input[name="host"]').should('have.value', '')

      visitPluginPage()
      // Use first row's checkbox (user collection)
      getRow('user').find('button[role="checkbox"]').click({ force: true })
      cy.contains('The provided host is not valid.').should('be.visible')
      cy.removeNotifications()

      getRow('user')
        .find('button[role="checkbox"]')
        .should($checkbox => {
          const isChecked =
            $checkbox.attr('aria-checked') === 'true' ||
            $checkbox.attr('data-state') === 'checked'
          expect(isChecked).to.be.false
        })

      // Restore valid host
      visitPluginPage()
      cy.get('button:contains("Settings")').click()
      cy.get('input[name="host"]').should('have.value', '')
      cy.get('input[name="host"]').clear()
      cy.get('input[name="host"]').type(host)
      cy.contains('button', 'Save').click()
      cy.removeNotifications()
    })
  })

  // ─────────────────────────────────────────────────────────────────────────────
  // Collections panel tests
  // ─────────────────────────────────────────────────────────────────────────────

  describe('Collections panel', () => {
    it('displays all collections', () => {
      visitPluginPage()

      cy.wrap(COLLECTIONS).each(name => {
        cy.contains(name).should('be.visible')
      })
    })

    describe('enabling and disabling indexing', () => {
      it('can enable a single collection indexing', () => {
        // Clear indexes and start fresh
        cy.clearMeilisearchIndexes()
        visitPluginPage()

        // Use 'user' collection for this test
        const testCollection = 'user'

        // First ensure it's unindexed
        ensureUnindexed(testCollection)

        // Handle reload if needed
        getRow(testCollection).then($row => {
          if ($row.text().includes('Reload needed')) {
            cy.reloadServer()
            visitPluginPage()
          }
        })

        // Now enable indexing
        ensureIndexed(testCollection)

        // Verify Yes is shown (retry-safe assertion)
        getRow(testCollection).should('contain.text', 'Yes')

        // Handle Reload needed vs Hooked
        ensureHooked(testCollection)

        // Verify counts show indexed documents
        getRow(testCollection).should($row => {
          expect($row.text()).to.match(/\d+\s*\/\s*\d+/)
        })
      })

      it('can disable collection indexing', () => {
        visitPluginPage()

        // Use 'user' collection (enabled by previous test)
        const testCollection = 'user'

        // Ensure it's currently indexed first
        ensureIndexed(testCollection)
        ensureHooked(testCollection)

        // Now disable it
        ensureUnindexed(testCollection)

        // Verify No is shown (retry-safe assertion)
        getRow(testCollection).should('contain.text', 'No')

        // Reload server to detach hooks
        cy.reloadServer()
        visitPluginPage()

        // After reload, counts should show 0 indexed
        getRow(testCollection).should($row => {
          expect($row.text()).to.match(/0\s*\/\s*\d+/)
        })
      })

      it('displays the number of indexed documents for each collection', () => {
        // This test enables all collections one at a time to verify counts
        // First, we need to sync plugin store with Meilisearch by disabling all via UI
        cy.clearMeilisearchIndexes()
        visitPluginPage()

        // First pass: ensure all collections are unindexed (sync plugin store)
        cy.wrap(COLLECTIONS).each(name => {
          getRow(name)
            .find('button[role="checkbox"]')
            .invoke('attr', 'data-state')
            .then(state => {
              if (state === 'checked') {
                getRow(name)
                  .find('button[role="checkbox"]')
                  .click({ force: true })
                // Poll by refreshing page until we see 'No'
                pollUntilState(name, 'No')
              }
            })

          // Verify the row shows 'No'
          getRow(name, { timeout: TIMEOUT_MS }).should('contain.text', 'No')
        })

        // Reload once after all unindexing is done (if needed)
        cy.get('button').then($buttons => {
          const reloadButton = $buttons.filter(':contains("Reload server")')
          if (reloadButton.length > 0) {
            cy.reloadServer()
            visitPluginPage()
          }
        })

        // Second pass: enable each collection sequentially
        cy.wrap(COLLECTIONS).each(name => {
          getRow(name)
            .find('button[role="checkbox"]')
            .invoke('attr', 'data-state')
            .then(state => {
              if (state === 'unchecked') {
                getRow(name)
                  .find('button[role="checkbox"]')
                  .click({ force: true })
                // Poll by refreshing page until we see 'Yes'
                pollUntilState(name, 'Yes')
              }
            })

          // Verify the row shows 'Yes'
          getRow(name, { timeout: TIMEOUT_MS }).should('contain.text', 'Yes')
        })

        // Reload once after all indexing is done (if needed)
        cy.get('button').then($buttons => {
          const reloadButton = $buttons.filter(':contains("Reload server")')
          if (reloadButton.length > 0) {
            cy.reloadServer()
            visitPluginPage()
          }
        })

        // All collections should show matching counts (X / Y format)
        cy.wrap(COLLECTIONS).each(name => {
          getRow(name, { timeout: TIMEOUT_MS }).should($row => {
            expect($row.text()).to.match(/\d+\s*\/\s*\d+/)
          })
        })
      })
    })

    describe('single-type content indexing', () => {
      it('indexes only 1 document for single-type content', () => {
        visitPluginPage()

        // Start with about-us unindexed
        ensureUnindexed('about-us')

        // Handle reload if needed after unindexing
        getRow('about-us').then($row => {
          if ($row.text().includes('Reload needed')) {
            cy.reloadServer()
            visitPluginPage()
          }
        })

        // Enable indexing for about-us (single-type)
        ensureIndexed('about-us')
        ensureHooked('about-us')

        // Single-type content should only index 1 document regardless of total
        getRow('about-us').should($row => {
          expect($row.text()).to.match(/1\s*\/\s*\d+/)
        })

        // Clean up: disable indexing
        ensureUnindexed('about-us')
        getRow('about-us').should('contain.text', 'No')
      })
    })
  })

  // ─────────────────────────────────────────────────────────────────────────────
  // Content hooks tests (self-contained)
  // ─────────────────────────────────────────────────────────────────────────────

  describe('Content hooks', () => {
    // Each test creates and cleans up its own data

    it('reindexes after adding and removing content', () => {
      // Ensure restaurant collection is indexed and hooked
      visitPluginPage()
      ensureIndexedAndHooked('restaurant')

      // Wait for initial indexing to stabilize after enabling
      cy.wait(2000)

      // Get baseline count and chain all operations from it
      getCounts('restaurant').then(baseline => {
        const uniqueName = `Test Restaurant ${Date.now()}`

        // Create a new restaurant entry
        cy.visit(
          `${adminUrl}/content-manager/collection-types/api::restaurant.restaurant`,
        )
        cy.contains('a', 'Create new entry', { timeout: TIMEOUT_MS }).click()
        cy.url().should('include', '/create')

        cy.get('input[name="title"]').type(uniqueName)
        cy.get('form').contains('button', 'Save').click()

        cy.get('div[role="status"]', { timeout: TIMEOUT_MS })
          .contains(/success|saved/i)
          .should('be.visible')
        cy.removeNotifications()

        // Verify count increased (give Meilisearch time to process)
        visitPluginPage()
        const expectedIndexed = baseline.indexed + 1
        const expectedTotal = baseline.total + 1
        assertCounts('restaurant', `${expectedIndexed} / ${expectedTotal}`)

        // Now delete the entry we just created
        cy.visit(
          `${adminUrl}/content-manager/collection-types/api::restaurant.restaurant`,
        )
        cy.get('main').contains('button', 'Search').click()
        cy.get('main').find('input[name="search"]').type(`${uniqueName}{enter}`)
        cy.get('main', { timeout: TIMEOUT_MS })
          .contains('tr', uniqueName)
          .should('be.visible')
        cy.get('main')
          .contains('tr', uniqueName)
          .contains('button[type="button"]', 'Row actions')
          .click()
        cy.get('div[role="menu"]')
          .contains('div[role="menuitem"]', 'Delete')
          .click()
        cy.confirm()

        // Verify entry is gone
        cy.get('main').contains('button', 'Search').click()
        cy.get('main').find('input[name="search"]').clear()
        cy.get('main').find('input[name="search"]').type(`${uniqueName}{enter}`)
        cy.contains('No content found', { timeout: TIMEOUT_MS }).should(
          'be.visible',
        )

        // Verify count returned to baseline
        visitPluginPage()
        assertCounts('restaurant', `${baseline.indexed} / ${baseline.total}`)
      })
    })
  })
})
