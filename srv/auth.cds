/**
 * Instance-level RBAC (PDF) — CAP @restrict with mock auth locally.
 * Production: bind xs-security.json roles/scopes to XSUAA / IAS.
 */

annotate ProcurementService.Shipments with @restrict: [
  { grant: '*', to: 'ProcurementManager' },
  { grant: '*', to: 'VendorUser', where: 'vendor_ID = $user.VendorID' },
  { grant: 'READ', to: 'VendorAdmin', where: 'vendor_ID = $user.VendorID' }
];

annotate ProcurementService.ShipmentItems with @restrict: [
  { grant: '*', to: 'ProcurementManager' },
  { grant: '*', to: 'VendorUser', where: 'exists parent { vendor_ID = $user.VendorID }' },
  { grant: 'READ', to: 'VendorAdmin', where: 'exists parent { vendor_ID = $user.VendorID }' }
];

annotate ProcurementService.Contacts with @restrict: [
  { grant: '*', to: 'ProcurementManager' },
  { grant: ['READ', 'WRITE'], to: 'VendorAdmin', where: 'vendor_ID = $user.VendorID' },
  { grant: 'READ', to: 'VendorUser', where: 'vendor_ID = $user.VendorID' }
];

annotate ProcurementService.Vendors with @restrict: [
  { grant: 'READ', to: 'ProcurementManager' },
  { grant: 'READ', to: ['VendorUser', 'VendorAdmin'], where: 'ID = $user.VendorID' }
];

annotate ProcurementService.Products with @restrict: [
  { grant: 'READ', to: ['ProcurementManager', 'VendorUser', 'VendorAdmin', 'Auditor'] }
];

annotate ProcurementService.PriceLedger with @restrict: [
  { grant: '*', to: 'ProcurementManager' },
  { grant: 'READ', to: 'VendorUser' },
  { grant: 'READ', to: 'Auditor' }
];

annotate ProcurementService.AuditLogs with @restrict: [
  { grant: 'READ', to: ['ProcurementManager', 'Auditor'] }
];
