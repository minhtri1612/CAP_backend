/**
 * In-memory mock of S/4HANA OData APIs (no tenant).
 * Destination name in PDF: S4_API.
 */

const purchaseOrders = [
  { PurchaseOrder: '4500000123', POStatus: 'Open', SupplierID: 'GP001', StatisticalDeliveryDate: '2026-09-10' },
  { PurchaseOrder: '4500000124', POStatus: 'InDelivery', SupplierID: 'GP001', StatisticalDeliveryDate: '2026-08-28' },
  { PurchaseOrder: '4500000201', POStatus: 'Delayed', SupplierID: 'ACME02', StatisticalDeliveryDate: '2026-08-20' },
  { PurchaseOrder: '4500000301', POStatus: 'Open', SupplierID: 'ORIENT03', StatisticalDeliveryDate: '2026-09-20' },
  { PurchaseOrder: '4500000888', POStatus: 'Open', SupplierID: 'GP001', StatisticalDeliveryDate: '2026-11-01' },
]

const businessPartners = [
  { BusinessPartner: 'GP001', SupplierName: 'Global Parts Ltd', Country: 'US' },
  { BusinessPartner: 'ACME02', SupplierName: 'Acme Supplies', Country: 'DE' },
  { BusinessPartner: 'ORIENT03', SupplierName: 'Orient Components', Country: 'VN' },
  { BusinessPartner: 'NORDIC04', SupplierName: 'Nordic Logistics', Country: 'SE' },
]

const products = [
  { Product: 'SKU-BEARING-6205', ProductDescription: 'Bearing 6205', BaseUnit: 'EA' },
  { Product: 'SKU-SEAL-NBR40', ProductDescription: 'NBR seal 40mm', BaseUnit: 'EA' },
  { Product: 'SKU-MOTOR-3KW', ProductDescription: 'Motor 3 kW', BaseUnit: 'EA' },
  { Product: 'SKU-SENSOR-PT100', ProductDescription: 'PT100 sensor', BaseUnit: 'EA' },
  { Product: 'SKU-CABLE-5M', ProductDescription: 'Cable 5 m', BaseUnit: 'M' },
  { Product: 'SKU-FILTER-HEPA', ProductDescription: 'HEPA filter', BaseUnit: 'EA' },
]

const supplierInvoices = [
  { SupplierInvoice: '5105600123', InvoiceStatus: 'Posted', PurchaseOrder: '4500000123' },
  { SupplierInvoice: '5105600124', InvoiceStatus: 'Open', PurchaseOrder: '4500000124' },
  { SupplierInvoice: '5105600201', InvoiceStatus: 'Parked', PurchaseOrder: '4500000201' },
]

module.exports = {
  purchaseOrders,
  businessPartners,
  products,
  supplierInvoices,
}
