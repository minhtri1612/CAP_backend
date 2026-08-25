# POC 2 — Multi-Vendor Collaborative Procurement & Logistics Hub
## Kế hoạch 10 ngày (25/8 → 3/9/2026)

Solo, from scratch, **full scope theo PDF gốc** (không cắt feature — phần BTP/S/4/IAS không có tenant thì **mock nhưng vẫn implement đúng contract**).

| Ngày | File | Chủ đề | Rủi ro |
|---|---|---|---|
| 1 (25/8) | `day-01-scaffold-data-model.md` | Scaffold CAP + `db/schema.cds` (đủ entity PDF) | Thấp |
| 2 (26/8) | `day-02-service-layer.md` | Service layer + Draft + Expand/Select | Trung bình |
| 3 (27/8) | `day-03-temporal-audit-action.md` | Temporal, audit, `criticalDelay` + Event Mesh + Alert Notification | Trung bình |
| 4 (28/8) | `day-04-media-stream-mock-s4.md` | Media + OCR pre-fill + mock **4** S/4 API + PATCH PO | **Cao** |
| 5 (29/8) | `day-05-rbac.md` | RBAC instance-level + Contacts (Vendor Admin) | **Cao** |
| 6–7 (30–31/8) | `day-06-07-react-frontend-skeleton.md` | React + Dashboard At-Risk / Inventory Shortfalls | Trung bình |
| 8 (1/9) | `day-08-draft-form-timeline.md` | Draft form + OCR wire + Approve→S/4 + Timeline | Trung bình |
| 9 (2/9) | `day-09-integration-test-polish.md` | Integration 2 journey PDF golden path | Trung bình |
| 10 (3/9) | `day-10-buffer-submission.md` | Buffer + nộp | — |

## Checklist khớp PDF (must-have)

### Elite CAP
- [x] Draft Handling (Fiori-like UX in React)
- [x] Media/Stream → mock BTP DMS (local FS), contract giống DMS
- [x] Temporal Data / Audit Logging (`@cds.on.insert` / `@cds.on.update`)
- [x] External Service Consumption — mock **4** S/4 OData APIs via `cds.connect.to`
- [x] Side Effects & Actions — `criticalDelay` → Event Mesh (mock) + **BTP Alert Notification / email** (mock)

### RBAC (PDF bảng role)
- [x] Vendor User — R/W chỉ `VendorID` của mình
- [x] Vendor Admin — tạo **Contact** records cho công ty mình
- [x] Procurement Mgr — global + Approve exception
- [x] Auditor — read-only Temporal/Audit logs

### React (3 screen PDF)
- [x] Screen 1: Executive Dashboard — At-Risk Shipments + Inventory Shortfalls (custom CAP functions / `$apply`)
- [x] Screen 2: Shipment Workspace — draft + PDF upload + OCR pre-fill Tracking/Batch
- [x] Screen 3: Price Negotiation Ledger — temporal timeline vs S/4 baseline

### Golden path PDF
- [x] Vendor: Open POs (live mock S/4) → Draft → Upload DN → OCR pre-fill → Finalize → Event Mesh
- [x] Manager: Dashboard heat map → Approve Exception → **PATCH Statistical Delivery Date về S/4** → Price History

### S/4 Communication Scenarios (mock local, tên API đúng PDF)
| API | Scenario | Purpose |
|---|---|---|
| `API_PURCHASEORDER_PROCESS_SRV` | SAP_COM_0053 | PO create/read/update; PATCH delivery date |
| `API_BUSINESS_PARTNER` | SAP_COM_0008 | Sync vendor details |
| `API_PRODUCT_SRV` | SAP_COM_0009 | SKU / UoM |
| `API_SUPPLIERINVOICE_PROCESS_SRV` | SAP_COM_0057 | Invoice status khi upload DN |

## Nguyên tắc mock (vẫn đủ “chuẩn PDF”)
Không có tenant/credentials → **mock implementation**, nhưng:
- Tên service / destination / topic / role **đúng PDF**
- Handler gọi đúng API surface (`cds.connect.to`, action, media PUT, temporal query)
- README liệt kê “mock vs thật” — không nói đã gắn tenant thật

| PDF component | Mock như thế nào |
|---|---|
| 4× S/4 OData APIs | Local CAP services + static JSON; Destination name `S4_API` |
| BTP DMS / Object Store | `./uploads/{id}.pdf` |
| Event Mesh topic `hub/shipment/created` | `console.log` + optional in-memory bus |
| BTP Alert Notification (email) | `console.log('[MOCK Alert Notification] email → …')` |
| AI Core OCR | Function trả `{ trackingNumber, batchId }` → PATCH draft |
| XSUAA / IAS | CAP mock auth users + attributes |

## Hai điểm rủi ro cao nhất
1. **Ngày 4** — mock `cds.connect.to` (4 API) + mix-in + OCR + PATCH PO về S/4
2. **Ngày 5** — RBAC instance-level + Contacts scope theo VendorID

Gặp vướng ở 2 ngày này, báo ngay để review code, đừng để dồn sang cuối tuần.
