# Day 8 (1/9) — Draft Form + OCR Wire + Approve→S/4 + Audit Timeline

## Mục tiêu
Full shipment flow PDF trên UI: draft → edit → upload → OCR pre-fill → finalize; Manager Approve Exception (PATCH S/4); Screen 3 Price Ledger timeline.

## Task — Screen 2 DetailForm (PDF Shipment Workspace)
- [x] Multi-tab:
  - **General Info** — vendor, `purchaseOrder`, `deliveryDate`, `status`, `totalWeight`, `trackingNumber`, `batchId`
  - **Items** — Composition line items add/remove (deep draft)
  - **Invoice** — `FileUpload` → PUT media (Day 4); sau upload refetch draft → **OCR đã pre-fill** tracking/batch hiện trên form
- [x] Mọi sửa → `PATCH` draft trước (chưa active)
- [x] **Finalize** → `POST .../draftActivate` → status hướng `Shipped` / Pending theo logic đã chọn; trigger mock Event Mesh (Day 3 helper)

## Task — Screen 3: Price Negotiation Ledger (PDF Temporal)
- [x] `AuditTimeline` / Price History:
  - Fetch `PriceLedger` theo SKU (`product`)
  - Vertical timeline (UI5 Timeline hoặc CSS)
  - Hiển thị trend vs `Products.basePrice` (S/4 baseline shadow)

## Task — Manager Approve Exception (PDF)
- [x] Nút **Approve Exception** → gọi bound action `criticalDelay`
- [x] UI confirm: status → Exception; toast/log hiện mock Alert Notification + S/4 PATCH StatisticalDeliveryDate (đọc lại PO từ mock để show date mới)

## Rủi ro / lưu ý
- Draft OData V4: tạo draft trước mới PATCH — sai thứ tự → 404/400.
- Multi-tab + TanStack Query cache — test không mất state khi đổi tab.
- OCR: nếu upload xong form chưa hiện tracking/batch → thiếu refetch sau PUT.

## Output cuối ngày
Tạo shipment từ UI (kèm PO) → draft → upload PDF → thấy tracking/batch → finalize; Approve Exception cập nhật mock S/4; xem Price History timeline.
