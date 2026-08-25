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

## Day 2

- Draft: POST /Shipments then PATCH draft (IsActiveEntity=false) then POST .../draftActivate
- Validation: deliveryDate in the past returns 400
- Functions (stubs): GET /atRiskShipments() and GET /inventoryShortfalls()

## Day 3

- Temporal PriceLedger: GET /PriceLedger?sap-valid-at=2025-06-15T00:00:00.000Z
- Audit: CREATE/PATCH PriceLedger writes AuditLogs (negotiatedPrice old/new)
- Action: POST /Shipments(ID=...,IsActiveEntity=true)/criticalDelay -> status Exception
- Mocks (console only, not real BTP): Event Mesh topic hub/shipment/created, Alert Notification email to procurement-mgr@example.com
- TODO Day 4: PATCH S/4 StatisticalDeliveryDate inside criticalDelay