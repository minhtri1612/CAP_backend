# Day 6–7 (30–31/8) — React Frontend Khung Sườn + Executive Dashboard

## Mục tiêu
Vite app chạy, connect CAP; **Screen 1 PDF**: At-Risk Shipments + Inventory Shortfalls; Screen 2 list sẵn sàng.

## Task — Scaffold
- [x] `npm create vite@latest hub-frontend -- --template react-ts`
- [x] Dependencies: `@tanstack/react-query`, `@tanstack/react-table`, `@ui5/webcomponents-react`, `axios`, `react-router-dom`, chart lib (`recharts` hoặc `chart.js`)
- [x] Lazy loading routes (`React.lazy` + `Suspense`) — PDF Performance (có thể hoàn thiện Day 9)

- [x] `AppShell`:
  - Layout (header, nav, content)
  - Routing: `/dashboard`, `/shipments`, `/shipments/:id`, `/price-ledger`, `/contacts` (Vendor Admin)
  - Mock auth: axios interceptor gắn basic auth (user Day 5)

## Task — Screen 1: Executive Dashboard (PDF)
- [x] Backend: implement body functions Day 2:
  - `atRiskShipments()` — lead time / `deliveryDate` vs today; status Pending/Shipped/Exception; trả list “At-Risk”
  - `inventoryShortfalls()` — so `Products.stockQty` vs open demand từ `ShipmentItems` chưa Delivered
  - (Optional) `@sap/cds-analytics` / OData `$apply=aggregate` cho KPI theo status — PDF có nhắc analytics
- [x] `DashboardView`:
  - `KpiCard` — aggregate shipment theo status (`$apply` hoặc function)
  - **At-Risk panel** — gọi `atRiskShipments`
  - **Inventory Shortfalls panel** — gọi `inventoryShortfalls`
  - `ShipmentChart` / heat-map-style delay view (PDF Manager: heat map delays) — chart theo vendor hoặc ngày trễ

## Task — Screen 2 khung: Shipment Workspace
- [x] `DataTable` (TanStack Table) — list shipments sort/filter; `$select`/`$expand` gọn
- [x] Click row → `/shipments/:id` (DetailForm Day 8)
- [x] Nút “New Shipment” / “Create from PO” — list Open POs từ mock S/4 (READ `API_PURCHASEORDER_PROCESS`)
- [x] `FileUpload` skeleton (wire Day 8)
- [x] `Contacts` simple list+create (role VendorAdmin) — chứng minh PDF RBAC

## Rủi ro / lưu ý
- UI5 Web Components cần theme/CSS riêng.
- Basic auth interceptor = mock — README ghi rõ ≠ XSUAA token.

## Day 7 polish (completed)
- [x] Create from PO → `/shipments/new?po=...`
- [x] Shipment detail loads CAP + linked mock S/4 PO
- [x] Approve Exception button → `criticalDelay` + show StatisticalDeliveryDate
- [x] Role-aware Dashboard (shortfalls manager-only)
- [x] Mobile top nav when side nav hidden

