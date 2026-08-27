import { api } from './client'

export type Shipment = {
  ID: string
  vendor_ID?: string
  purchaseOrder?: string
  status?: string
  deliveryDate?: string
  totalWeight?: number
  trackingNumber?: string
  batchId?: string
  POStatus?: string
  invoiceStatus?: string
  IsActiveEntity?: boolean
  items?: ShipmentItem[]
}

export type ShipmentItem = {
  ID: string
  parent_ID?: string
  product_ID?: string
  quantity?: number
  unit?: string
  IsActiveEntity?: boolean
}

export type Contact = {
  ID: string
  vendor_ID?: string
  name?: string
  email?: string
  phone?: string
  role?: string
}

export type InventoryShortfall = {
  product_ID: string
  sku: string
  stockQty: number
  openDemand: number
  shortfall: number
}

export type PurchaseOrder = {
  PurchaseOrder: string
  POStatus: string
  SupplierID: string
  StatisticalDeliveryDate?: string
}

export type PriceLedger = {
  ID: string
  product_ID?: string
  negotiatedPrice?: number
  validFrom?: string
  validTo?: string
}

export type Product = {
  ID: string
  extProductId?: string
  basePrice?: number
  stockQty?: number
}

export type Vendor = {
  ID: string
  name?: string
  country?: string
}

export const SUPPLIER_TO_VENDOR: Record<string, string> = {
  GP001: '11111111-1111-1111-1111-111111111111',
  ACME02: '22222222-2222-2222-2222-222222222222',
  ORIENT03: '33333333-3333-3333-3333-333333333333',
  NORDIC04: '44444444-4444-4444-4444-444444444444',
}

function values<T>(data: { value?: T[] } | T[]): T[] {
  return Array.isArray(data) ? data : data.value ?? []
}

function shipmentKey(id: string, isActive: boolean) {
  return `ID=${id},IsActiveEntity=${isActive}`
}

export async function fetchShipments() {
  const { data } = await api.get<{ value: Shipment[] }>('/procurement/Shipments', {
    params: {
      $select:
        'ID,vendor_ID,purchaseOrder,status,deliveryDate,totalWeight,trackingNumber,batchId,POStatus,invoiceStatus',
      $filter: 'IsActiveEntity eq true',
    },
  })
  return values(data)
}

export async function fetchAtRiskShipments() {
  const { data } = await api.get<{ value: Shipment[] }>('/procurement/atRiskShipments()')
  return values(data)
}

export async function fetchInventoryShortfalls() {
  const { data } = await api.get<{ value: InventoryShortfall[] }>(
    '/procurement/inventoryShortfalls()',
  )
  return values(data)
}

export async function fetchOpenPurchaseOrders() {
  const { data } = await api.get<{ value: PurchaseOrder[] }>('/s4-purchase-order/PurchaseOrders', {
    params: { $select: 'PurchaseOrder,POStatus,SupplierID,StatisticalDeliveryDate' },
  })
  // Mock S/4 app-service ignores $filter; keep Open / InDelivery client-side.
  return values(data).filter((po) => po.POStatus === 'Open' || po.POStatus === 'InDelivery')
}

export async function fetchShipment(id: string, isActive = true) {
  const { data } = await api.get<Shipment>(
    `/procurement/Shipments(${shipmentKey(id, isActive)})`,
    {
      params: {
        $select:
          'ID,vendor_ID,purchaseOrder,status,deliveryDate,totalWeight,trackingNumber,batchId,POStatus,invoiceStatus,IsActiveEntity',
        $expand: 'items($select=ID,product_ID,quantity,unit,IsActiveEntity)',
      },
    },
  )
  return data
}

export async function createDraftShipment(
  payload: Omit<Partial<Shipment>, 'items'> & {
    items?: Array<{ product_ID: string; quantity: number; unit: string }>
  },
) {
  const { data } = await api.post<Shipment>('/procurement/Shipments', payload)
  return data
}

export async function patchShipment(
  id: string,
  isActive: boolean,
  payload: Partial<Shipment>,
) {
  const { data } = await api.patch<Shipment>(
    `/procurement/Shipments(${shipmentKey(id, isActive)})`,
    payload,
    { headers: { 'If-Match': '*' } },
  )
  return data
}

export async function draftEdit(id: string) {
  const { data } = await api.post<Shipment>(
    `/procurement/Shipments(${shipmentKey(id, true)})/draftEdit`,
    { PreserveChanges: false },
  )
  return data
}

export async function draftActivate(id: string) {
  const { data } = await api.post<Shipment>(
    `/procurement/Shipments(${shipmentKey(id, false)})/draftActivate`,
    {},
    { headers: { 'If-Match': '*' } },
  )
  return data
}

export async function addShipmentItem(
  shipmentId: string,
  isActive: boolean,
  item: { product_ID: string; quantity: number; unit: string },
) {
  const { data } = await api.post<ShipmentItem>(
    `/procurement/Shipments(${shipmentKey(shipmentId, isActive)})/items`,
    item,
  )
  return data
}

export async function deleteShipmentItem(itemId: string, isActive: boolean) {
  await api.delete(`/procurement/ShipmentItems(${shipmentKey(itemId, isActive)})`, {
    headers: { 'If-Match': '*' },
  })
}

export async function uploadInvoiceScan(id: string, isActive: boolean, file: File) {
  const buf = await file.arrayBuffer()
  await api.put(
    `/procurement/Shipments(${shipmentKey(id, isActive)})/invoiceScan`,
    buf,
    { headers: { 'Content-Type': 'application/pdf', 'If-Match': '*' } },
  )
  return fetchShipment(id, isActive)
}

export async function fetchPurchaseOrder(po: string) {
  const { data } = await api.get<PurchaseOrder>(
    `/s4-purchase-order/PurchaseOrders('${po}')`,
  )
  return data
}

export type CriticalDelayResult = Shipment & {
  StatisticalDeliveryDate?: string
}

export async function criticalDelay(id: string) {
  const { data } = await api.post<CriticalDelayResult>(
    `/procurement/Shipments(${shipmentKey(id, true)})/criticalDelay`,
    {},
  )
  return data
}

export async function fetchContacts() {
  const { data } = await api.get<{ value: Contact[] }>('/procurement/Contacts')
  return values(data)
}

export async function fetchVendors() {
  const { data } = await api.get<{ value: Vendor[] }>('/procurement/Vendors', {
    params: { $select: 'ID,name,country' },
  })
  return values(data)
}

export async function createContact(payload: Omit<Contact, 'ID'>) {
  const { data } = await api.post<Contact>('/procurement/Contacts', payload)
  return data
}

export async function fetchProducts() {
  const { data } = await api.get<{ value: Product[] }>('/procurement/Products')
  return values(data)
}

export async function fetchPriceLedger() {
  const { data } = await api.get<{ value: PriceLedger[] }>('/procurement/PriceLedger')
  return values(data)
}

/** Temporal history across a wide window (CAP sap-valid-from / sap-valid-to). */
export async function fetchPriceLedgerHistory(productId?: string) {
  const { data } = await api.get<{ value: PriceLedger[] }>('/procurement/PriceLedger', {
    params: {
      'sap-valid-from': '2020-01-01T00:00:00.000Z',
      'sap-valid-to': '2030-12-31T23:59:59.000Z',
      ...(productId
        ? { $filter: `product_ID eq ${productId}` }
        : {}),
      $orderby: 'validFrom asc',
    },
  })
  return values(data)
}
