using { hub.procurement as db } from '../db/schema';
using from './external/API_PURCHASEORDER_PROCESS';
using from './external/API_BUSINESS_PARTNER';
using from './external/API_PRODUCT_SRV';
using from './external/API_SUPPLIERINVOICE_PROCESS';

type InventoryShortfall {
  product_ID : UUID;
  sku        : String(40);
  stockQty   : Decimal(13, 3);
  openDemand : Decimal(13, 3);
  shortfall  : Decimal(13, 3);
}

@path: '/odata/v4/procurement'
@(requires: 'authenticated-user')
service ProcurementService {
  @readonly
  entity Vendors as projection on db.Vendors;

  entity Contacts as projection on db.Contacts;

  @readonly
  entity Products as projection on db.Products;

  @odata.draft.enabled
  entity Shipments as projection on db.Shipments {
    *,
    virtual POStatus       : String(20),
    virtual invoiceStatus  : String(20)
  } actions {
    /** Flag delay (→ Exception) or Approve Exception (→ Shipped) + mock S/4 PATCH / Alert. */
    @(requires: 'ProcurementManager')
    action criticalDelay() returns Shipments;
  };

  entity ShipmentItems as projection on db.ShipmentItems;

  entity PriceLedger as projection on db.PriceLedger;

  @readonly
  entity AuditLogs as projection on db.AuditLogs;

  function atRiskShipments() returns array of Shipments;

  @(requires: 'ProcurementManager')
  function inventoryShortfalls() returns array of InventoryShortfall;

  @(requires: 'ProcurementManager')
  function syncVendorsFromS4() returns Integer;
  @(requires: 'ProcurementManager')
  function syncProductsFromS4() returns Integer;
}
