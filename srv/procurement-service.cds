using { hub.procurement as db } from '../db/schema';

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
  entity Shipments as projection on db.Shipments actions {
    /** Flags a critical delay: status → Exception + mock Event Mesh / Alert Notification. */
    action criticalDelay() returns Shipments;
  };

  entity ShipmentItems as projection on db.ShipmentItems;

  entity PriceLedger as projection on db.PriceLedger;

  /** Clients read only; hooks insert via db (Day 3). */
  @readonly
  entity AuditLogs as projection on db.AuditLogs;

  /** Dashboard Screen 1 — logic Day 6–7; stub returns [] today. */
  function atRiskShipments() returns array of Shipments;
  function inventoryShortfalls() returns array of InventoryShortfall;
}
