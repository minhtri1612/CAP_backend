# Procurement Hub (POC 2)

CAP backend for Multi-Vendor Collaborative Procurement & Logistics Hub.

## Run

```bash
npm install
npm run watch
```

- Service: http://localhost:4004
- OData: http://localhost:4004/odata/v4/procurement/$metadata

Auth is required (authenticated-user). Mock users (password = username):

| User | Role | VendorID |
|---|---|---|
| alice | VendorUser | Global Parts (11111111-1111-1111-1111-111111111111) |
| bob | ProcurementManager | - |
| carol | VendorAdmin | Global Parts |
| dave | Auditor | - |

Example: Authorization Basic alice / alice

## Day 2 checks

- Draft: POST /Shipments then PATCH draft (IsActiveEntity=false) then POST .../draftActivate
- Validation: deliveryDate in the past returns 400
- Functions (stubs): GET /atRiskShipments() and GET /inventoryShortfalls()