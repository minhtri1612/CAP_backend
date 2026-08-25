const cds = require('@sap/cds')
const store = require('./s4-store')
const { attachCrud } = require('./s4-crud')

module.exports = class API_BUSINESS_PARTNER extends cds.ApplicationService {
  async init() {
    attachCrud(this, 'BusinessPartners', store.businessPartners, 'BusinessPartner')
    return super.init()
  }
}
