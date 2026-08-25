const cds = require('@sap/cds')
const { INSERT, UPDATE, SELECT } = cds.ql

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

const EVENT_TOPIC_CREATED = 'hub/shipment/created'
const ALERT_EMAIL = 'procurement-mgr@example.com'

module.exports = class ProcurementService extends cds.ApplicationService {
  async init() {
    const { Shipments, PriceLedger } = this.entities

    // SAVE = CREATE/UPDATE active (incl. draftActivate). Also validate draft writes.
    this.before('SAVE', Shipments, (req) => this.validateDeliveryDate(req))
    if (Shipments.drafts) {
      this.before(['CREATE', 'UPDATE'], Shipments.drafts, (req) => this.validateDeliveryDate(req))
    }
    this.before('READ', Shipments, (req) => this.limitShipmentReadPayload(req))

    this.before('UPDATE', PriceLedger, (req) => this.captureOldPrice(req))
    this.after(['CREATE', 'UPDATE'], PriceLedger, (data, req) => this.writePriceAudit(data, req))

    // Method must NOT be named criticalDelay — CAP auto-wires class methods by action name
    // with typed args (entity, keys…), not (req).
    this.on('criticalDelay', Shipments, (req) => this.handleCriticalDelay(req))
    this.after('draftActivate', Shipments, (data, req) => this.onShipmentActivated(data, req))

    this.on('atRiskShipments', () => [])
    this.on('inventoryShortfalls', () => [])

    return super.init()
  }

  validateDeliveryDate(req) {
    const value = req.data?.deliveryDate
    if (value == null || value === '') return
    if (isPastUtcDay(value)) {
      return req.reject(400, 'Delivery date must not be in the past.')
    }
  }

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

  async captureOldPrice(req) {
    if (req.data?.negotiatedPrice === undefined) return
    const key = normalizeKey(req.params?.[0] || req.data?.ID)
    if (!key) return
    const old = await SELECT.one.from(this.entities.PriceLedger, key).columns('negotiatedPrice')
    req._oldNegotiatedPrice = old?.negotiatedPrice ?? null
  }

  async writePriceAudit(data, req) {
    let rows = Array.isArray(data) ? data : data && typeof data === 'object' ? [data] : []
    // CAP may pass sparse after-results for temporal entities; fall back to request payload.
    if (!rows.length && req.data && typeof req.data === 'object') rows = [req.data]

    for (const row of rows) {
      const newValue = row.negotiatedPrice ?? req.data?.negotiatedPrice
      if (newValue === undefined) continue

      const oldValue = req.event === 'CREATE' ? null : (req._oldNegotiatedPrice ?? null)
      if (req.event === 'UPDATE' && String(oldValue) === String(newValue)) continue

      const entry = {
        ID: cds.utils.uuid(),
        entityName: 'PriceLedger',
        field: 'negotiatedPrice',
        oldValue: oldValue == null ? null : String(oldValue),
        newValue: String(newValue),
        changedBy: req.user?.id || 'anonymous',
        changedAt: new Date().toISOString(),
      }
      await cds.db.run(INSERT.into('hub.procurement.AuditLogs').entries(entry))
    }
  }

  async handleCriticalDelay(req) {
    const key = normalizeKey(req.params?.[0])
    if (!key?.ID) return req.reject(400, 'Shipment key is required.')

    await UPDATE(this.entities.Shipments, key).set({ status: 'Exception' })
    const updated = await SELECT.one.from(this.entities.Shipments, key)
    if (!updated) return req.reject(404, 'Shipment not found.')

    const payload = {
      shipmentId: updated.ID,
      vendorId: updated.vendor_ID,
      purchaseOrder: updated.purchaseOrder,
      deliveryDate: updated.deliveryDate,
      status: updated.status,
    }

    // PDF Side Effects — mock only (not real Event Mesh / Alert Notification).
    emitShipmentEvent(EVENT_TOPIC_CREATED, payload)
    emitAlertNotification({
      subject: 'Critical delay',
      shipmentId: payload.shipmentId,
      vendorId: payload.vendorId,
      deliveryDate: payload.deliveryDate,
    })

    // TODO Day 4: patch S/4 PO StatisticalDeliveryDate via cds.connect.to('API_PURCHASEORDER_PROCESS')

    return updated
  }

  onShipmentActivated(data) {
    const row = Array.isArray(data) ? data[0] : data
    if (!row) return
    if (row.status === 'Shipped' || row.status === 'Pending') {
      emitShipmentEvent(EVENT_TOPIC_CREATED, {
        shipmentId: row.ID,
        vendorId: row.vendor_ID,
        purchaseOrder: row.purchaseOrder,
        status: row.status,
      })
    }
  }
}

/** MOCK SAP Event Mesh — replace with real messaging when tenant is available. */
function emitShipmentEvent(topic, payload) {
  console.log(`[MOCK Event Mesh] ${topic}`, payload)
}

/** MOCK BTP Alert Notification email — replace with real Alert Notification service later. */
function emitAlertNotification(details) {
  console.log(`[MOCK Alert Notification] email → ${ALERT_EMAIL}`, details)
}

function normalizeKey(key) {
  if (key == null) return null
  if (typeof key === 'object') return key
  return { ID: key }
}

function isPastUtcDay(value) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return true
  const given = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  const now = new Date()
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  return given < today
}
