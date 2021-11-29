const removeNotifications = () => {
  cy.wait(1000)
  cy.get('.notification-enter-done > div > div > div:last-child').click({
    multiple: true,
  })
  cy.get('.notification-enter-done > div > div > div:last-child').should(
    'not.exist'
  )
}

const clickCollection = ({ rowNb }) => {
  const row = `.collections tbody tr:nth-child(${rowNb})`
  cy.get(`${row} input[type="checkbox"]`, { timeout: 10000 }).click({
    timeout: 10000,
  })
  removeNotifications()
}

const checkCollectionContent = ({ rowNb, contains }) => {
  const row = `.collections tbody tr:nth-child(${rowNb})`
  contains.map(content =>
    cy.get(`${row}`, { timeout: 10000 }).contains(content, { timeout: 10000 })
  )
}

const reloadServer = () => {
  const row = '.reload_button'
  cy.get(`${row}`).click()
  cy.wait(10000)
}
const clickAndCheckRowContent = ({ rowNb, contains }) => {
  clickCollection({ rowNb })
  checkCollectionContent({ rowNb, contains })
}

Cypress.Commands.add('clickCollection', clickCollection)
Cypress.Commands.add('clickAndCheckRowContent', clickAndCheckRowContent)
Cypress.Commands.add('checkCollectionContent', checkCollectionContent)
Cypress.Commands.add('reloadServer', reloadServer)
Cypress.Commands.add('removeNotifications', removeNotifications)
