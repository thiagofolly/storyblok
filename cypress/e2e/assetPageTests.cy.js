/// <reference types ="cypress"/>
const { faker } = require('@faker-js/faker')
const dayjs = require('dayjs');
import * as UTILS from '../fixtures/dataUtils'
let spaceId = UTILS.ASSETS.space.spaceId

function accessAssetsOption({ spaceId }) {
  cy.intercept({
    method: 'GET',
    path: `/v1/spaces/${spaceId}/assets*`
  }).as('getAsset')
  cy.accessSpace()
  cy.get('#app-Assets').click()
  cy.get('.header__title').should('contain', `Assets`)
  cy.wait('@getAsset')
}
function openAsset({ assetId }) {
  cy.get(`div[data-intro-js-hint="asset-${assetId}"]`)
    .parents('.assets-list-item')
    .click()
}
function replaceAsset({
  assetPath,
  assetSize
}) {
  cy.get(`button[aria-label="Replace asset"]`).should('be.visible')
  cy.get('input#replacefile').selectFile(assetPath, { force: true })
  cy.wait('@postAsset')
  cy.get('div.asset-detail__meta-item div')
    .eq(3)
    .should('contain', assetSize)
}
function deleteAsset() {
  cy.get(`button[aria-label="Delete asset"]`)
    .should('be.visible')
    .click()
  cy.get('button[data-testid="delete-tab-modal-button"]')
    .should('be.visible')
    .click()
  cy.get('.custom-notification')
    .should('be.visible')
    .should('contain', 'The asset was successfully deleted')
}
function deletePermanentlyAsset() {
  cy.get('div.list-assets__navigation a')
    .eq(1)
    .click()
  cy.reload()
  cy.get('button.sb-button--danger')
    .should('be.visible')
    .click()
  cy.get('button[data-testid="perm-delete-asset-modal-button"]')
    .should('be.visible')
    .click()
}
function renameFolder({
  oldName,
  newName
}) {
  cy.get('span#asset-breadcrumb-actions-dropdown')
    .should('be.visible')
    .click()
  cy.get('button')
    .contains('Rename')
    .should('be.visible')
    .click()
  cy.get('input[name="folder-name"]')
    .should('have.value', oldName)
    .clear()
    .type(newName)
  cy.get('button[aria-label="Rename button"]')
    .should('be.visible')
    .and('be.enabled')
    .click()
  cy.get('.custom-notification')
    .should('be.visible')
    .should('contain', 'Folder renamed')
}
describe('Asset page tests', () => {
  beforeEach(() => {
    cy.login()
    accessAssetsOption({ spaceId: spaceId })
  })
  context('Assets tests', () => {
    let defaultAssetId = UTILS.ASSETS.defaultAsset.assetId
    let defaultAssetPath = UTILS.ASSETS.defaultAsset.assetPath
    let defaultAssetSize = UTILS.ASSETS.defaultAsset.assetSize
    let testAssetPath = UTILS.ASSETS.testAsset.assetPath
    let testAssetSize = UTILS.ASSETS.testAsset.assetSize
    let testAssetId
    let testAssetUrl
    it('Upload public asset', () => {
      const name = faker.word.sample()
      cy.intercept({
        method: 'POST',
        path: `/v1/spaces/${spaceId}/assets*`
      }).as('postAsset')

      cy.get('div.list-assets div.base-header button.sb-button--primary')
        .should('be.enabled')
        .and('be.visible')
      cy.uploadAsset({ assetName: name })

      cy.wait('@postAsset').then((response) => {
        testAssetId = response.response.body.id;
        testAssetUrl = response.response.body.pretty_url;
      }).then(() => {
        cy.get('div.assets-list')
          .find('img')
          .should('have.attr', 'src')
          .and('contain', testAssetUrl)
        openAsset({ assetId: testAssetId })
        deleteAsset()
        deletePermanentlyAsset()
      })
    })
    it('Upload private asset', () => {
      const name = faker.word.sample()
      cy.intercept({
        method: 'POST',
        path: `/v1/spaces/${spaceId}/assets*`
      }).as('postAsset')

      cy.get('div.list-assets div.base-header button.sb-button--primary')
        .should('be.enabled')
        .and('be.visible')
      cy.uploadAsset({ assetName: name, uploadType: 'private' })

      cy.wait('@postAsset').then((response) => {
        testAssetId = response.response.body.id;
      }).then(() => {
        cy.get(`div[data-intro-js-hint="asset-${testAssetId}"]`)
          .parents('.assets-list-item')
          .find('div.asset-private-preview p')
          .should('contain', 'Private Asset')
        openAsset({ assetId: testAssetId })
        deleteAsset()
        deletePermanentlyAsset()
      })
    })
    it('Replace asset from asset details', () => {
      cy.intercept({
        method: 'POST',
        path: `/v1/spaces/${spaceId}/assets*`
      }).as('postAsset')

      openAsset({ assetId: defaultAssetId })
      replaceAsset({ assetPath: testAssetPath, assetSize: testAssetSize })
      replaceAsset({ assetPath: defaultAssetPath, assetSize: defaultAssetSize })
    })
    it('Update asset from asset details', () => {
      const expirationDate = dayjs(faker.date.future()).format('YYYY-MM-DD HH:mm')
      cy.intercept({
        method: 'PUT',
        path: `/v1/spaces/${spaceId}/assets/*`
      }).as('putAsset')

      openAsset({ assetId: defaultAssetId })
      cy.get('input[data-testid="asset-form-overview-expired_at-input"]')
        .should('be.empty')
        .type(expirationDate)
      cy.get('input#asset-form-overview-title')
        .should('be.empty')
        .type('Title Test')
      cy.get('input#asset-form-overview-alt')
        .should('be.empty')
        .type('Alt Text Test')
      cy.get('input#asset-form-overview-copyright')
        .should('be.empty')
        .type('Copyright Test')
      cy.get('input#asset-form-overview-source')
        .should('be.empty')
        .type('Source Test')
      cy.get('button')
        .contains('Save & Close')
        .click()
      cy.get('.custom-notification')
        .should('be.visible')
        .should('contain', 'Asset successfully updated')
      cy.wait('@putAsset')

      openAsset({ assetId: defaultAssetId })
      cy.get('input[data-testid="asset-form-overview-expired_at-input"]')
        .clear()
      cy.get('input#asset-form-overview-title')
        .clear()
      cy.get('input#asset-form-overview-alt')
        .clear()
      cy.get('input#asset-form-overview-copyright')
        .clear()
      cy.get('input#asset-form-overview-source')
        .clear()
      cy.get('button')
        .contains('Save & Close')
        .click()
      cy.get('.custom-notification')
        .should('be.visible')
        .should('contain', 'Asset successfully updated')
      cy.wait('@putAsset')
    })
    it('Delete asset from asset details', () => {
      cy.intercept({
        method: 'POST',
        path: `/v1/spaces/${spaceId}/assets/bulk_destroy`
      }).as('postBulkDestroy')

      openAsset({ assetId: defaultAssetId })
      deleteAsset()
      cy.wait('@postBulkDestroy')
        .its('response.statusCode')
        .should('eq', 200)
      cy.get('div.list-assets__navigation a')
        .eq(1)
        .should('be.visible')
        .click()
      cy.reload()
      cy.get(`p[data-test-assetid="${defaultAssetId}"]`)
        .parents('.assets-list-item')
        .find('button.assets-list-item__restore')
        .click()
      cy.get('button[data-testid="restore-asset-modal-button"]')
        .should('be.visible')
        .click()
      cy.get('.custom-notification')
        .should('be.visible')
        .should('contain', 'The asset was successfully restored')
    })
  })
  context('Folders tests', () => {
    let defaultFolderName = UTILS.ASSETS.defaultFolderName
    it('Crate folder and delete it', () => {
      const name = faker.word.sample()
      cy.intercept({
        method: 'POST',
        path: `/v1/spaces/${spaceId}/asset_folders`
      }).as('postAssetFolders')

      cy.get('button[class*=new-folder]')
        .should('be.visible')
        .click()
      cy.get('input[name="folder-name"]')
        .should('be.empty')
        .type(name)
      cy.get('button[aria-label="Create button"]')
        .should('be.visible')
        .and('be.enabled')
        .click()
      cy.get('.custom-notification')
        .should('be.visible')
        .should('contain', 'Folder Created')
      cy.wait('@postAssetFolders')

      cy.get('div.vue-recycle-scroller')
        .contains(name)
        .click()

      cy.get('span#asset-breadcrumb-actions-dropdown')
        .should('be.visible')
        .click()
      cy.get('button')
        .contains('Delete')
        .should('be.visible')
        .click()
      cy.get('button[data-testid="delete-tab-modal-button"]')
        .should('be.visible')
        .click()
      cy.get('.custom-notification')
        .should('be.visible')
        .should('contain', 'The folder was successfully deleted')
    })
    it('Rename folder', () => {
      const name = faker.word.sample()
      cy.intercept({
        method: 'PUT',
        path: `/v1/spaces/${spaceId}/asset_folders/*`
      }).as('putAssetFolders')

      cy.get('div.vue-recycle-scroller')
        .contains(defaultFolderName)
        .click()

      renameFolder({ oldName: defaultFolderName, newName: name })
      cy.wait('@putAssetFolders')
      renameFolder({ oldName: name, newName: defaultFolderName })
      cy.wait('@putAssetFolders')
    })


  })
})