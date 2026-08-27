# Hub Frontend — Procurement Portal

React (Vite + TypeScript) UI for the Multi-Vendor Collaborative Procurement & Logistics Hub POC.

Talks to CAP OData at `/odata/v4` (proxied to `localhost:4004` in dev).

## Run

From repo root, start CAP first (`npx cds serve --port 4004`), then:

```bash
npm install
npm run dev
```

Open http://localhost:5173

Mock users (password = username): switch in the header — `alice`, `erin`, `bob`, `carol`, `dave`.

## Screens

| Route | Purpose |
|-------|---------|
| `/dashboard` | At-risk shipments + inventory shortfalls (manager) |
| `/shipments` | Workspace + open POs from mock S/4 |
| `/shipments/:id` | Draft form, PDF upload / OCR, Finalize, Flag Critical Delay / Approve Exception |
| `/price-ledger` | Temporal price history |
| `/contacts` | Vendor Admin contacts (scoped by `VendorID`) |

## Build

```bash
npm run build
```

Output: `dist/` (also packaged by MTA as static app on BTP).

## Notes

- Local auth: Basic Auth via axios interceptor (`src/api/client.ts`).
- On BTP (Approuter), relative `/odata` + XSUAA; mock user switcher is hidden.
- S/4, OCR, Event Mesh, Alert Notification are mocked in CAP — see root `README.md`.
