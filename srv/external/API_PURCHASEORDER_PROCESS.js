const cds = require('@sap/cds')
const store = require('./s4-store')
const { attachCrud } = require('./s4-crud')

module.exports = class API_PURCHASEORDER_PROCESS extends cds.ApplicationService {
  async init() {
    attachCrud(this, 'PurchaseOrders', store.purchaseOrders, 'PurchaseOrder')
    return super.init()
  }
}
