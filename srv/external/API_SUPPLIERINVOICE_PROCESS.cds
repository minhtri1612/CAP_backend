@path: '/odata/v4/s4-supplier-invoice'
@(requires: 'authenticated-user')
service API_SUPPLIERINVOICE_PROCESS {
  entity SupplierInvoices {
    key SupplierInvoice : String(10);
        InvoiceStatus   : String(20);
        PurchaseOrder   : String(10);
  }
}
