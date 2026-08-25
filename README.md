# Procurement Hub (POC 2)

CAP backend for Multi-Vendor Collaborative Procurement & Logistics Hub.

## Run

```bash
npm install
npm run watch
```

- Service: http://localhost:4004
- OData: http://localhost:4004/odata/v4/procurement/$metadata

## Mock auth (password = username)

| User | Role | VendorID |
|---|---|---|
| alice | VendorUser | Global Parts (11111111-1111-1111-1111-111111111111) |
| bob | ProcurementManager | global |
| carol | VendorAdmin | Global Parts |
| dave | Auditor | audit read-only |

Production: replace mocked auth with XSUAA/IAS using xs-security.json.

## Day 5 RBAC

- @restrict instance filter: endor_ID = $user.VendorID
- VendorUser: own Shipments R/W; Contacts read-only
- VendorAdmin: Contacts R/W own vendor; Shipments read-only
- ProcurementManager: global
- Auditor: PriceLedger + AuditLogs read-only

## Day 4 (backend)

- PUT /Shipments(...)/invoiceScan (PDF)
- Mock 4 S/4 APIs under /odata/v4/s4-*
- criticalDelay patches mock PO delivery date

React UI: Day 6-7 (not started yet).