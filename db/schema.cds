namespace hub.procurement;

using { managed, cuid, temporal } from '@sap/cds/common';

entity Vendors : cuid, managed {
  name     : String(100);
  taxId    : String(50);
  country  : String(3);
  contacts : Association to many Contacts on contacts.vendor = $self;
}

entity Contacts : cuid, managed {
  vendor : Association to Vendors;
  name   : String(100);
  email  : String(100);
  phone  : String(40);
  role   : String(50);
}

entity Products : cuid, managed {
  extProductId : String(40);
  basePrice    : Decimal(15, 2);
  stockQty     : Decimal(13, 3);
}

entity Shipments : cuid, managed {
  vendor         : Association to Vendors;
  purchaseOrder  : String(20);
  status         : String enum {
    Draft;
    Pending;
    Shipped;
    Delivered;
    Exception
  } default 'Draft';
  deliveryDate   : DateTime;
  totalWeight    : Decimal(13, 3);
  trackingNumber : String(40);
  batchId        : String(40);
  items          : Composition of many ShipmentItems on items.parent = $self;
  @Core.MediaType: 'application/pdf'
  invoiceScan    : LargeBinary;
}

entity ShipmentItems : cuid {
  parent   : Association to Shipments;
  product  : Association to Products;
  quantity : Decimal(13, 3);
  unit     : String(10);
}

entity PriceLedger : cuid, temporal {
  product         : Association to Products;
  negotiatedPrice : Decimal(15, 2);
}

entity AuditLogs : cuid {
  entityName : String(100);
  field      : String(100);
  oldValue   : String;
  newValue   : String;
  changedBy  : String(100);
  changedAt  : Timestamp;
}
