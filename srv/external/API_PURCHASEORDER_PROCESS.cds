@path: '/odata/v4/s4-purchase-order'
@(requires: 'authenticated-user')
service API_PURCHASEORDER_PROCESS {
  entity PurchaseOrders {
    key PurchaseOrder           : String(10);
        POStatus                : String(20);
        SupplierID              : String(40);
        StatisticalDeliveryDate : Date;
  }
}
