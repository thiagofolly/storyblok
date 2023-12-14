import * as UTILS from '../fixtures/dataUtils'

Cypress.Commands.add('login', (
    username = Cypress.env("user_name"),
    password = Cypress.env("user_password")
) => {
    cy.intercept({
        method: 'POST',
        path: '/v1/users/login'
    }).as('postLogin')

    cy.session([username, password], () => {
        cy.visit('/login')
        cy.get('#email').type(username)
        cy.get('#password').type(password, { log: false })
        cy.get('[data-testid="submit"]').click()
        cy.wait('@postLogin')
            .its('response.statusCode')
            .should('eq', 200)
        cy.url().should('contain', 'me/spaces')
    })
})

Cypress.Commands.add('accessSpace', (
    spaceId = UTILS.ASSETS.space.spaceId,
    spaceName = UTILS.ASSETS.space.spaceName
) => {
    cy.intercept({
        method: 'GET',
        path: `/v1/spaces/${spaceId}`
    }).as('getSpace')
    cy.visit(`/me/spaces/${spaceId}/dashboard`)
    cy.wait('@getSpace')
        .its('response.statusCode')
        .should('eq', 200)
    cy.get('.header__title').should('contain', `${spaceName}`)
})

Cypress.Commands.add('uploadAsset', ({
    spaceId = UTILS.ASSETS.space.spaceId,
    filePath = UTILS.ASSETS.testAsset.assetPath,
    fileName = UTILS.ASSETS.testAsset.assetName,
    fileFormat = UTILS.ASSETS.testAsset.assetFormat,
    uploadType = 'public',
    assetName = null }) => {

    cy.intercept({
        method: 'GET',
        path: `/v1/spaces/${spaceId}/assets*`
    }).as('getAllAssets')

    cy.get('input#file').selectFile(filePath, { force: true })
    cy.get('#asset-name-input-0')
        .should('have.value', fileName)
        .clear()
        .type(assetName)
    cy.get('.sb-textfield__suffix').should('have.text', fileFormat)
    if (uploadType == 'private') {
        cy.get('form#asset-visibility-0 div')
            .should('be.visible')
            .click()
    }
    cy.get('button[type=submit]')
        .should('be.visible')
        .and('be.enabled')
        .click()

    cy.wait('@getAllAssets')
        .its('response.statusCode')
        .should('eq', 200)
})