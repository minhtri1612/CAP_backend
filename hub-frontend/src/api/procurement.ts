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

function values<T>(data: { value?: T[] } | T[]): T[] {
  return Array.isArray(data) ? data : data.value ?? []
}

export async function fetchShipments() {
  const { data } = await api.get<{ value: Shipment[] }>(
    '/procurement/Shipments',
    {
      params: {
        $select:
          'ID,vendor_ID,purchaseOrder,status,deliveryDate,totalWeight,trackingNumber,batchId,POStatus,invoiceStatus',
        $filter: 'IsActiveEntity eq true',
      },
    },
  )
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
  const { data } = await api.get<{ value: PurchaseOrder[] }>(
    '/s4-purchase-order/PurchaseOrders',
    { params: { $filter: "POStatus eq 'Open' or POStatus eq 'InDelivery'" } },
  )
  return values(data)
}

export async function fetchShipment(id: string) {
  const { data } = await api.get<Shipment>(
    `/procurement/Shipments(ID=${id},IsActiveEntity=true)`,
    {
      params: {
        $select:
          'ID,vendor_ID,purchaseOrder,status,deliveryDate,totalWeight,trackingNumber,batchId,POStatus,invoiceStatus',
      },
    },
  )
  return data
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
    `/procurement/Shipments(ID=${id},IsActiveEntity=true)/criticalDelay`,
    {},
  )
  return data
}

export async function fetchContacts() {
  const { data } = await api.get<{ value: Contact[] }>('/procurement/Contacts')
  return values(data)
}

export async function createContact(payload: Omit<Contact, 'ID'>) {
  const { data } = await api.post<Contact>('/procurement/Contacts', payload)
  return data
}

export async function fetchPriceLedger() {
  const { data } = await api.get<{ value: PriceLedger[] }>('/procurement/PriceLedger')
  return values(data)
}
