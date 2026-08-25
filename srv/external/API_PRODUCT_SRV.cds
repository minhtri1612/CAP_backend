@path: '/odata/v4/s4-product'
@(requires: 'authenticated-user')
service API_PRODUCT_SRV {
  entity Products {
    key Product            : String(40);
        ProductDescription : String(100);
        BaseUnit           : String(10);
  }
}
