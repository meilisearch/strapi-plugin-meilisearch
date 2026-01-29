const { apiKey, adminUrl, host } = Cypress.env()
const TIMEOUT_MS = 15000

describe('Relations indexing (Document middleware)', () => {
  const apiBase = adminUrl.replace(/\/admin$/, '')
  let addedCategoryName

  const visitPluginPage = () => {
    cy.visit(`${adminUrl}/plugins/meilisearch`)
    cy.contains('Collections').should('be.visible')
    cy.contains('Settings').should('be.visible')
  }

  const getRow = (name, options = {}) => {
    return cy.contains("table[role='grid'] tbody tr", name, options)
  }

  const ensureIndexed = name => {
    cy.intercept('POST', '**/meilisearch/content-type').as('addCollection')
    cy.intercept('GET', '**/meilisearch/content-type').as('fetchCollections')

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

    getRow(name, { timeout: TIMEOUT_MS }).should('contain.text', 'Yes')
  }

  const ensureHooked = name => {
    getRow(name).then($row => {
      if ($row.text().includes('Reload needed')) {
        cy.reloadServer()
        visitPluginPage()
      }
      getRow(name).should('contain.text', 'Hooked')
    })
  }

  const ensureIndexedAndHooked = name => {
    ensureIndexed(name)
    ensureHooked(name)
  }

  const fetchRestaurantWithCategories = () =>
    cy
      .request({
        method: 'GET',
        url: `${apiBase}/api/restaurants`,
        qs: { populate: 'categories' },
        headers: {},
      })
      .then(response => {
        const data = response.body?.data || []
        if (!data.length) {
          throw new Error('No restaurants found in seeded data')
        }
        const restaurant = data[0]
        const categories =
          restaurant?.attributes?.categories?.data?.map(cat => ({
            id: cat.id,
            name: cat.attributes?.name,
          })) || []
        return {
          id: restaurant.id,
          name: restaurant.attributes?.title,
          categories,
        }
      })

  const fetchMeiliRestaurant = restaurantId =>
    cy.request({
      method: 'GET',
      url: `${host}/indexes/my_restaurant/documents/${restaurantId}`,
      headers: { Authorization: `Bearer ${apiKey}` },
      failOnStatusCode: false,
    })

  /**
   * Poll Meilisearch document until validation passes or timeout.
   * Retries up to 6 times with 2s intervals.
   */
  const expectMeiliCategories = (restaurantId, validate, attempt = 0) => {
    const maxAttempts = 6
    if (attempt > maxAttempts) {
      throw new Error('Timed out waiting for Meilisearch document update')
    }

    return fetchMeiliRestaurant(restaurantId).then(({ status, body }) => {
      expect(status).to.eq(200)
      try {
        validate(body)
        return
      } catch (error) {
        cy.wait(2000)
        return expectMeiliCategories(restaurantId, validate, attempt + 1)
      }
    })
  }

  beforeEach(() => {
    visitPluginPage()
    ensureIndexedAndHooked('restaurant')
  })

  it('indexes restaurant with its related categories', () => {
    fetchRestaurantWithCategories().then(({ id, categories }) => {
      fetchMeiliRestaurant(id).then(({ status, body }) => {
        expect(status).to.eq(200)
        const categoryNames = categories.map(cat => cat.name).filter(Boolean)
        expect(body.categories, 'Meilisearch document categories').to.be.an(
          'array',
        )
        categoryNames.forEach(name => {
          expect(body.categories).to.include(name)
        })
      })
    })
  })

  it('updates index when adding a relation to existing restaurant', () => {
    const categoryName = `Test Category ${Date.now()}`
    addedCategoryName = categoryName

    // Create and publish a new category via admin UI
    cy.visit(
      `${adminUrl}/content-manager/collection-types/api::category.category`,
    )
    cy.contains('a', 'Create new entry', { timeout: TIMEOUT_MS }).click()
    cy.get('input[name="name"]', { timeout: TIMEOUT_MS }).type(categoryName)
    cy.contains('button', 'Save', { timeout: TIMEOUT_MS }).click()
    cy.contains('button', 'Publish', { timeout: TIMEOUT_MS }).click()
    cy.get('div[role="status"]', { timeout: TIMEOUT_MS })
      .contains(/published/i)
      .should('be.visible')
    cy.removeNotifications()

    // Attach the category to restaurant 3 via admin UI
    cy.visit(
      `${adminUrl}/content-manager/collection-types/api::restaurant.restaurant/3`,
    )
    cy.contains('label', 'Categories', { timeout: TIMEOUT_MS })
      .parent()
      .within(() => {
        cy.contains('button', /Add an entry|Add another entry/i, {
          timeout: TIMEOUT_MS,
        }).click()
      })

    cy.get('input[placeholder="Search for an entry..."]', {
      timeout: TIMEOUT_MS,
    }).type(categoryName)
    cy.contains('tr', categoryName, { timeout: TIMEOUT_MS }).within(() => {
      cy.get('input[type="checkbox"]').click({ force: true })
    })
    cy.contains('button', 'Finish', { timeout: TIMEOUT_MS }).click()
    cy.contains('button', 'Save', { timeout: TIMEOUT_MS }).click()
    cy.get('div[role="status"]', { timeout: TIMEOUT_MS })
      .contains(/saved/i)
      .should('be.visible')
    cy.removeNotifications()

    // Validate Meilisearch document includes the new category
    expectMeiliCategories(3, body => {
      expect(body.categories).to.include(categoryName)
    })
  })

  it('updates index when removing a relation from restaurant', () => {
    const categoryName = addedCategoryName || 'Test Category'

    cy.visit(
      `${adminUrl}/content-manager/collection-types/api::restaurant.restaurant/3`,
    )
    cy.contains('label', 'Categories', { timeout: TIMEOUT_MS })
      .parent()
      .within(() => {
        cy.contains('tr', categoryName, { timeout: TIMEOUT_MS })
          .should('be.visible')
          .within(() => {
            cy.contains('button', /Remove/i).click({ force: true })
          })
      })

    cy.contains('button', 'Save', { timeout: TIMEOUT_MS }).click()
    cy.get('div[role="status"]', { timeout: TIMEOUT_MS })
      .contains(/saved/i)
      .should('be.visible')
    cy.removeNotifications()

    expectMeiliCategories(3, body => {
      expect(body.categories).to.not.include(categoryName)
    })
  })

  it('handles publish/unpublish for content with relations', () => {
    // Unpublish category 4 (Chinese), then reindex restaurant 5 manually
    cy.visit(
      `${adminUrl}/content-manager/collection-types/api::category.category/4`,
    )
    cy.contains('button', 'Unpublish', { timeout: TIMEOUT_MS }).click()
    cy.get('div[role="status"]', { timeout: TIMEOUT_MS })
      .contains(/unpublished/i)
      .should('be.visible')
    cy.removeNotifications()

    cy.visit(
      `${adminUrl}/content-manager/collection-types/api::restaurant.restaurant/5`,
    )
    cy.contains('button', 'Save', { timeout: TIMEOUT_MS }).click()
    cy.get('div[role="status"]', { timeout: TIMEOUT_MS })
      .contains(/saved/i)
      .should('be.visible')
    cy.removeNotifications()

    expectMeiliCategories(5, body => {
      expect(body.categories).to.not.include('Chinese')
    })

    // Publish category 1 (French draft), then reindex restaurant 3 manually
    cy.visit(
      `${adminUrl}/content-manager/collection-types/api::category.category/1`,
    )
    cy.contains('button', 'Publish', { timeout: TIMEOUT_MS }).click()
    cy.get('div[role="status"]', { timeout: TIMEOUT_MS })
      .contains(/published/i)
      .should('be.visible')
    cy.removeNotifications()

    cy.visit(
      `${adminUrl}/content-manager/collection-types/api::restaurant.restaurant/3`,
    )
    cy.contains('button', 'Save', { timeout: TIMEOUT_MS }).click()
    cy.get('div[role="status"]', { timeout: TIMEOUT_MS })
      .contains(/saved/i)
      .should('be.visible')
    cy.removeNotifications()

    expectMeiliCategories(3, body => {
      const frenchCount = body.categories.filter(name => name === 'French')
        .length
      expect(frenchCount).to.be.at.least(2)
    })
  })
})
