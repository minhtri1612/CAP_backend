# Procurement Hub (CAP POC 2)

CAP backend + React frontend for the Multi-Vendor Collaborative Procurement & Logistics Hub.

Vendors manage shipments in the hub (Clean Core - no vendor UI in S/4). Managers approve exceptions and review risk / price history.

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
| React UI | http://localhost:5173 (proxies `/odata` to `:4004`) |

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

### Mocked (contracts only - swap for BTP / S/4 later)

| Concern | Local mock | Production target |
|---------|------------|-------------------|
| Auth | CAP mocked users + Basic Auth | XSUAA / IAS + Destination |
| S/4 PO / BP / Product / Supplier Invoice | 4 app-services under `srv/external/` | Destination `S4_API` to real OData APIs |
| Document store | `./uploads` | BTP Document Management / Object Store |
| Event Mesh | `console.log` topic `hub/shipment/created` | SAP Event Mesh |
| Alert Notification | `console.log` email to manager | Alert Notification service |
| OCR / AI | Deterministic tracking/batch from file id | Document AI / custom OCR |
| Roles | `package.json` -> `cds.requires.auth.users` | IAS groups mapped to `xs-security.json` scopes |

**Do not claim** this POC is bound to a real BTP tenant, live S/4, XSUAA, DMS, Event Mesh, or Alert Notification. Names and contracts match the PDF; implementations are local mocks.

## BTP deploy (like reference Procurement_hub)

Production target: **HANA HDI** + **XSUAA** + **Destination** + **Connectivity** + **Approuter** + React static portal.

Local stays SQLite + mock Basic Auth. See [`BTP-DEPLOY.md`](BTP-DEPLOY.md) for Cockpit HANA free + `cf deploy` steps.

S/4 remains **embedded mock app-services** until you configure Destination name **`S4_API`**. Alert Notification uses real REST when bound, otherwise console mock.

## Demo

Step-by-step click script: [`DEMO.md`](DEMO.md) (Alex / Sarah / Carol / Dave).

## Key technical notes

- Draft keys: `Shipments(ID=...,IsActiveEntity=false|true)`
- Supplier to vendor UUID map (frontend): `GP001` / `ACME02` / ... in `hub-frontend/src/api/procurement.ts`
- Roles and VendorID attribute: see `xs-security.json` and mock `attr.VendorID` in `package.json`

## Submission package

Repo: https://github.com/minhtri1612/CAP_backend (branch `main`).

Include with the submission: this README, `DEMO.md`, plan docs `00-overview.md` + `day-01`...`day-10`, and the running instructions above. Screenshots/video of the golden path are optional evidence if live demo env fails.