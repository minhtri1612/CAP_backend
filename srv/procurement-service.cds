using { hub.procurement as db } from '../db/schema';

/**
 * Day 1: minimal expose so $metadata + seed can be verified.
 * Draft, handlers, RBAC → Day 2+.
 */
service ProcurementService {
  entity Vendors       as projection on db.Vendors;
  entity Contacts      as projection on db.Contacts;
  entity Products      as projection on db.Products;
  entity Shipments     as projection on db.Shipments;
  entity ShipmentItems as projection on db.ShipmentItems;
  entity PriceLedger   as projection on db.PriceLedger;
  entity AuditLogs     as projection on db.AuditLogs;
}
