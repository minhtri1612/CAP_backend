# Day 2 (26/8) — Service Layer cơ bản

## Mục tiêu
CRUD chạy được qua service, draft handling hoạt động end-to-end lần đầu; READ tối ưu Expand/Select theo PDF Performance.

## Task
- [ ] Viết `srv/procurement-service.cds`:
  - `service ProcurementService { ... }` expose:
    - `Vendors`, `Contacts`, `Products`, `Shipments`, `ShipmentItems`, `PriceLedger`, `AuditLogs`
  - Annotate `@odata.draft.enabled` trên `Shipments` (PDF Draft Handling)
  - Apply `@readonly` / `@insertonly` phù hợp:
    - `AuditLogs` → `@readonly` + `@insertonly` (hoặc chỉ insert từ hook, client không PATCH)
    - field audit / managed (`createdAt`, `modifiedAt`, …) readonly theo convention
  - Service level (chuẩn bị Day 5): `@(requires: 'authenticated-user')` — có thể bật sớm với mock user

- [ ] Viết `srv/procurement-service.js`:
  - Handler cơ bản nếu cần ngoài default CAP
  - **Performance (PDF §4)**: mọi READ list mặc định khuyến khích client `$select` / `$expand` có kiểm soát; trong handler `before('READ', 'Shipments')` có thể strip expand thừa nếu cần demo

- [ ] Custom CAP **functions** (chuẩn bị Dashboard PDF Screen 1 — implement body Day 6, khai báo sớm OK):
  ```
  function atRiskShipments() returns array of Shipments;
  function inventoryShortfalls() returns array of { product_ID: UUID; sku: String; stockQty: Decimal; openDemand: Decimal; shortfall: Decimal; };
  ```
  (Logic tính lead-time vs stock / open shipments — wire đầy đủ Day 6–7)

- [ ] Test CRUD qua Postman/REST client:
  - `GET /odata/v4/procurement/Shipments?$select=ID,status,deliveryDate&$expand=items($select=ID,quantity,unit)`
  - `POST` tạo mới, `PATCH` update, `DELETE`
  - CRUD `Contacts` cơ bản (RBAC siết Day 5)

- [ ] `srv.before('SAVE')` — validate `deliveryDate` không được ở quá khứ, reject message rõ (PDF Early Validation)

- [ ] Test draft flow đầy đủ:
  - `POST .../Shipments` → tạo draft
  - `PATCH` sửa draft (chưa commit DB chính)
  - `POST .../draftActivate` → move sang bảng active

## Rủi ro / lưu ý
- Draft entity CAP tự sinh bảng `_drafts` — đừng query nhầm bảng active khi debug.
- `srv.before('SAVE')` chạy trên Create/Update tuỳ config — check đúng event trong CAP docs.
- `$expand` sâu items + product dễ payload lớn — demo đúng PDF: luôn có `$select` kèm.

## Output cuối ngày
Draft → Activate flow chạy được qua Postman; validation `deliveryDate` hoạt động; READ demo Expand/Select; functions khai báo trong `.cds` (có stub trả `[]` tạm được).
