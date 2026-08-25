# Demo script (PDF golden path)

Prep (2 terminals):

```bash
npx cds serve --port 4004
cd hub-frontend && npm run dev
```

Open http://localhost:5173 — keep the CAP terminal visible for mock Event Mesh / Alert / S/4 logs.

Password = username for all mock users.

---

## 1) Alex — VendorUser (`alice`) ~3 min

1. Header user → **Alice (VendorUser / Global Parts)**.
2. **Shipments** → section **Open Purchase Orders (mock S/4)** → pick an Open GP PO (e.g. `4500000123`) → **Create from PO**.
3. Detail draft tabs:
   - **General** — confirm PO / delivery date / vendor.
   - **Items** — add a line if empty (pick any product).
   - **Invoice** — upload any small PDF delivery note.
4. After upload, confirm **Tracking Number** + **Batch ID** are pre-filled (mock OCR).
5. **Finalize** → status **Shipped**.
6. CAP console: `[MOCK Event Mesh] hub/shipment/created`.
7. Negative: switch to **Erin (VendorUser / Acme)** → Shipments list must **not** show Alice’s new shipment.

## 2) Sarah — ProcurementManager (`bob`) ~3 min

1. Header → **Bob (ProcurementManager)**.
2. **Dashboard** — show KPIs, **At-Risk**, **Inventory Shortfalls**, delay chart.
3. Open an **Exception** shipment (seed or At-Risk row) → **Approve Exception**.
4. CAP console:
   - `[MOCK Alert Notification] email → …`
   - `[MOCK S/4] PATCH PurchaseOrder … StatisticalDeliveryDate=…`
5. Detail / response shows updated statistical delivery date (+2 days).
6. **Price Ledger** → pick SKU (e.g. bearing) → timeline vs baseline.

## 3) Carol — VendorAdmin (`carol`) ~30s

1. Header → **Carol**.
2. **Contacts** → create contact for Global Parts → save → appears in list.

## 4) Dave — Auditor (`dave`) ~30s

1. Header → **Dave**.
2. Can open **Price Ledger** (and audit data via API).
3. Shipments / Contacts writes are forbidden (403) — do not expect full ops UI.

---

## If live demo env breaks

| Step | Fallback evidence |
|------|-------------------|
| Finalize Event Mesh | CAP console screenshot / log line |
| Approve Exception | CAP console Alert + S/4 PATCH lines |
| RBAC | Switch alice → erin; list empty of Alice IDs |
| OCR | Tracking/Batch filled after PDF PUT |

Do **not** claim real BTP/S/4/XSUAA bindings — see README “mock vs real”.
