const cds = require('@sap/cds')
const store = require('./s4-store')
const { attachCrud } = require('./s4-crud')

module.exports = class API_PRODUCT_SRV extends cds.ApplicationService {
  async init() {
    attachCrud(this, 'Products', store.products, 'Product')
    return super.init()
  }
}
