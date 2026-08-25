# Procurement Hub (CAP POC 2)

CAP backend + React frontend for the Multi-Vendor Collaborative Procurement & Logistics Hub.

Vendors manage shipments in the hub (Clean Core — no vendor UI in S/4). Managers approve exceptions and review risk / price history.

## Quick start

```bash
npm install
npx cds serve --port 4004
```

```bash
cd hub-frontend
npm install
npm run dev
```

| App | URL |
|-----|-----|
| CAP OData | http://localhost:4004 |
| React UI | http://localhost:5173 (proxies `/odata` → `:4004`) |

Auth is **mocked Basic Auth** (password = username). Switch user in the UI header.

| User | Role | Scope |
|------|------|--------|
| `alice` | VendorUser | Global Parts |
| `erin` | VendorUser | Acme (cross-vendor negative tests) |
| `bob` | ProcurementManager | all vendors |
| `carol` | VendorAdmin | Global Parts contacts |
| `dave` | Auditor | PriceLedger + AuditLogs only |

## What is real (local) vs mocked

### Real in this repo

- CAP domain model + SQLite (`db/schema.cds`, draft-enabled Shipments)
- OData V4 service with validation, RBAC (`xs-security.json` + `srv/auth.cds`)
- Draft create / edit / activate UX
- Temporal PriceLedger (`sap-valid-at` / `sap-valid-from` / `sap-valid-to`) + AuditLogs
- Media upload to local filesystem (`./uploads/{id}.pdf`) with mock OCR pre-fill
- Custom action `criticalDelay` and dashboard functions `atRiskShipments` / `inventoryShortfalls`
- React screens: Dashboard, Shipments (+ draft detail), Price Ledger, Contacts

### Mocked (contracts only — swap for BTP / S/4 later)

| Concern | Local mock | Production target |
|---------|------------|-------------------|
| Auth | CAP mocked users + Basic Auth | XSUAA / IAS + Destination |
| S/4 PO / BP / Product / Supplier Invoice | 4 app-services under `srv/external/` | Destination `S4_API` → real OData APIs |
| Document store | `./uploads` | BTP Document Management / Object Store |
| Event Mesh | `console.log` topic `hub/shipment/created` | SAP Event Mesh |
| Alert Notification | `console.log` email to manager | Alert Notification service |
| OCR / AI | Deterministic tracking/batch from file id | Document AI / custom OCR |
| Roles | `package.json` → `cds.requires.auth.users` | IAS groups mapped to `xs-security.json` scopes |

## Demo journeys (Day 9)

**Alex (alice)** — Open POs → Create draft from PO → Upload PDF (OCR fills tracking/batch) → Finalize (`draftActivate`, status Shipped) → CAP console shows `[MOCK Event Mesh] hub/shipment/created`. Switch to **erin** — Alice’s shipments must not appear.

**Sarah (bob)** — Dashboard At-Risk + Shortfalls → open Exception shipment → Approve Exception (`criticalDelay`) → console shows Alert + `[MOCK S/4] PATCH … StatisticalDeliveryDate` → Price Ledger timeline for a SKU. Optional: **carol** creates a Contact; **dave** can read prices/audit only.

## Key technical notes

- Draft keys: `Shipments(ID=…,IsActiveEntity=false|true)`
- Supplier → vendor UUID map (frontend): `GP001` / `ACME02` / … in `hub-frontend/src/api/procurement.ts`
- Roles & VendorID attribute: see `xs-security.json` and mock `attr.VendorID` in `package.json`
