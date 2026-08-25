# Procurement Hub (POC 2)

CAP backend + React frontend for Multi-Vendor Collaborative Procurement & Logistics Hub.

## Backend

```bash
npm install
npm run watch
```

- API: http://localhost:4004
- Auth: Basic (password = username)

| User | Role |
|---|---|
| alice | VendorUser |
| bob | ProcurementManager |
| carol | VendorAdmin |
| dave | Auditor |

## Frontend (Day 6-7)

```bash
cd hub-frontend
npm install
npm run dev
```

- UI: http://localhost:5173
- Proxies /odata to CAP on :4004
- Switch mock user in the header Select

Screens: Dashboard (KPI / At-Risk / Shortfalls), Shipments list + Open POs, Contacts, Price Ledger.
Detail draft form: Day 8.