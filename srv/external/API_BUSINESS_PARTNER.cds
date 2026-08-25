@path: '/odata/v4/s4-business-partner'
@(requires: 'authenticated-user')
service API_BUSINESS_PARTNER {
  entity BusinessPartners {
    key BusinessPartner : String(10);
        SupplierName    : String(100);
        Country         : String(3);
  }
}
