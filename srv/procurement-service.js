const cds = require('@sap/cds')

const LIST_SHIPMENT_COLUMNS = [
  'ID',
  'vendor_ID',
  'purchaseOrder',
  'status',
  'deliveryDate',
  'totalWeight',
  'trackingNumber',
  'batchId',
  'createdAt',
  'createdBy',
  'modifiedAt',
  'modifiedBy',
]

module.exports = class ProcurementService extends cds.ApplicationService {
  async init() {
    const { Shipments } = this.entities

    // SAVE = CREATE/UPDATE active (incl. draftActivate). Also validate draft writes.
    this.before('SAVE', Shipments, (req) => this.validateDeliveryDate(req))
    if (Shipments.drafts) {
      this.before(['CREATE', 'UPDATE'], Shipments.drafts, (req) => this.validateDeliveryDate(req))
    }
    this.before('READ', Shipments, (req) => this.limitShipmentReadPayload(req))

    this.on('atRiskShipments', () => [])
    this.on('inventoryShortfalls', () => [])

    return super.init()
  }

  /**
   * PDF Early Validation: deliveryDate must not be in the past.
   * `SAVE` covers CREATE / UPSERT / UPDATE (including draftActivate).
   */
  validateDeliveryDate(req) {
    const value = req.data?.deliveryDate
    if (value == null || value === '') return
    if (isPastUtcDay(value)) {
      req.error(400, 'Delivery date must not be in the past.')
    }
  }

  /**
   * PDF Performance: keep list payloads small.
   * Drop invoiceScan from collection reads unless the client $selects it.
   * Do not add extra $expand.
   */
  limitShipmentReadPayload(req) {
    const sel = req.query?.SELECT
    if (!sel || sel.one) return

    const cols = sel.columns
    if (!cols) {
      sel.columns = LIST_SHIPMENT_COLUMNS.map((name) => ({ ref: [name] }))
      return
    }

    sel.columns = cols.flatMap((col) => {
      if (col === '*' || col?.ref?.[0] === '*') {
        return LIST_SHIPMENT_COLUMNS.map((name) => ({ ref: [name] }))
      }
      if (Array.isArray(col?.ref) && col.ref.includes('invoiceScan')) return []
      return [col]
    })
  }
}

function isPastUtcDay(value) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return true
  const given = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  const now = new Date()
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  return given < today
}
