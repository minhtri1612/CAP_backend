const cds = require('@sap/cds')
const { INSERT, UPDATE, SELECT } = cds.ql
const { saveInvoicePdf, mockOcrExtract, hasLocalInvoice } = require('./media-ocr')

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
    const draftAndActive = Shipments.drafts ? [Shipments, Shipments.drafts] : [Shipments]

    this.before('SAVE', Shipments, (req) => this.validateDeliveryDate(req))
    if (Shipments.drafts) {
      this.before(['CREATE', 'UPDATE'], Shipments.drafts, (req) => this.validateDeliveryDate(req))
    }
    this.before('READ', Shipments, (req) => this.limitShipmentReadPayload(req))
    this.after('READ', Shipments, (data) => this.mixinS4Status(data))

    this.before('UPDATE', PriceLedger, (req) => this.captureOldPrice(req))
    this.after(['CREATE', 'UPDATE'], PriceLedger, (data, req) => this.writePriceAudit(data, req))

    this.on(['PUT', 'UPDATE'], draftAndActive, (req, next) => this.handleInvoicePut(req, next))

    this.on('criticalDelay', Shipments, (req) => this.handleCriticalDelay(req))
    this.on('atRiskShipments', (req) => this.handleAtRiskShipments(req))
    this.on('inventoryShortfalls', (req) => this.handleInventoryShortfalls(req))
    this.on('syncVendorsFromS4', (req) => this.handleSyncVendors(req))
    this.on('syncProductsFromS4', (req) => this.handleSyncProducts(req))

    this.enforceVendorScopeOnWrite()

    await super.init()

    // lean-draft handles draftActivate inside `handle` and never runs after('draftActivate') handlers.
    const prevHandle = this.handle.bind(this)
    this.handle = async (req) => {
      const result = await prevHandle(req)
      if (req?.event === 'draftActivate') this.onShipmentActivated(result)
      return result
    }

    this.s4po = await cds.connect.to('API_PURCHASEORDER_PROCESS')
    this.s4bp = await cds.connect.to('API_BUSINESS_PARTNER')
    this.s4prod = await cds.connect.to('API_PRODUCT_SRV')
    this.s4inv = await cds.connect.to('API_SUPPLIERINVOICE_PROCESS')
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

  async mixinS4Status(results) {
    const rows = Array.isArray(results) ? results : results ? [results] : []
    if (!rows.length || !this.s4po) return

    const pos = await this.s4po.run(SELECT.from(this.s4po.entities.PurchaseOrders))
    const invs = await this.s4inv.run(SELECT.from(this.s4inv.entities.SupplierInvoices))
    const poMap = Object.fromEntries((pos || []).map((p) => [p.PurchaseOrder, p]))
    const invMap = Object.fromEntries((invs || []).map((i) => [i.PurchaseOrder, i]))

    for (const row of rows) {
      if (!row || typeof row !== 'object') continue
      const po = poMap[row.purchaseOrder]
      if (po) row.POStatus = po.POStatus
      if (row.ID && hasLocalInvoice(row.ID) && invMap[row.purchaseOrder]) {
        row.invoiceStatus = invMap[row.purchaseOrder].InvoiceStatus
      }
    }
  }

  async handleInvoicePut(req, next) {
    const media = req.data?.invoiceScan
    const key = normalizeKey(req.params?.[0])
    let saved = null
    if (media != null && key?.ID) {
      saved = await saveInvoicePdf(key.ID, media)
      if (saved?.buf) req.data.invoiceScan = saved.buf
    }

    const result = await next()

    if (saved?.filePath) {
      await new Promise((r) => setTimeout(r, 50))
      const ocr = mockOcrExtract(saved.filePath)
      const { Shipments } = this.entities
      const target = key.IsActiveEntity === false && Shipments.drafts ? Shipments.drafts : Shipments
      await UPDATE(target, key).set(ocr)
      if (result && typeof result === 'object') Object.assign(result, ocr)
    }
    return result
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
    if (!rows.length && req.data && typeof req.data === 'object') rows = [req.data]

    for (const row of rows) {
      const newValue = row.negotiatedPrice ?? req.data?.negotiatedPrice
      if (newValue === undefined) continue

      const oldValue = req.event === 'CREATE' ? null : (req._oldNegotiatedPrice ?? null)
      if (req.event === 'UPDATE' && String(oldValue) === String(newValue)) continue

      await cds.db.run(
        INSERT.into('hub.procurement.AuditLogs').entries({
          ID: cds.utils.uuid(),
          entityName: 'PriceLedger',
          field: 'negotiatedPrice',
          oldValue: oldValue == null ? null : String(oldValue),
          newValue: String(newValue),
          changedBy: req.user?.id || 'anonymous',
          changedAt: new Date().toISOString(),
        }),
      )
    }
  }

  async handleCriticalDelay(req) {
    const key = normalizeKey(req.params?.[0])
    if (!key?.ID) return req.reject(400, 'Shipment key is required.')

    const current = await SELECT.one.from(this.entities.Shipments, key)
    if (!current) return req.reject(404, 'Shipment not found.')

    // Exception → Approve (resolve + PATCH S/4). Otherwise → Flag Critical Delay.
    const approving = current.status === 'Exception'
    const nextStatus = approving ? 'Shipped' : 'Exception'
    await UPDATE(this.entities.Shipments, key).set({ status: nextStatus })
    const updated = await SELECT.one.from(this.entities.Shipments, key)

    const payload = {
      shipmentId: updated.ID,
      vendorId: updated.vendor_ID,
      purchaseOrder: updated.purchaseOrder,
      deliveryDate: updated.deliveryDate,
      status: updated.status,
      action: approving ? 'approveException' : 'flagCriticalDelay',
    }

    emitShipmentEvent(EVENT_TOPIC_CREATED, payload)
    await emitAlertNotification({
      subject: approving ? 'Exception approved' : 'Critical delay',
      shipmentId: payload.shipmentId,
      vendorId: payload.vendorId,
      deliveryDate: payload.deliveryDate,
    })

    const statisticalDate = await this.patchS4DeliveryDate(updated.purchaseOrder, updated.deliveryDate)
    if (statisticalDate) updated.StatisticalDeliveryDate = statisticalDate

    return updated
  }

  async patchS4DeliveryDate(purchaseOrder, deliveryDate) {
    if (!purchaseOrder || !this.s4po) return null
    const d = deliveryDate ? new Date(deliveryDate) : new Date()
    if (Number.isNaN(d.getTime())) return null
    d.setUTCDate(d.getUTCDate() + 2)
    const statisticalDate = d.toISOString().slice(0, 10)
    const { PurchaseOrders } = this.s4po.entities
    await this.s4po.run(
      UPDATE(PurchaseOrders).set({ StatisticalDeliveryDate: statisticalDate }).where({ PurchaseOrder: purchaseOrder }),
    )
    console.log(`[MOCK S/4] PATCH PurchaseOrder ${purchaseOrder} StatisticalDeliveryDate=${statisticalDate}`)
    return statisticalDate
  }

  async handleAtRiskShipments() {
    const { Shipments } = this.entities
    const rows = await SELECT.from(Shipments).where({
      status: { in: ['Pending', 'Shipped', 'Exception'] },
    })
    const today = startOfUtcDay(new Date())
    const horizon = new Date(today)
    horizon.setUTCDate(horizon.getUTCDate() + 7)

    return (rows || []).filter((s) => {
      if (!s.deliveryDate) return false
      const d = new Date(s.deliveryDate)
      if (Number.isNaN(d.getTime())) return false
      if (s.status === 'Exception') return true
      return d < horizon
    })
  }

  async handleInventoryShortfalls() {
    const products = await SELECT.from('hub.procurement.Products')
    const shipments = await SELECT.from('hub.procurement.Shipments').columns('ID', 'status')
    const openIds = new Set(
      (shipments || []).filter((s) => s.status !== 'Delivered').map((s) => s.ID),
    )
    const items = await SELECT.from('hub.procurement.ShipmentItems').columns(
      'parent_ID',
      'product_ID',
      'quantity',
    )

    const demand = {}
    for (const item of items || []) {
      if (!openIds.has(item.parent_ID) || !item.product_ID) continue
      demand[item.product_ID] = (demand[item.product_ID] || 0) + Number(item.quantity || 0)
    }

    const shortfalls = []
    for (const p of products || []) {
      const stockQty = Number(p.stockQty || 0)
      const openDemand = Number(demand[p.ID] || 0)
      const shortfall = Math.max(0, openDemand - stockQty)
      if (shortfall <= 0) continue
      shortfalls.push({
        product_ID: p.ID,
        sku: p.extProductId,
        stockQty,
        openDemand,
        shortfall,
      })
    }
    return shortfalls
  }

  enforceVendorScopeOnWrite() {
    const { Contacts, Shipments } = this.entities
    const vendorScoped = [Contacts, Shipments]
    if (Shipments.drafts) vendorScoped.push(Shipments.drafts)

    this.before(['CREATE', 'UPDATE'], Contacts, (req) => this.assertOwnVendor(req, 'vendor_ID'))
    this.before(['CREATE', 'UPDATE'], vendorScoped, (req) => this.assertOwnVendor(req, 'vendor_ID'))
  }

  assertOwnVendor(req, field) {
    if (req.user?.is?.('ProcurementManager')) return
    const vendorId = req.user?.attr?.VendorID
    if (!vendorId) return req.reject(403, 'Vendor scope is required for this operation.')
    const value = req.data?.[field]
    if (value != null && value !== vendorId) {
      return req.reject(403, 'Cannot access data outside your vendor scope.')
    }
    if (req.event === 'CREATE' && value == null) req.data[field] = vendorId
  }

  async handleSyncVendors() {
    const bps = await this.s4bp.run(SELECT.from(this.s4bp.entities.BusinessPartners))
    let n = 0
    for (const bp of bps || []) {
      const existing = await SELECT.one.from('hub.procurement.Vendors').where({ name: bp.SupplierName })
      if (existing) {
        await cds.db.run(UPDATE('hub.procurement.Vendors', existing.ID).set({ country: bp.Country }))
      } else {
        await cds.db.run(
          INSERT.into('hub.procurement.Vendors').entries({
            ID: cds.utils.uuid(),
            name: bp.SupplierName,
            taxId: bp.BusinessPartner,
            country: bp.Country,
          }),
        )
      }
      n++
    }
    return n
  }

  async handleSyncProducts() {
    const remote = await this.s4prod.run(SELECT.from(this.s4prod.entities.Products))
    let n = 0
    for (const p of remote || []) {
      const existing = await SELECT.one.from('hub.procurement.Products').where({ extProductId: p.Product })
      if (existing) {
        n++
        continue
      }
      await cds.db.run(
        INSERT.into('hub.procurement.Products').entries({
          ID: cds.utils.uuid(),
          extProductId: p.Product,
          basePrice: 0,
          stockQty: 0,
        }),
      )
      n++
    }
    return n
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

function emitShipmentEvent(topic, payload) {
  console.log(`[MOCK Event Mesh] ${topic}`, payload)
}

/**
 * BTP Alert Notification when service is bound; otherwise console mock (local / no entitlement).
 * Pattern aligned with Procurement_hub reference POC.
 */
async function emitAlertNotification(details) {
  const subject = details?.subject || 'Critical delay'
  const shipmentId = details?.shipmentId || 'unknown'
  const body =
    details?.body ||
    `Shipment ${shipmentId} vendor=${details?.vendorId || '-'} delivery=${details?.deliveryDate || '-'}`

  try {
    const ansCred =
      cds.env.requires?.['alert-notification']?.credentials ||
      cds.env.requires?.['procurement-hub-alert']?.credentials
    if (!ansCred?.oauth_url || !ansCred?.url) {
      console.log(`[MOCK Alert Notification] email → ${ALERT_EMAIL}`, details)
      return
    }

    const tokenRes = await fetch(`${ansCred.oauth_url}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: ansCred.client_id,
        client_secret: ansCred.client_secret,
      }),
    })
    const { access_token } = await tokenRes.json()
    const alertRes = await fetch(`${ansCred.url}/cf/producer/v1/resource-events`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventType: 'CRITICALDELAY',
        eventTimestamp: new Date().toISOString(),
        severity: 'WARNING',
        category: 'ALERT',
        subject,
        body,
        resource: {
          resourceName: 'procurement-hub',
          resourceType: 'Shipment',
          resourceInstance: shipmentId,
        },
      }),
    })
    if (!alertRes.ok) {
      console.error('[AlertNotification] API error:', alertRes.status, await alertRes.text())
    } else {
      console.log('[AlertNotification] Alert sent:', subject)
    }
  } catch (err) {
    console.error('[AlertNotification] Failed:', err.message)
    console.log(`[MOCK Alert Notification] email → ${ALERT_EMAIL}`, details)
  }
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

function startOfUtcDay(d) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}
